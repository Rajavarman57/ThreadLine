/**
 * ============================================================================
 * INVENTORY & STOCK LEDGER SERVICE
 * ============================================================================
 *
 * STOCK LEDGER RULES:
 * 1. StockMovement.qty is signed:
 *    - RECEIPT: positive (+)
 *    - ISSUE: negative (-)
 *    - ADJUST: signed (+ or -)
 *    - RESERVE: stored as positive quantities (+)
 *    - RELEASE: stored as positive quantities (+)
 * 2. Balance Equations:
 *    - onHand    = sum(RECEIPT) + sum(ISSUE) + sum(ADJUST)
 *    - reserved  = sum(RESERVE) - sum(RELEASE)
 *    - available = onHand - reserved
 * 3. Never update stock directly; only insert rows into StockMovement.
 * 4. Aggregate stock using Prisma groupBy on reason and yarnTypeId, never by
 *    fetching all raw rows into memory.
 */

import { prisma } from "@/lib/db";
import {
  Prisma,
  Role,
  StockMovementReason,
  POStatus,
} from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { calculateStockBalances } from "./inventory-math";
import {
  goodsReceiptSchema,
  stockAdjustmentSchema,
  stockLedgerFilterSchema,
  GoodsReceiptInput,
  StockAdjustmentInput,
  StockLedgerFilter,
} from "./schemas/inventory";

// ----------------------------------------------------------------------------
// TYPED ERRORS
// ----------------------------------------------------------------------------

export class InsufficientStockError extends Error {
  readonly code = "INSUFFICIENT_STOCK";
  constructor(
    public readonly yarnTypeId: string,
    public readonly requested: number,
    public readonly available: number,
    message?: string
  ) {
    super(
      message ||
        `Insufficient stock for yarn ${yarnTypeId}: requested ${requested}, available ${available}`
    );
    this.name = "InsufficientStockError";
  }
}

export class ReservationFailedError extends Error {
  readonly code = "RESERVATION_FAILED";
  constructor(
    public readonly shortfalls: Array<{
      yarnTypeId: string;
      required: number;
      available: number;
      shortfall: number;
    }>
  ) {
    super(
      `Material reservation failed. Shortfalls on ${shortfalls.length} required yarn component(s).`
    );
    this.name = "ReservationFailedError";
  }
}

// ----------------------------------------------------------------------------
// DATA TYPES
// ----------------------------------------------------------------------------

export interface YarnStockSummary {
  id: string;
  type: string;
  colour: string;
  unit: string;
  reorderLevel: number;
  ratePerUnit: number;
  onHand: number;
  reserved: number;
  available: number;
  status: "OK" | "LOW" | "OUT";
}

// ----------------------------------------------------------------------------
// STOCK CALCULATION & QUERY FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Returns the current onHand, reserved, and available stock for a single yarn type.
 */
export async function getAvailableStock(yarnTypeId: string): Promise<{
  onHand: number;
  reserved: number;
  available: number;
}> {
  const groups = await prisma.stockMovement.groupBy({
    by: ["reason"],
    where: { yarnTypeId },
    _sum: { qty: true },
  });

  const converted = groups.map((g) => ({
    reason: g.reason,
    _sum: { qty: g._sum.qty ? Number(g._sum.qty) : 0 },
  }));

  return calculateStockBalances(converted);
}

/**
 * Returns the complete stock overview for all yarn types with onHand, reserved,
 * available, reorderLevel, and computed health status (OK, LOW, OUT).
 */
export async function getStockSummary(): Promise<YarnStockSummary[]> {
  const [yarns, movementGroups] = await Promise.all([
    prisma.yarnType.findMany({
      orderBy: [{ type: "asc" }, { colour: "asc" }],
    }),
    prisma.stockMovement.groupBy({
      by: ["yarnTypeId", "reason"],
      _sum: { qty: true },
    }),
  ]);

  // Index movements by yarnTypeId -> reason -> sum
  const summaryMap = new Map<string, Array<{ reason: StockMovementReason; _sum: { qty: number | null } }>>();
  for (const mg of movementGroups) {
    const list = summaryMap.get(mg.yarnTypeId) || [];
    list.push({
      reason: mg.reason,
      _sum: { qty: mg._sum.qty ? Number(mg._sum.qty) : 0 },
    });
    summaryMap.set(mg.yarnTypeId, list);
  }

  return yarns.map((yarn) => {
    const movements = summaryMap.get(yarn.id) || [];
    const balances = calculateStockBalances(movements);
    const reorderLevel = Number(yarn.reorderLevel);

    let status: "OK" | "LOW" | "OUT" = "OK";
    if (balances.available <= 0) {
      status = "OUT";
    } else if (balances.available < reorderLevel) {
      status = "LOW";
    }

    return {
      id: yarn.id,
      type: yarn.type,
      colour: yarn.colour,
      unit: yarn.unit,
      reorderLevel,
      ratePerUnit: Number(yarn.ratePerUnit),
      ...balances,
      status,
    };
  });
}

