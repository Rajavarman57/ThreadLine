import { prisma } from "@/lib/db";
import { Prisma, Role, QCStatus, OrderStatus, InvoiceStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { nextNumber } from "@/lib/counters";
import {
  createDispatchSchema,
  CreateDispatchInput,
  dispatchFilterSchema,
  DispatchFilterInput,
  DEFAULT_TAX_PCT,
} from "./schemas/dispatch";

// ----------------------------------------------------------------------------
// 1. FINISHED GOODS (UNDISPATCHED PASSED ROLLS)
// ----------------------------------------------------------------------------

export interface FinishedGoodsOrderSummary {
  orderId: string;
  orderNo: string;
  buyerId: string;
  buyerName: string;
  fabricType: string;
  colour: string;
  ratePerMetre: number;
  orderQtyMetres: number;
  rollCount: number;
  totalMetres: number;
  rolls: Array<{
    id: string;
    rollNo: string;
    lengthM: number;
    machineCode?: string;
  }>;
}

export interface FinishedGoodsSummary {
  overallReadyMetres: number;
  totalPassedUndispatchedRolls: number;
  orders: FinishedGoodsOrderSummary[];
}

/**
 * Lists rolls with qcStatus PASSED and no dispatchId grouped by order,
 * showing roll count and total metres per order and buyer, plus overall ready metres.
 */
export async function getFinishedGoodsSummary(): Promise<FinishedGoodsSummary> {
  // SUPERVISOR and QC can read; ADMIN, STORE, ACCOUNTS can also read
  await requireRole([
    Role.ADMIN,
    Role.STORE,
    Role.ACCOUNTS,
    Role.SUPERVISOR,
    Role.QC,
  ]);

  const readyRolls = await prisma.roll.findMany({
    where: {
      qcStatus: QCStatus.PASSED,
      dispatchId: null,
    },
    include: {
      order: {
        include: {
          buyer: true,
        },
      },
      machine: {
        select: { code: true },
      },
    },
    orderBy: { rollNo: "asc" },
  });

  let overallReadyMetres = 0;
  const orderMap = new Map<string, FinishedGoodsOrderSummary>();

  for (const r of readyRolls) {
    const metres = Number(r.lengthM);
    overallReadyMetres += metres;

    let group = orderMap.get(r.orderId);
    if (!group) {
      group = {
        orderId: r.order.id,
        orderNo: r.order.orderNo,
        buyerId: r.order.buyerId,
        buyerName: r.order.buyer.name,
        fabricType: r.order.fabricType,
        colour: r.order.colour,
        ratePerMetre: Number(r.order.ratePerMetre),
        orderQtyMetres: Number(r.order.qtyMetres),
        rollCount: 0,
        totalMetres: 0,
        rolls: [],
      };
      orderMap.set(r.orderId, group);
    }

    group.rollCount += 1;
    group.totalMetres = Number((group.totalMetres + metres).toFixed(2));
    group.rolls.push({
      id: r.id,
      rollNo: r.rollNo,
      lengthM: metres,
      machineCode: r.machine?.code,
    });
  }

  return {
    overallReadyMetres: Number(overallReadyMetres.toFixed(2)),
    totalPassedUndispatchedRolls: readyRolls.length,
    orders: Array.from(orderMap.values()),
  };
}

/**
 * Gets specific order details with its undispatched passed rolls for creating a dispatch.
 */
export async function getOrderForDispatch(orderId: string) {
  await requireRole([Role.ADMIN, Role.STORE, Role.ACCOUNTS]);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: true,
      rolls: {
        where: {
          qcStatus: QCStatus.PASSED,
          dispatchId: null,
        },
        orderBy: { rollNo: "asc" },
      },
    },
  });

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  return {
    id: order.id,
    orderNo: order.orderNo,
    buyerName: order.buyer.name,
    fabricType: order.fabricType,
    colour: order.colour,
    ratePerMetre: Number(order.ratePerMetre),
    orderQtyMetres: Number(order.qtyMetres),
    taxPct: DEFAULT_TAX_PCT,
    rolls: order.rolls.map((r) => ({
      id: r.id,
      rollNo: r.rollNo,
      lengthM: Number(r.lengthM),
    })),
  };
}

// ----------------------------------------------------------------------------
// 2. ATOMIC RACE-SAFE CREATE DISPATCH
// ----------------------------------------------------------------------------

export interface CreateDispatchResult {
  dispatchId: string;
  dispatchNo: string;
  invoiceId: string;
  invoiceNo: string;
}

/**
 * Race-safe transaction dispatching rolls and creating the invoice.
 * Roles: ADMIN, STORE, ACCOUNTS
 */
