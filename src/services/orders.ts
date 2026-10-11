import { prisma } from "@/lib/db";
import { Prisma, Role, OrderStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { nextNumber } from "@/lib/counters";
import { reserveYarnForOrder, releaseReservation } from "./inventory";
import {
  createOrderSchema,
  CreateOrderInput,
} from "./schemas/orders";

export async function getOrders(params: {
  page?: number;
  pageSize?: number;
  status?: OrderStatus;
  search?: string;
  buyerId?: string;
}) {
  const page = params.page || 1;
  const pageSize = params.pageSize || 15;
  const skip = (page - 1) * pageSize;

  const where: Prisma.OrderWhereInput = {
    ...(params.buyerId ? { buyerId: params.buyerId } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { orderNo: { contains: params.search, mode: "insensitive" } },
            { buyer: { name: { contains: params.search, mode: "insensitive" } } },
            { fabricType: { contains: params.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rawData] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        buyer: { select: { id: true, name: true } },
        _count: {
          select: { workOrders: true, rolls: true, dispatches: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Inspect material reservation state for each order to flag "Awaiting material"
  const orderIds = rawData.map((o) => o.id);
  const reservations = await prisma.stockMovement.groupBy({
    by: ["refId"],
    where: {
      refType: "ORDER",
      refId: { in: orderIds },
      reason: "RESERVE",
    },
    _sum: { qty: true },
  });

  const reservationMap = new Map<string, number>();
  for (const r of reservations) {
    if (r.refId) {
      reservationMap.set(r.refId, r._sum.qty ? Number(r._sum.qty) : 0);
    }
  }

  const data = rawData.map((o) => {
    const hasReservation = (reservationMap.get(o.id) || 0) > 0;
    const isTerminal =
      o.status === OrderStatus.DISPATCHED || o.status === OrderStatus.CANCELLED;
    const awaitingMaterial = !isTerminal && !hasReservation;

    return {
      ...o,
      qtyMetres: Number(o.qtyMetres),
      ratePerMetre: Number(o.ratePerMetre),
      awaitingMaterial,
    };
  });

  return {
    data,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize) || 1,
  };
}

export async function getOrderDetail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: true,
      workOrders: {
        include: { machine: true },
        orderBy: { createdAt: "asc" },
      },
      rolls: {
        take: 20,
        orderBy: { createdAt: "desc" },
      },
      dispatches: {
        include: { invoice: true },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { workOrders: true, rolls: true, dispatches: true, expenses: true },
      },
    },
  });

  if (!order) return null;

  // Retrieve material BOM requirements and linked reservations
  const [boms, reserves, releases] = await Promise.all([
    prisma.bOM.findMany({
      where: { fabricType: order.fabricType },
      include: { yarnType: true },
    }),
    prisma.stockMovement.findMany({
      where: {
        refType: "ORDER",
        refId: order.id,
        reason: "RESERVE",
      },
    }),
    prisma.stockMovement.findMany({
      where: {
        refType: "ORDER",
        refId: order.id,
        reason: "RELEASE",
      },
    }),
  ]);

  const reserveTotals = new Map<string, number>();
  for (const r of reserves) {
    reserveTotals.set(
      r.yarnTypeId,
      (reserveTotals.get(r.yarnTypeId) || 0) + Number(r.qty)
    );
  }

  const releaseTotals = new Map<string, number>();
  for (const r of releases) {
    releaseTotals.set(
      r.yarnTypeId,
      (releaseTotals.get(r.yarnTypeId) || 0) + Number(r.qty)
    );
  }

  const materials = boms.map((b) => {
    const required = Number(b.yarnPerMetre) * Number(order.qtyMetres);
    const reservedTotal = reserveTotals.get(b.yarnTypeId) || 0;
    const releasedTotal = releaseTotals.get(b.yarnTypeId) || 0;
    const netReserved = Math.max(0, reservedTotal - releasedTotal);
    const shortfall = Math.max(0, required - netReserved);

    return {
      yarnTypeId: b.yarnTypeId,
      yarnType: b.yarnType.type,
      colour: b.yarnType.colour,
      unit: b.yarnType.unit,
      required: Number(required.toFixed(2)),
      reserved: Number(netReserved.toFixed(2)),
      shortfall: Number(shortfall.toFixed(2)),
      satisfied: shortfall === 0,
    };
  });

  return {
    ...order,
    qtyMetres: Number(order.qtyMetres),
    ratePerMetre: Number(order.ratePerMetre),
    workOrders: order.workOrders.map((wo) => ({
      ...wo,
      targetQty: Number(wo.targetQty),
      producedQty: Number(wo.producedQty),
    })),
    rolls: order.rolls.map((r) => ({
      ...r,
      lengthM: Number(r.lengthM),
    })),
    materials,
    fullyReserved: materials.every((m) => m.satisfied),
  };
}

export async function createOrder(input: CreateOrderInput) {
  const user = await requireRole([Role.ADMIN, Role.ACCOUNTS]);
  const validated = createOrderSchema.parse(input);

  const orderNo = await nextNumber("order", "ORD-");

  const order = await prisma.order.create({
    data: {
      orderNo,
      buyerId: validated.buyerId,
      fabricType: validated.fabricType,
      colour: validated.colour,
      qtyMetres: new Prisma.Decimal(validated.qtyMetres),
      ratePerMetre: new Prisma.Decimal(validated.ratePerMetre),
      deadline: new Date(validated.deadline),
      status: OrderStatus.CONFIRMED,
    },
    include: {
      buyer: true,
    },
  });

  // Attempt automatic yarn reservation
  const reservationResult = await reserveYarnForOrder(order.id);

  await logAction({
    userId: user.id,
    action: "CREATE_ORDER",
    entity: "Order",
    entityId: order.id,
    meta: {
      orderNo: order.orderNo,
      fabricType: order.fabricType,
      reserved: reservationResult.ok,
    },
  });

  return {
    ...order,
    reservationResult,
  };
}

export async function cancelOrder(orderId: string) {
  const user = await requireRole([Role.ADMIN, Role.ACCOUNTS]);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { workOrders: true },
  });

  if (!order) throw new Error("Order not found");

  const hasStartedProduction = order.workOrders.some(
    (wo) => Number(wo.producedQty) > 0 || wo.status === "RUNNING"
  );

  if (hasStartedProduction) {
    throw new Error(
      "Cannot cancel order: Production floor output has already begun."
    );
  }

  // Release any held yarn reservations
  await releaseReservation(orderId);

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.CANCELLED },
  });

  await logAction({
    userId: user.id,
    action: "CANCEL_ORDER",
    entity: "Order",
    entityId: orderId,
  });

  return updated;
}