/**
 * Returns the count of yarn types where available < reorderLevel.
 */
export async function getLowStockCount(): Promise<number> {
  const summaries = await getStockSummary();
  return summaries.filter((s) => s.status === "LOW" || s.status === "OUT").length;
}

// ----------------------------------------------------------------------------
// GOODS RECEIPT & STOCK ADJUSTMENT ACTIONS
// ----------------------------------------------------------------------------

/**
 * Creates a GoodsReceipt and posts a corresponding RECEIPT movement in a single transaction.
 * If linked to a purchase order line, updates receivedQty and automatically transitions PO status.
 */
export async function createGoodsReceipt(input: GoodsReceiptInput) {
  const user = await requireRole([Role.ADMIN, Role.STORE]);
  const validated = goodsReceiptSchema.parse(input);

  const receipt = await prisma.$transaction(async (tx) => {
    // 1. Create GoodsReceipt record
    const gr = await tx.goodsReceipt.create({
      data: {
        yarnTypeId: validated.yarnTypeId,
        qty: new Prisma.Decimal(validated.qty),
        vehicleNo: validated.vehicleNo,
        poLineId: validated.poLineId,
        orderId: validated.orderId,
        receivedById: user.id,
      },
    });

    // 2. Append signed RECEIPT movement (+qty)
    await tx.stockMovement.create({
      data: {
        yarnTypeId: validated.yarnTypeId,
        qty: new Prisma.Decimal(validated.qty),
        reason: StockMovementReason.RECEIPT,
        refType: "GOODS_RECEIPT",
        refId: gr.id,
        note: `GRN recorded from vehicle ${validated.vehicleNo || "N/A"}`,
        createdById: user.id,
      },
    });

    // 3. Update PO Line and PO Status if linked
    if (validated.poLineId) {
      const line = await tx.purchaseLine.findUnique({
        where: { id: validated.poLineId },
        include: { purchaseOrder: { include: { lines: true } } },
      });

      if (line) {
        const nextReceived = Number(line.receivedQty) + validated.qty;
        await tx.purchaseLine.update({
          where: { id: line.id },
          data: { receivedQty: new Prisma.Decimal(nextReceived) },
        });

        // Determine next PO status across all lines
        const poLines = line.purchaseOrder.lines;
        const allReceived = poLines.every((l) => {
          const rec = l.id === line.id ? nextReceived : Number(l.receivedQty);
          return rec >= Number(l.qty);
        });

        const nextStatus = allReceived ? POStatus.RECEIVED : POStatus.PARTIAL;
        await tx.purchaseOrder.update({
          where: { id: line.poId },
          data: { status: nextStatus },
        });
      }
    }

    return gr;
  });

  await logAction({
    userId: user.id,
    action: "CREATE_GOODS_RECEIPT",
    entity: "GoodsReceipt",
    entityId: receipt.id,
    meta: {
      yarnTypeId: validated.yarnTypeId,
      qty: validated.qty,
      poLineId: validated.poLineId,
    },
  });

  return receipt;
}

/**
 * Creates an ADJUST stock movement with an audit note.
 */
export async function adjustStock(input: StockAdjustmentInput) {
  const user = await requireRole([Role.ADMIN, Role.STORE]);
  const validated = stockAdjustmentSchema.parse(input);

  const movement = await prisma.stockMovement.create({
    data: {
      yarnTypeId: validated.yarnTypeId,
      qty: new Prisma.Decimal(validated.qtyDelta),
      reason: StockMovementReason.ADJUST,
      note: validated.note,
      createdById: user.id,
    },
  });

  await logAction({
    userId: user.id,
    action: "STOCK_ADJUSTMENT",
    entity: "StockMovement",
    entityId: movement.id,
    meta: {
      yarnTypeId: validated.yarnTypeId,
      qtyDelta: validated.qtyDelta,
      note: validated.note,
    },
  });

  return movement;
}