export async function createDispatch(
  orderId: string,
  rollIds: string[],
  vehicleNo: string,
  driver: string
): Promise<CreateDispatchResult> {
  const user = await requireRole([Role.ADMIN, Role.STORE, Role.ACCOUNTS]);

  const validated = createDispatchSchema.parse({
    orderId,
    rollIds,
    vehicleNo,
    driver,
  });

  const result = await prisma.$transaction(
    async (tx) => {
      // 1. Verify Order exists
      const order = await tx.order.findUnique({
        where: { id: validated.orderId },
        select: { id: true, orderNo: true, ratePerMetre: true, buyerId: true },
      });
      if (!order) {
        throw new Error(`Order ${validated.orderId} not found.`);
      }

      // 2. Fetch exact rolls to compute total length and ensure they belong to this order
      const rolls = await tx.roll.findMany({
        where: {
          id: { in: validated.rollIds },
          orderId: validated.orderId,
        },
        select: { id: true, lengthM: true, qcStatus: true, dispatchId: true },
      });

      if (rolls.length !== validated.rollIds.length) {
        throw new Error("One or more selected rolls do not belong to this order.");
      }

      for (const r of rolls) {
        if (r.qcStatus !== QCStatus.PASSED) {
          throw new Error("Only rolls with QCStatus PASSED can be dispatched.");
        }
        if (r.dispatchId !== null) {
          throw new Error("One or more selected rolls have already been dispatched.");
        }
      }

      const totalMetres = rolls.reduce(
        (sum, r) => sum + Number(r.lengthM),
        0
      );

      // 3. Generate Dispatch and Invoice sequential numbers using atomic counters
      const dispatchNo = await nextNumber("dispatch", "DSP-", 6, tx);
      const invoiceNo = await nextNumber("invoice", "INV-", 6, tx);

      // 4. Create Dispatch record
      const dispatch = await tx.dispatch.create({
        data: {
          dispatchNo,
          orderId: validated.orderId,
          vehicleNo: validated.vehicleNo.trim(),
          driver: validated.driver.trim(),
          dispatchedAt: new Date(),
        },
      });

      // 5. Atomic race-safe claim of all requested rolls
      // If another transaction concurrently claimed any roll, count < length.
      const claimResult = await tx.roll.updateMany({
        where: {
          id: { in: validated.rollIds },
          orderId: validated.orderId,
          qcStatus: QCStatus.PASSED,
          dispatchId: null,
        },
        data: {
          dispatchId: dispatch.id,
        },
      });

      if (claimResult.count !== validated.rollIds.length) {
        throw new Error(
          "One or more selected rolls have already been dispatched or are not in PASSED state."
        );
      }

      // 6. Create DispatchLines
      await tx.dispatchLine.createMany({
        data: validated.rollIds.map((rollId) => ({
          dispatchId: dispatch.id,
          rollId,
        })),
      });

      // 7. Calculate Invoice Amounts
      const rate = Number(order.ratePerMetre);
      const subtotal = Number((totalMetres * rate).toFixed(2));
      const taxAmount = Number(((subtotal * DEFAULT_TAX_PCT) / 100).toFixed(2));
      const total = Number((subtotal + taxAmount).toFixed(2));

      // 8. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          dispatchId: dispatch.id,
          subtotal: new Prisma.Decimal(subtotal),
          taxPct: new Prisma.Decimal(DEFAULT_TAX_PCT),
          total: new Prisma.Decimal(total),
          status: InvoiceStatus.UNPAID,
        },
      });

      // 9. Check if all PASSED rolls of this order are now dispatched
      const remainingPassedRolls = await tx.roll.count({
        where: {
          orderId: validated.orderId,
          qcStatus: QCStatus.PASSED,
          dispatchId: null,
        },
      });

      if (remainingPassedRolls === 0) {
        await tx.order.update({
          where: { id: validated.orderId },
          data: { status: OrderStatus.DISPATCHED },
        });
      }

      return {
        dispatchId: dispatch.id,
        dispatchNo,
        invoiceId: invoice.id,
        invoiceNo,
        orderNo: order.orderNo,
        totalMetres,
        total,
      };
    },
    {
      maxWait: 10000,
      timeout: 15000,
    }
  );

  // 10. Write AuditLog outside the interactive transaction closure
  await logAction({
    userId: user?.id,
    action: "DISPATCH_CREATED",
    entity: "Dispatch",
    entityId: result.dispatchId,
    meta: {
      dispatchNo: result.dispatchNo,
      orderNo: result.orderNo,
      rollCount: validated.rollIds.length,
      totalMetres: result.totalMetres,
      invoiceNo: result.invoiceNo,
      total: result.total,
    },
  });

  return {
    dispatchId: result.dispatchId,
    dispatchNo: result.dispatchNo,
    invoiceId: result.invoiceId,
    invoiceNo: result.invoiceNo,
  };
}

// ----------------------------------------------------------------------------
// 3. DISPATCH HISTORY & DETAILS
// ----------------------------------------------------------------------------

export interface DispatchHistoryItem {
  id: string;
  dispatchNo: string;
  orderId: string;
  orderNo: string;
  buyerName: string;
  vehicleNo: string;
  driver: string;
  dispatchedAt: string;
  rollCount: number;
  totalMetres: number;
  invoiceNo?: string;
  invoiceStatus?: string;
  invoiceTotal?: number;
}

