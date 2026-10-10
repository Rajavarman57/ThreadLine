import { prisma } from "@/lib/db";
import { Prisma, Role, POStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { nextNumber } from "@/lib/counters";
import {
  createPurchaseOrderSchema,
  CreatePurchaseOrderInput,
  PurchaseLineInput,
} from "./schemas/orders";

export async function getPurchaseOrders(params: {
  page?: number;
  pageSize?: number;
  status?: POStatus;
  supplierId?: string;
}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 15;
  const skip = (page - 1) * pageSize;

  const where: Prisma.PurchaseOrderWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.supplierId ? { supplierId: params.supplierId } : {}),
  };

  const [total, data] = await Promise.all([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        supplier: { select: { id: true, name: true, phone: true } },
        lines: {
          include: {
            yarnType: {
              select: { id: true, type: true, colour: true, unit: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const convertedData = data.map((po) => ({
    ...po,
    lines: po.lines.map((l) => ({
      ...l,
      qty: Number(l.qty),
      receivedQty: Number(l.receivedQty),
      rate: Number(l.rate),
    })),
  }));

  return {
    data: convertedData,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize) || 1,
  };
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput) {
  const user = await requireRole([Role.ADMIN, Role.STORE]);
  const validated = createPurchaseOrderSchema.parse(input);

  const poNo = await nextNumber("po", "PO-");

  const po = await prisma.$transaction(async (tx) => {
    return tx.purchaseOrder.create({
      data: {
        poNo,
        supplierId: validated.supplierId,
        status: POStatus.DRAFT,
        lines: {
          create: validated.lines.map((l) => ({
            yarnTypeId: l.yarnTypeId,
            qty: new Prisma.Decimal(l.qty),
            rate: new Prisma.Decimal(l.rate),
            receivedQty: new Prisma.Decimal(0),
          })),
        },
      },
      include: {
        lines: true,
        supplier: true,
      },
    });
  });

  await logAction({
    userId: user.id,
    action: "CREATE_PURCHASE_ORDER",
    entity: "PurchaseOrder",
    entityId: po.id,
    meta: { poNo: po.poNo, supplierId: po.supplierId },
  });

  return po;
}

export async function updatePOStatus(poId: string, status: POStatus) {
  const user = await requireRole([Role.ADMIN, Role.STORE]);
  const po = await prisma.purchaseOrder.update({
    where: { id: poId },
    data: { status },
  });

  await logAction({
    userId: user.id,
    action: `UPDATE_PO_STATUS_${status}`,
    entity: "PurchaseOrder",
    entityId: po.id,
    meta: { status },
  });

  return po;
}

/**
 * Automatically creates a Purchase Order for identified material shortfalls.
 */
export async function createPOForShortfall(
  supplierId: string,
  lines: Array<{ yarnTypeId: string; qty: number; rate?: number }>
) {
  const defaultLines: PurchaseLineInput[] = await Promise.all(
    lines.map(async (l) => {
      let rate = l.rate;
      if (!rate) {
        const yarn = await prisma.yarnType.findUnique({
          where: { id: l.yarnTypeId },
        });
        rate = yarn ? Number(yarn.ratePerUnit) : 300;
      }
      return {
        yarnTypeId: l.yarnTypeId,
        qty: l.qty,
        rate,
      };
    })
  );

  return createPurchaseOrder({
    supplierId,
    lines: defaultLines,
  });
}