// ----------------------------------------------------------------------------
// RESERVATIONS & ISSUES TO PRODUCTION
// ----------------------------------------------------------------------------

/**
 * Inspects the BOM for the given order's fabric type.
 * Verifies available >= required for every line; if all pass, inserts RESERVE
 * movements with refType "ORDER" and refId orderId.
 */
export async function reserveYarnForOrder(orderId: string): Promise<{
  ok: boolean;
  shortfalls: Array<{
    yarnTypeId: string;
    yarnType: string;
    colour: string;
    required: number;
    available: number;
    shortfall: number;
  }>;
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Find BOM requirements for this fabric type
  const boms = await prisma.bOM.findMany({
    where: { fabricType: order.fabricType },
    include: { yarnType: true },
  });

  if (boms.length === 0) {
    return { ok: true, shortfalls: [] };
  }

  const orderQtyMetres = Number(order.qtyMetres);
  const requirements = await Promise.all(
    boms.map(async (b) => {
      const required = Number(b.yarnPerMetre) * orderQtyMetres;
      const { available } = await getAvailableStock(b.yarnTypeId);
      return {
        yarnTypeId: b.yarnTypeId,
        yarnType: b.yarnType.type,
        colour: b.yarnType.colour,
        required: Number(required.toFixed(4)),
        available,
        shortfall: Number(Math.max(0, required - available).toFixed(4)),
      };
    })
  );

  const shortfalls = requirements.filter((r) => r.shortfall > 0);

  if (shortfalls.length > 0) {
    return { ok: false, shortfalls };
  }

  // All components available: Atomically post RESERVE movements
  await prisma.$transaction(async (tx) => {
    for (const req of requirements) {
      await tx.stockMovement.create({
        data: {
          yarnTypeId: req.yarnTypeId,
          qty: new Prisma.Decimal(req.required),
          reason: StockMovementReason.RESERVE,
          refType: "ORDER",
          refId: order.id,
          note: `Material reservation for Order #${order.orderNo}`,
        },
      });
    }
  });

  return { ok: true, shortfalls: [] };
}

/**
 * Releases existing reservations for an order.
 */
export async function releaseReservation(orderId: string): Promise<void> {
  const reserveMovements = await prisma.stockMovement.findMany({
    where: {
      refType: "ORDER",
      refId: orderId,
      reason: StockMovementReason.RESERVE,
    },
  });

  if (reserveMovements.length === 0) return;

  // Check how much has already been released
  const releaseMovements = await prisma.stockMovement.findMany({
    where: {
      refType: "ORDER",
      refId: orderId,
      reason: StockMovementReason.RELEASE,
    },
  });

  const releasedMap = new Map<string, number>();
  for (const rm of releaseMovements) {
    releasedMap.set(
      rm.yarnTypeId,
      (releasedMap.get(rm.yarnTypeId) || 0) + Number(rm.qty)
    );
  }

  await prisma.$transaction(async (tx) => {
    for (const rm of reserveMovements) {
      const alreadyReleased = releasedMap.get(rm.yarnTypeId) || 0;
      const unreleased = Number(rm.qty) - alreadyReleased;
      if (unreleased > 0) {
        await tx.stockMovement.create({
          data: {
            yarnTypeId: rm.yarnTypeId,
            qty: new Prisma.Decimal(unreleased),
            reason: StockMovementReason.RELEASE,
            refType: "ORDER",
            refId: orderId,
            note: `Released reservation for Order ${orderId}`,
          },
        });
        releasedMap.set(rm.yarnTypeId, alreadyReleased + unreleased);
      }
    }
  });
}

/**
 * Issues yarn to a WorkOrder: verifies onHand >= qty, inserts ISSUE (refType: "WORK_ORDER"),
 * and inserts matching RELEASE for min(qty, remaining reservation of that order and yarn).
 */
