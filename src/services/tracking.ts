import { prisma } from "@/lib/db";
import { OrderStatus, QCStatus, WorkOrderStatus } from "@prisma/client";

export type StageState = "done" | "active" | "pending";

export interface TrackingStage {
  name: string;
  state: StageState;
}

export interface RollCounts {
  produced: number;
  passed: number;
  inQC: number;
  dispatched: number;
}

export interface OrderTrackingResult {
  orderNo: string;
  fabricType: string;
  colour: string;
  qtyMetres: number;
  deadline: string;
  status: OrderStatus;
  percentComplete: number;
  isAtRisk: boolean;
  stages: TrackingStage[];
  rollCounts: RollCounts;
  lastUpdated: string;
  createdAt: string;
}

export async function getOrderTracking(
  orderNo: string
): Promise<OrderTrackingResult | null> {
  const order = await prisma.order.findUnique({
    where: { orderNo: orderNo.trim() },
    include: {
      workOrders: {
        include: {
          rolls: true,
        },
      },
      rolls: true,
      dispatches: {
        orderBy: { dispatchedAt: "desc" },
      },
    },
  });

  if (!order) return null;

  const totalQty = Number(order.qtyMetres) || 1;

  // Find work orders by stage
  const spinningWO = order.workOrders.find((w) => w.stage === "SPINNING");
  const weavingWO = order.workOrders.find((w) => w.stage === "WEAVING");
  const dyeingWO = order.workOrders.find((w) => w.stage === "DYEING");

  const spinProduced = spinningWO ? Number(spinningWO.producedQty) : 0;
  const weaveProduced = weavingWO ? Number(weavingWO.producedQty) : 0;
  const dyeProduced = dyeingWO ? Number(dyeingWO.producedQty) : 0;

  // Roll counts
  const totalRollsCount = order.rolls.length;
  const passedRollsCount = order.rolls.filter((r) => r.qcStatus === QCStatus.PASSED).length;
  const inQCRollsCount = order.rolls.filter(
    (r) => r.qcStatus === QCStatus.PENDING || r.qcStatus === QCStatus.REWORK
  ).length;
  const dispatchedRollsCount = order.rolls.filter((r) => r.dispatchId !== null).length;

  // Determine stage states
  // Stages: [Confirmed, Spinning, Weaving, Dyeing, Quality check, Ready, Dispatched]

  // 1. Confirmed
  const confirmedState: StageState = "done";

  // 2. Spinning
  let spinningState: StageState = "pending";
  if (spinningWO) {
    if (spinningWO.status === WorkOrderStatus.DONE || spinProduced >= totalQty) {
      spinningState = "done";
    } else if (spinningWO.status === WorkOrderStatus.RUNNING || spinProduced > 0) {
      spinningState = "active";
    }
  }

  // 3. Weaving
  let weavingState: StageState = "pending";
  if (weavingWO) {
    if (weavingWO.status === WorkOrderStatus.DONE || weaveProduced >= totalQty) {
      weavingState = "done";
    } else if (weavingWO.status === WorkOrderStatus.RUNNING || weaveProduced > 0) {
      weavingState = "active";
    }
  }

  // 4. Dyeing
  let dyeingState: StageState = "pending";
  if (dyeingWO) {
    if (dyeingWO.status === WorkOrderStatus.DONE || dyeProduced >= totalQty) {
      dyeingState = "done";
    } else if (dyeingWO.status === WorkOrderStatus.RUNNING || dyeProduced > 0) {
      dyeingState = "active";
    }
  }

  // 5. Quality check
  let qcState: StageState = "pending";
  if (order.status === OrderStatus.DISPATCHED || order.status === OrderStatus.READY) {
    qcState = "done";
  } else if (order.status === OrderStatus.QC || inQCRollsCount > 0 || (totalRollsCount > 0 && passedRollsCount < totalRollsCount)) {
    qcState = "active";
  } else if (totalRollsCount > 0 && passedRollsCount === totalRollsCount && passedRollsCount > 0) {
    qcState = "done";
  }

  // 6. Ready
  let readyState: StageState = "pending";
  if (order.status === OrderStatus.DISPATCHED) {
    readyState = "done";
  } else if (order.status === OrderStatus.READY) {
    readyState = "active";
  }

  // 7. Dispatched
  let dispatchedState: StageState = "pending";
  if (order.status === OrderStatus.DISPATCHED) {
    dispatchedState = "done";
  } else if (order.dispatches.length > 0) {
    dispatchedState = "active";
  }

  const stages: TrackingStage[] = [
    { name: "Confirmed", state: confirmedState },
    { name: "Spinning", state: spinningState },
    { name: "Weaving", state: weavingState },
    { name: "Dyeing", state: dyeingState },
    { name: "Quality check", state: qcState },
    { name: "Ready", state: readyState },
    { name: "Dispatched", state: dispatchedState },
  ];

  // Weighted percent complete:
  // Spinning: 20%
  // Weaving: 25%
  // Dyeing: 25%
  // QC passed: 15%
  // Dispatched: 15%
  let percent = 0;
  if (order.status === OrderStatus.DISPATCHED) {
    percent = 100;
  } else {
    const spinProg = Math.min(1, spinProduced / totalQty) * 20;
    const weaveProg = Math.min(1, weaveProduced / totalQty) * 25;
    const dyeProg = Math.min(1, dyeProduced / totalQty) * 25;
    const qcProg = totalRollsCount > 0 ? (passedRollsCount / totalRollsCount) * 15 : 0;
    const dispProg = totalRollsCount > 0 ? (dispatchedRollsCount / totalRollsCount) * 15 : 0;

    percent = Math.round(spinProg + weaveProg + dyeProg + qcProg + dispProg);
    if (order.status === OrderStatus.READY && percent < 95) {
      percent = 95;
    }
    percent = Math.min(100, Math.max(0, percent));
  }

  // Expected delivery date & At-risk determination
  const createdAtTime = new Date(order.createdAt).getTime();
  const deadlineTime = new Date(order.deadline).getTime();
  const nowTime = Date.now();

  const totalDuration = Math.max(1, deadlineTime - createdAtTime);
  const elapsed = Math.max(0, nowTime - createdAtTime);
  const elapsedRatio = Math.min(1, elapsed / totalDuration);

  // If progress is behind the elapsed share of time (with 10% grace), flag "at risk"
  let isAtRisk = false;
  if (order.status !== OrderStatus.DISPATCHED && order.status !== OrderStatus.READY) {
    if (nowTime > deadlineTime) {
      isAtRisk = true; // overdue
    } else if (elapsedRatio > 0.3) {
      const expectedPercent = elapsedRatio * 100;
      if (percent < expectedPercent - 15) {
        isAtRisk = true;
      }
    }
  }

  return {
    orderNo: order.orderNo,
    fabricType: order.fabricType,
    colour: order.colour,
    qtyMetres: Number(order.qtyMetres),
    deadline: order.deadline.toISOString(),
    status: order.status,
    percentComplete: percent,
    isAtRisk,
    stages,
    rollCounts: {
      produced: totalRollsCount,
      passed: passedRollsCount,
      inQC: inQCRollsCount,
      dispatched: dispatchedRollsCount,
    },
    lastUpdated: order.updatedAt.toISOString(),
    createdAt: order.createdAt.toISOString(),
  };
}

