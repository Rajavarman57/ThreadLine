import { prisma } from "@/lib/db";
import { Role, StockMovementReason } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { getMonthlyWagesTotal } from "./hr";
import { getMonthlyExpensesTotal } from "./expenses";
import { getReceivablesTotal } from "./payments";

// ----------------------------------------------------------------------------
// 1. ORDER COSTING & MARGIN
// ----------------------------------------------------------------------------

export interface OrderCostDetail {
  orderId: string;
  orderNo: string;
  buyerName: string;
  fabricType: string;
  colour: string;
  qtyMetres: number;
  ratePerMetre: number;
  revenue: number;
  materialCost: number;
  machineOverhead: number;
  wageCost: number;
  totalCost: number;
  costPerMetre: number;
  costPerRoll: number;
  margin: number;
  marginPct: number;
  rollsProduced: number;
  metresProduced: number;
}

export async function getOrderCost(orderId: string): Promise<OrderCostDetail | null> {
  await requireRole([Role.ADMIN, Role.ACCOUNTS]);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: true,
      workOrders: {
        include: {
          machine: true,
          productionLogs: true,
        },
      },
      rolls: true,
      dispatches: {
        include: {
          invoice: true,
        },
      },
    },
  });

  if (!order) return null;

  const workOrderIds = order.workOrders.map((wo) => wo.id);

  // Material cost: sum of ISSUE movements with refType WORK_ORDER for that order's work orders x yarn ratePerUnit
  let materialCost = 0;
  if (workOrderIds.length > 0) {
    const issueMovements = await prisma.stockMovement.findMany({
      where: {
        reason: StockMovementReason.ISSUE,
        refType: "WORK_ORDER",
        refId: { in: workOrderIds },
      },
      include: {
        yarnType: true,
      },
    });

    for (const mov of issueMovements) {
      // qty is negative for issue, take Math.abs
      const qtyKg = Math.abs(Number(mov.qty));
      const rate = Number(mov.yarnType.ratePerUnit);
      materialCost += qtyKg * rate;
    }
  }

  // Machine overhead: sum(ProductionLog.hours x Machine.hourlyOverhead)
  let machineOverhead = 0;
  let orderProductionHours = 0;

  for (const wo of order.workOrders) {
    const hourlyOverhead = wo.machine ? Number(wo.machine.hourlyOverhead) : 0;
    for (const log of wo.productionLogs) {
      const h = Number(log.hours);
      orderProductionHours += h;
      machineOverhead += h * hourlyOverhead;
    }
  }

  // Wages: month wage total (getMonthlyWagesTotal) allocated by the order's share of that month's production hours
  const orderMonth = order.createdAt.toISOString().slice(0, 7);
  const [yearStr, monthStr] = orderMonth.split("-");
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
  const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

  // SQL aggregate for total production hours in the month
  const totalMonthLogs = await prisma.productionLog.aggregate({
    _sum: { hours: true },
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const totalMonthHours = Number(totalMonthLogs._sum.hours) || 0;
  const monthWages = await getMonthlyWagesTotal(orderMonth);

  const wageCost =
    totalMonthHours > 0
      ? (orderProductionHours / totalMonthHours) * monthWages
      : 0;

  const totalCost = materialCost + machineOverhead + wageCost;

  // Revenue: Invoices for the order (or fallback metres x ratePerMetre)
  let revenue = 0;
  for (const d of order.dispatches) {
    if (d.invoice) {
      revenue += Number(d.invoice.total);
    }
  }
  if (revenue === 0) {
    revenue = Number(order.qtyMetres) * Number(order.ratePerMetre);
  }

  const metresProduced = order.rolls.reduce(
    (sum, r) => sum + Number(r.lengthM),
    0
  );
  const rollsCount = order.rolls.length;

  const costPerMetre =
    metresProduced > 0
      ? totalCost / metresProduced
      : Number(order.qtyMetres) > 0
      ? totalCost / Number(order.qtyMetres)
      : 0;

  const costPerRoll = rollsCount > 0 ? totalCost / rollsCount : 0;

  const margin = revenue - totalCost;
  const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;

  return {
    orderId: order.id,
    orderNo: order.orderNo,
    buyerName: order.buyer.name,
    fabricType: order.fabricType,
    colour: order.colour,
    qtyMetres: Number(order.qtyMetres),
    ratePerMetre: Number(order.ratePerMetre),
    revenue: Number(revenue.toFixed(2)),
    materialCost: Number(materialCost.toFixed(2)),
    machineOverhead: Number(machineOverhead.toFixed(2)),
    wageCost: Number(wageCost.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    costPerMetre: Number(costPerMetre.toFixed(2)),
    costPerRoll: Number(costPerRoll.toFixed(2)),
    margin: Number(margin.toFixed(2)),
    marginPct: Number(marginPct.toFixed(2)),
    rollsProduced: rollsCount,
    metresProduced: Number(metresProduced.toFixed(2)),
  };
}

export async function getAllOrdersCosting(): Promise<OrderCostDetail[]> {
  await requireRole([Role.ADMIN, Role.ACCOUNTS]);

  const orders = await prisma.order.findMany({
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  const costings = await Promise.all(
    orders.map((o) => getOrderCost(o.id))
  );

  return costings.filter((c): c is OrderCostDetail => c !== null);
}

// ----------------------------------------------------------------------------
// 2. MONTHLY P&L STATEMENT
// ----------------------------------------------------------------------------

export interface MonthlyPnLStatement {
  month: string;
  revenue: number;
  materialCost: number;
  wages: number;
  machineOverhead: number;
  otherExpenses: number;
  totalCost: number;
  profit: number;
  receivables: number;
  cashCollected: number;
  marginPct: number;
  prevMonth?: {
    month: string;
    revenue: number;
    profit: number;
  };
}

export async function getMonthlyPnL(month: string): Promise<MonthlyPnLStatement> {
  await requireRole([Role.ADMIN, Role.ACCOUNTS]);

  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
  const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

  // 1. Revenue: invoices dated in the month using SQL aggregate
  const invoiceAgg = await prisma.invoice.aggregate({
    _sum: { total: true },
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
  });
  const revenue = Number(invoiceAgg._sum.total) || 0;

  // 2. Material Cost: sum of ISSUE stock movements in the month
  const rawMaterialIssues = await prisma.stockMovement.findMany({
    where: {
      reason: StockMovementReason.ISSUE,
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      yarnType: { select: { ratePerUnit: true } },
    },
  });
  let materialCost = 0;
  for (const m of rawMaterialIssues) {
    materialCost += Math.abs(Number(m.qty)) * Number(m.yarnType.ratePerUnit);
  }

  // 3. Wages: getMonthlyWagesTotal
  const wages = await getMonthlyWagesTotal(month);

  // 4. Machine Overhead: ProductionLogs in month x Machine.hourlyOverhead
  const logsInMonth = await prisma.productionLog.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      workOrder: {
        include: {
          machine: { select: { hourlyOverhead: true } },
        },
      },
    },
  });
  let machineOverhead = 0;
  for (const log of logsInMonth) {
    const hourly = log.workOrder.machine
      ? Number(log.workOrder.machine.hourlyOverhead)
      : 0;
    machineOverhead += Number(log.hours) * hourly;
  }

  // 5. Other Expenses: getMonthlyExpensesTotal(month)
  const otherExpenses = await getMonthlyExpensesTotal(month);

  const totalCost = materialCost + wages + machineOverhead + otherExpenses;
  const profit = revenue - totalCost;
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;

  // 6. Receivables: getReceivablesTotal()
  const receivablesData = await getReceivablesTotal();
  const receivables = receivablesData.totalReceivables;

  // 7. Cash Collected: payments made in the month
  const paymentsAgg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: {
      paidAt: { gte: startDate, lte: endDate },
    },
  });
  const cashCollected = Number(paymentsAgg._sum.amount) || 0;

  // Previous month comparison
  const prevDate = new Date(Date.UTC(year, monthNum - 2, 1));
  const prevMonthStr = prevDate.toISOString().slice(0, 7);

  const prevStart = new Date(Date.UTC(prevDate.getUTCFullYear(), prevDate.getUTCMonth(), 1));
  const prevEnd = new Date(Date.UTC(prevDate.getUTCFullYear(), prevDate.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  const prevInvAgg = await prisma.invoice.aggregate({
    _sum: { total: true },
    where: { createdAt: { gte: prevStart, lte: prevEnd } },
  });
  const prevRevenue = Number(prevInvAgg._sum.total) || 0;
  const prevWages = await getMonthlyWagesTotal(prevMonthStr);
  const prevExpenses = await getMonthlyExpensesTotal(prevMonthStr);
  const prevProfit = prevRevenue - (prevWages + prevExpenses);

  return {
    month,
    revenue: Number(revenue.toFixed(2)),
    materialCost: Number(materialCost.toFixed(2)),
    wages: Number(wages.toFixed(2)),
    machineOverhead: Number(machineOverhead.toFixed(2)),
    otherExpenses: Number(otherExpenses.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    profit: Number(profit.toFixed(2)),
    receivables: Number(receivables.toFixed(2)),
    cashCollected: Number(cashCollected.toFixed(2)),
    marginPct: Number(marginPct.toFixed(2)),
    prevMonth: {
      month: prevMonthStr,
      revenue: Number(prevRevenue.toFixed(2)),
      profit: Number(prevProfit.toFixed(2)),
    },
  };
}

// ----------------------------------------------------------------------------
// 3. MACHINE OUTPUT & UTILISATION
// ----------------------------------------------------------------------------

export interface MachineOutputRow {
  machineId: string;
  code: string;
  name: string | null;
  type: string;
  stage: string;
  status: string;
  totalMetres: number;
  totalHours: number;
  capacityPerHour: number;
  utilisationPct: number;
}

export interface MachineOutputReport {
  from: string;
  to: string;
  machines: MachineOutputRow[];
  totalMetres: number;
  totalHours: number;
  avgUtilisation: number;
}

export async function getMachineOutput(
  fromStr: string,
  toStr: string
): Promise<MachineOutputReport> {
  await requireRole([Role.ADMIN, Role.ACCOUNTS, Role.SUPERVISOR]);

  const fromDate = new Date(`${fromStr}T00:00:00.000Z`);
  const toDate = new Date(`${toStr}T23:59:59.999Z`);

  const machines = await prisma.machine.findMany({
    where: { status: { not: "BREAKDOWN" } },
    orderBy: { code: "asc" },
    include: {
      workOrders: {
        where: {
          productionLogs: {
            some: {
              createdAt: { gte: fromDate, lte: toDate },
            },
          },
        },
        include: {
          productionLogs: {
            where: {
              createdAt: { gte: fromDate, lte: toDate },
            },
          },
        },
      },
    },
  });

  const daysCount = Math.max(
    1,
    Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
  );
  const potentialHours = daysCount * 24;

  let grandMetres = 0;
  let grandHours = 0;

  const rows: MachineOutputRow[] = machines.map((m) => {
    let machineMetres = 0;
    let machineHours = 0;

    for (const wo of m.workOrders) {
      for (const log of wo.productionLogs) {
        machineMetres += Number(log.qty);
        machineHours += Number(log.hours);
      }
    }

    grandMetres += machineMetres;
    grandHours += machineHours;

    const utilisationPct =
      potentialHours > 0
        ? Math.min(100, (machineHours / potentialHours) * 100)
        : 0;

    return {
      machineId: m.id,
      code: m.code,
      name: m.name,
      type: m.type,
      stage: m.type,
      status: m.status,
      totalMetres: Number(machineMetres.toFixed(2)),
      totalHours: Number(machineHours.toFixed(2)),
      capacityPerHour: Number(m.capacityPerHour),
      utilisationPct: Number(utilisationPct.toFixed(1)),
    };
  });

  const avgUtilisation =
    rows.length > 0
      ? rows.reduce((s, r) => s + r.utilisationPct, 0) / rows.length
      : 0;

  return {
    from: fromStr,
    to: toStr,
    machines: rows,
    totalMetres: Number(grandMetres.toFixed(2)),
    totalHours: Number(grandHours.toFixed(2)),
    avgUtilisation: Number(avgUtilisation.toFixed(1)),
  };
}

// ----------------------------------------------------------------------------
// 4. OWNER DASHBOARD SUMMARY (P17)
// ----------------------------------------------------------------------------

export interface OwnerDashboardSummary {
  month: string;
  pnl: MonthlyPnLStatement;
  revenueVsCost: Array<{
    month: string;
    revenue: number;
    cost: number;
    profit: number;
  }>;
  machineOutputCurrentMonth: Array<{
    code: string;
    type: string;
    metres: number;
    hours: number;
  }>;
  orderPipeline: Array<{
    status: string;
    count: number;
    metres: number;
  }>;
  atRiskOrders: Array<{
    id: string;
    orderNo: string;
    buyerName: string;
    deadline: string;
    status: string;
    isOverdue: boolean;
  }>;
  lowStockYarns: Array<{
    id: string;
    type: string;
    colour: string;
    onHand: number;
    reorderLevel: number;
  }>;
  breakdownMachines: Array<{
    id: string;
    code: string;
    name: string | null;
    type: string;
  }>;
}

export async function getOwnerDashboardSummary(
  month: string
): Promise<OwnerDashboardSummary> {
  await requireRole([Role.ADMIN, Role.ACCOUNTS]);

  const pnl = await getMonthlyPnL(month);

  // 1. Revenue vs Cost for last 6 months
  const [currY, currM] = month.split("-").map(Number);
  const revenueVsCost = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(currY, currM - 1 - i, 1));
    const mStr = d.toISOString().slice(0, 7);
    const mStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const mEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999));

    const inv = await prisma.invoice.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: mStart, lte: mEnd } },
    });
    const rev = Number(inv._sum.total) || 0;
    const w = await getMonthlyWagesTotal(mStr);
    const exp = await getMonthlyExpensesTotal(mStr);
    const c = w + exp;

    revenueVsCost.push({
      month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      revenue: Number(rev.toFixed(0)),
      cost: Number(c.toFixed(0)),
      profit: Number((rev - c).toFixed(0)),
    });
  }

  // 2. Machine output this month
  const [y, mNum] = month.split("-").map(Number);
  const mStart = new Date(Date.UTC(y, mNum - 1, 1));
  const mEnd = new Date(Date.UTC(y, mNum, 0, 23, 59, 59, 999));

  const currentMonthLogs = await prisma.productionLog.findMany({
    where: { createdAt: { gte: mStart, lte: mEnd } },
    include: {
      workOrder: {
        include: {
          machine: true,
        },
      },
    },
  });

  const machMap = new Map<string, { code: string; type: string; metres: number; hours: number }>();
  for (const log of currentMonthLogs) {
    if (log.workOrder.machine) {
      const code = log.workOrder.machine.code;
      const cur = machMap.get(code) || {
        code,
        type: log.workOrder.machine.type,
        metres: 0,
        hours: 0,
      };
      cur.metres += Number(log.qty);
      cur.hours += Number(log.hours);
      machMap.set(code, cur);
    }
  }

  const machineOutputCurrentMonth = Array.from(machMap.values()).map((v) => ({
    code: v.code,
    type: v.type,
    metres: Number(v.metres.toFixed(0)),
    hours: Number(v.hours.toFixed(1)),
  }));

  // 3. Order pipeline by status
  const ordersPipeline = await prisma.order.groupBy({
    by: ["status"],
    _count: { id: true },
    _sum: { qtyMetres: true },
  });

  const orderPipeline = ordersPipeline.map((op) => ({
    status: op.status,
    count: op._count.id,
    metres: Number(op._sum.qtyMetres) || 0,
  }));

  // 4. Orders past deadline or at risk
  const now = new Date();
  const activeOrders = await prisma.order.findMany({
    where: {
      status: { notIn: ["DISPATCHED", "CANCELLED"] },
    },
    include: { buyer: true },
    orderBy: { deadline: "asc" },
  });

  const atRiskOrders = activeOrders
    .filter((o) => o.deadline < now)
    .slice(0, 10)
    .map((o) => ({
      id: o.id,
      orderNo: o.orderNo,
      buyerName: o.buyer.name,
      deadline: o.deadline.toISOString().slice(0, 10),
      status: o.status,
      isOverdue: o.deadline < now,
    }));

  // 5. Yarns below reorder level
  const yarns = await prisma.yarnType.findMany({
    include: {
      stockMovements: true,
    },
  });

  const lowStockYarns = yarns
    .map((y) => {
      const onHand = y.stockMovements.reduce((sum, m) => {
        if (m.reason === "RECEIPT") return sum + Number(m.qty);
        if (m.reason === "ISSUE") return sum + Number(m.qty); // signed negative
        if (m.reason === "ADJUST") return sum + Number(m.qty);
        return sum;
      }, 0);
      return {
        id: y.id,
        type: y.type,
        colour: y.colour,
        onHand: Number(onHand.toFixed(2)),
        reorderLevel: Number(y.reorderLevel),
      };
    })
    .filter((y) => y.onHand < y.reorderLevel)
    .slice(0, 10);

  // 6. Machines in breakdown
  const breakdownMachines = await prisma.machine.findMany({
    where: { status: "BREAKDOWN" },
    select: { id: true, code: true, name: true, type: true },
  });

  return {
    month,
    pnl,
    revenueVsCost,
    machineOutputCurrentMonth,
    orderPipeline,
    atRiskOrders,
    lowStockYarns,
    breakdownMachines,
  };
}