export async function issueYarnToWorkOrder(
  workOrderId: string,
  yarnTypeId: string,
  qty: number
) {
  const user = await requireRole([Role.ADMIN, Role.STORE, Role.SUPERVISOR]);

  if (qty <= 0) {
    throw new Error("Issue quantity must be greater than zero");
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: { order: true },
  });

  if (!workOrder) {
    throw new Error(`WorkOrder ${workOrderId} not found`);
  }

  const { onHand } = await getAvailableStock(yarnTypeId);
  if (onHand < qty) {
    throw new InsufficientStockError(yarnTypeId, qty, onHand);
  }

  return prisma.$transaction(async (tx) => {
    // 1. Post negative ISSUE movement
    const issue = await tx.stockMovement.create({
      data: {
        yarnTypeId,
        qty: new Prisma.Decimal(-qty),
        reason: StockMovementReason.ISSUE,
        refType: "WORK_ORDER",
        refId: workOrderId,
        note: `Yarn issued to Work Order #${workOrderId.slice(-6)} for Order #${workOrder.order.orderNo}`,
        createdById: user.id,
      },
    });

    // 2. Compute remaining reservation for this order & yarn
    const [reserves, releases] = await Promise.all([
      tx.stockMovement.aggregate({
        where: {
          refType: "ORDER",
          refId: workOrder.orderId,
          yarnTypeId,
          reason: StockMovementReason.RESERVE,
        },
        _sum: { qty: true },
      }),
      tx.stockMovement.aggregate({
        where: {
          refType: "ORDER",
          refId: workOrder.orderId,
          yarnTypeId,
          reason: StockMovementReason.RELEASE,
        },
        _sum: { qty: true },
      }),
    ]);

    const reservedSum = reserves._sum.qty ? Number(reserves._sum.qty) : 0;
    const releasedSum = releases._sum.qty ? Number(releases._sum.qty) : 0;
    const remainingReservation = Math.max(0, reservedSum - releasedSum);

    // 3. Automatically release matched reservation
    const releaseQty = Math.min(qty, remainingReservation);
    if (releaseQty > 0) {
      await tx.stockMovement.create({
        data: {
          yarnTypeId,
          qty: new Prisma.Decimal(releaseQty),
          reason: StockMovementReason.RELEASE,
          refType: "ORDER",
          refId: workOrder.orderId,
          note: `Automatic release on physical floor issue to Work Order #${workOrderId.slice(-6)}`,
          createdById: user.id,
        },
      });
    }

    return issue;
  });
}

// ----------------------------------------------------------------------------
// LOW STOCK NOTIFICATIONS
// ----------------------------------------------------------------------------

/**
 * Ensures de-duplicated notifications for low stock yarn types exist for STORE role.
 */
export async function triggerLowStockNotifications(): Promise<void> {
  const summaries = await getStockSummary();
  const lowYarns = summaries.filter((s) => s.status === "LOW" || s.status === "OUT");

  for (const yarn of lowYarns) {
    const existing = await prisma.notification.findFirst({
      where: {
        role: Role.STORE,
        type: "LOW_STOCK",
        read: false,
        message: { contains: yarn.type },
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          role: Role.STORE,
          type: "LOW_STOCK",
          message: `Low Stock Warning: "${yarn.type} (${yarn.colour})" available quantity is ${yarn.available} ${yarn.unit} (Reorder level: ${yarn.reorderLevel} ${yarn.unit}).`,
        },
      });
    }
  }
}

// ----------------------------------------------------------------------------
// MOVEMENTS LEDGER QUERY
// ----------------------------------------------------------------------------

export async function getStockMovementsLedger(filter: StockLedgerFilter) {
  const { page, pageSize, yarnTypeId, reason, startDate, endDate } =
    stockLedgerFilterSchema.parse(filter);
  const skip = (page - 1) * pageSize;

  const where: Prisma.StockMovementWhereInput = {
    ...(yarnTypeId ? { yarnTypeId } : {}),
    ...(reason ? { reason } : {}),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.stockMovement.count({ where }),
    prisma.stockMovement.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        yarnType: {
          select: { id: true, type: true, colour: true, unit: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const convertedData = data.map((m) => ({
    ...m,
    qty: Number(m.qty),
  }));

  return {
    data: convertedData,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize) || 1,
  };
}