// ----------------------------------------------------------------------------
// BUYER PORTAL QUERIES
// ----------------------------------------------------------------------------

export interface BuyerPortalOrderItem {
  id: string;
  orderNo: string;
  fabricType: string;
  colour: string;
  qtyMetres: number;
  ratePerMetre: number;
  totalValue: number;
  deadline: string;
  status: OrderStatus;
  percentComplete: number;
  isAtRisk: boolean;
  createdAt: string;
}

export async function getBuyerOrders(
  buyerId: string
): Promise<BuyerPortalOrderItem[]> {
  const orders = await prisma.order.findMany({
    where: { buyerId },
    orderBy: { createdAt: "desc" },
    include: {
      workOrders: true,
      rolls: true,
    },
  });

  return orders.map((order) => {
    const totalQty = Number(order.qtyMetres) || 1;
    const spinProduced = order.workOrders
      .filter((w) => w.stage === "SPINNING")
      .reduce((s, w) => s + Number(w.producedQty), 0);
    const weaveProduced = order.workOrders
      .filter((w) => w.stage === "WEAVING")
      .reduce((s, w) => s + Number(w.producedQty), 0);
    const dyeProduced = order.workOrders
      .filter((w) => w.stage === "DYEING")
      .reduce((s, w) => s + Number(w.producedQty), 0);

    const passedRolls = order.rolls.filter((r) => r.qcStatus === QCStatus.PASSED).length;
    const totalRolls = order.rolls.length;
    const dispatchedRolls = order.rolls.filter((r) => r.dispatchId !== null).length;

    let percent = 0;
    if (order.status === OrderStatus.DISPATCHED) {
      percent = 100;
    } else {
      const p =
        Math.min(1, spinProduced / totalQty) * 20 +
        Math.min(1, weaveProduced / totalQty) * 25 +
        Math.min(1, dyeProduced / totalQty) * 25 +
        (totalRolls > 0 ? (passedRolls / totalRolls) * 15 : 0) +
        (totalRolls > 0 ? (dispatchedRolls / totalRolls) * 15 : 0);
      percent = Math.round(p);
      if (order.status === OrderStatus.READY && percent < 95) percent = 95;
    }

    const now = Date.now();
    const deadlineTime = new Date(order.deadline).getTime();
    const createdAtTime = new Date(order.createdAt).getTime();
    const elapsedRatio = (now - createdAtTime) / Math.max(1, deadlineTime - createdAtTime);
    const isAtRisk =
      order.status !== OrderStatus.DISPATCHED &&
      order.status !== OrderStatus.READY &&
      (now > deadlineTime || (elapsedRatio > 0.3 && percent < elapsedRatio * 100 - 15));

    const rate = Number(order.ratePerMetre);
    const qty = Number(order.qtyMetres);

    return {
      id: order.id,
      orderNo: order.orderNo,
      fabricType: order.fabricType,
      colour: order.colour,
      qtyMetres: qty,
      ratePerMetre: rate,
      totalValue: Number((qty * rate).toFixed(2)),
      deadline: order.deadline.toISOString(),
      status: order.status,
      percentComplete: percent,
      isAtRisk,
      createdAt: order.createdAt.toISOString(),
    };
  });
}