export interface PaginatedDispatches {
  items: DispatchHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getDispatchHistory(
  input: DispatchFilterInput
): Promise<PaginatedDispatches> {
  await requireRole([
    Role.ADMIN,
    Role.STORE,
    Role.ACCOUNTS,
    Role.SUPERVISOR,
    Role.QC,
  ]);

  const validated = dispatchFilterSchema.parse(input);
  const { page, pageSize, orderId, search } = validated;

  const whereClause: Prisma.DispatchWhereInput = {};

  if (orderId) {
    whereClause.orderId = orderId;
  }

  if (search && search.trim().length > 0) {
    const s = search.trim();
    whereClause.OR = [
      { dispatchNo: { contains: s, mode: "insensitive" } },
      { vehicleNo: { contains: s, mode: "insensitive" } },
      { driver: { contains: s, mode: "insensitive" } },
      { order: { orderNo: { contains: s, mode: "insensitive" } } },
      { order: { buyer: { name: { contains: s, mode: "insensitive" } } } },
    ];
  }

  const [total, dispatches] = await Promise.all([
    prisma.dispatch.count({ where: whereClause }),
    prisma.dispatch.findMany({
      where: whereClause,
      include: {
        order: {
          include: {
            buyer: true,
          },
        },
        invoice: true,
        rolls: {
          select: { lengthM: true },
        },
      },
      orderBy: { dispatchedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const items: DispatchHistoryItem[] = dispatches.map((d) => {
    const totalMetres = d.rolls.reduce(
      (acc, r) => acc + Number(r.lengthM),
      0
    );

    return {
      id: d.id,
      dispatchNo: d.dispatchNo,
      orderId: d.orderId,
      orderNo: d.order.orderNo,
      buyerName: d.order.buyer.name,
      vehicleNo: d.vehicleNo,
      driver: d.driver,
      dispatchedAt: d.dispatchedAt.toISOString(),
      rollCount: d.rolls.length,
      totalMetres: Number(totalMetres.toFixed(2)),
      invoiceNo: d.invoice?.invoiceNo,
      invoiceStatus: d.invoice?.status,
      invoiceTotal: d.invoice ? Number(d.invoice.total) : undefined,
    };
  });

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
  };
}

export interface DispatchDetail {
  id: string;
  dispatchNo: string;
  dispatchedAt: string;
  vehicleNo: string;
  driver: string;
  order: {
    id: string;
    orderNo: string;
    fabricType: string;
    colour: string;
    ratePerMetre: number;
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
  };
  invoice: {
    id: string;
    invoiceNo: string;
    subtotal: number;
    taxPct: number;
    total: number;
    status: string;
    createdAt: string;
  } | null;
  rolls: Array<{
    id: string;
    rollNo: string;
    lengthM: number;
    qcStatus: string;
  }>;
  totalMetres: number;
}

export async function getDispatchDetail(id: string): Promise<DispatchDetail | null> {
  await requireRole([
    Role.ADMIN,
    Role.STORE,
    Role.ACCOUNTS,
    Role.SUPERVISOR,
    Role.QC,
  ]);

  const dispatch = await prisma.dispatch.findUnique({
    where: { id },
    include: {
      order: {
        include: {
          buyer: true,
        },
      },
      invoice: true,
      rolls: {
        select: {
          id: true,
          rollNo: true,
          lengthM: true,
          qcStatus: true,
        },
        orderBy: { rollNo: "asc" },
      },
    },
  });

  if (!dispatch) return null;

  const totalMetres = dispatch.rolls.reduce(
    (acc, r) => acc + Number(r.lengthM),
    0
  );

  return {
    id: dispatch.id,
    dispatchNo: dispatch.dispatchNo,
    dispatchedAt: dispatch.dispatchedAt.toISOString(),
    vehicleNo: dispatch.vehicleNo,
    driver: dispatch.driver,
    order: {
      id: dispatch.order.id,
      orderNo: dispatch.order.orderNo,
      fabricType: dispatch.order.fabricType,
      colour: dispatch.order.colour,
      ratePerMetre: Number(dispatch.order.ratePerMetre),
      buyerName: dispatch.order.buyer.name,
      buyerEmail: dispatch.order.buyer.email ?? "",
      buyerPhone: dispatch.order.buyer.phone ?? "",
    },
    invoice: dispatch.invoice
      ? {
          id: dispatch.invoice.id,
          invoiceNo: dispatch.invoice.invoiceNo,
          subtotal: Number(dispatch.invoice.subtotal),
          taxPct: Number(dispatch.invoice.taxPct),
          total: Number(dispatch.invoice.total),
          status: dispatch.invoice.status,
          createdAt: dispatch.invoice.createdAt.toISOString(),
        }
      : null,
    rolls: dispatch.rolls.map((r) => ({
      id: r.id,
      rollNo: r.rollNo,
      lengthM: Number(r.lengthM),
      qcStatus: r.qcStatus,
    })),
    totalMetres: Number(totalMetres.toFixed(2)),
  };
}