export interface BuyerOrderDetail {
  tracking: OrderTrackingResult;
  buyer: {
    id: string;
    name: string;
  };
  ratePerMetre: number;
  totalValue: number;
  dispatches: Array<{
    id: string;
    dispatchNo: string;
    vehicleNo: string;
    driver: string;
    dispatchedAt: string;
    rollCount: number;
    totalMetres: number;
    invoice: {
      id: string;
      invoiceNo: string;
      total: number;
      status: string;
    } | null;
  }>;
}

export async function getBuyerOrderDetail(
  orderNo: string,
  buyerId: string
): Promise<BuyerOrderDetail | null> {
  const order = await prisma.order.findUnique({
    where: { orderNo: orderNo.trim() },
    include: {
      buyer: true,
      dispatches: {
        include: {
          rolls: true,
          invoice: true,
        },
        orderBy: { dispatchedAt: "desc" },
      },
    },
  });

  // Strict ownership check: return null if order doesn't belong to this buyer
  if (!order || order.buyerId !== buyerId) {
    return null;
  }

  const tracking = await getOrderTracking(orderNo);
  if (!tracking) return null;

  const rate = Number(order.ratePerMetre);
  const qty = Number(order.qtyMetres);

  return {
    tracking,
    buyer: {
      id: order.buyer.id,
      name: order.buyer.name,
    },
    ratePerMetre: rate,
    totalValue: Number((qty * rate).toFixed(2)),
    dispatches: order.dispatches.map((d) => ({
      id: d.id,
      dispatchNo: d.dispatchNo,
      vehicleNo: d.vehicleNo,
      driver: d.driver,
      dispatchedAt: d.dispatchedAt.toISOString(),
      rollCount: d.rolls.length,
      totalMetres: d.rolls.reduce((acc, r) => acc + Number(r.lengthM), 0),
      invoice: d.invoice
        ? {
            id: d.invoice.id,
            invoiceNo: d.invoice.invoiceNo,
            total: Number(d.invoice.total),
            status: d.invoice.status,
          }
        : null,
    })),
  };
}
