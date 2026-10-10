import { prisma } from "@/lib/db";
import {
  Prisma,
  Role,
  OrderStatus,
  ProductionStage,
  WorkOrderStatus,
  MachineStatus,
  QCStatus,
  Shift,
} from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import { nextNumber } from "@/lib/counters";
import { issueYarnToWorkOrder } from "./inventory";
import {
  planProductionSchema,
  startWorkOrderSchema,
  machineActionSchema,
  logOutputSchema,
  workOrdersFilterSchema,
  PlanProductionInput,
  StartWorkOrderInput,
  MachineActionInput,
  LogOutputInput,
  WorkOrdersFilterInput,
} from "./schemas/production";

export const ROLL_LENGTH_M = 50;

// ----------------------------------------------------------------------------
// 1. PRODUCTION PLANNING
// ----------------------------------------------------------------------------

/**
 * Returns CONFIRMED orders that have not yet had WorkOrders created and are not awaiting material.
 */
export async function getPlanningEligibleOrders() {
  const orders = await prisma.order.findMany({
    where: {
      status: OrderStatus.CONFIRMED,
      workOrders: { none: {} },
    },
    include: {
      buyer: { select: { id: true, name: true } },
    },
    orderBy: { deadline: "asc" },
  });

  // Verify each order is not awaiting material (all BOM components reserved)
  const eligibleOrders = [];
  for (const o of orders) {
    const boms = await prisma.bOM.findMany({
      where: { fabricType: o.fabricType },
    });

    if (boms.length === 0) {
      eligibleOrders.push({
        id: o.id,
        orderNo: o.orderNo,
        fabricType: o.fabricType,
        colour: o.colour,
        qtyMetres: Number(o.qtyMetres),
        deadline: o.deadline.toISOString(),
        buyerName: o.buyer.name,
      });
      continue;
    }

    // Check reserves vs requirements
    const reserves = await prisma.stockMovement.groupBy({
      by: ["yarnTypeId"],
      where: {
        refType: "ORDER",
        refId: o.id,
        reason: "RESERVE",
      },
      _sum: { qty: true },
    });

    const reserveMap = new Map<string, number>();
    for (const r of reserves) {
      reserveMap.set(r.yarnTypeId, r._sum.qty ? Number(r._sum.qty) : 0);
    }

    const orderQty = Number(o.qtyMetres);
    const hasShortfall = boms.some((b) => {
      const required = Number(b.yarnPerMetre) * orderQty;
      const reserved = reserveMap.get(b.yarnTypeId) || 0;
      return reserved < required - 0.001;
    });

    if (!hasShortfall) {
      eligibleOrders.push({
        id: o.id,
        orderNo: o.orderNo,
        fabricType: o.fabricType,
        colour: o.colour,
        qtyMetres: orderQty,
        deadline: o.deadline.toISOString(),
        buyerName: o.buyer.name,
      });
    }
  }

  return eligibleOrders;
}

/**
 * Returns active IDLE machines grouped by stage type (SPINNING, WEAVING, DYEING).
 */
export async function getIdleMachines() {
  const machines = await prisma.machine.findMany({
    where: { status: MachineStatus.IDLE },
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      status: true,
    },
    orderBy: { code: "asc" },
  });

  return {
    spinning: machines.filter((m) => m.type === "SPINNING"),
    weaving: machines.filter((m) => m.type === "WEAVING"),
    dyeing: machines.filter((m) => m.type === "DYEING"),
  };
}

/**
 * Plans production for a confirmed order by creating 3 work orders (SPINNING, WEAVING, DYEING).
 * Machines must be IDLE. TargetQty = order metres. Status = PLANNED.
 */
export async function planProduction(input: PlanProductionInput) {
  const user = await requireRole([Role.ADMIN, Role.SUPERVISOR]);
  const validated = planProductionSchema.parse(input);

  const order = await prisma.order.findUnique({
    where: { id: validated.orderId },
    include: { workOrders: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.status !== OrderStatus.CONFIRMED) {
    throw new Error(`Order must be in CONFIRMED status to plan production (current: ${order.status})`);
  }

  if (order.workOrders.length > 0) {
    throw new Error("Work orders have already been scheduled for this order");
  }

  // Ensure all 3 chosen machines exist and are IDLE
  const machineIds = [
    validated.spinningMachineId,
    validated.weavingMachineId,
    validated.dyeingMachineId,
  ];

  const machines = await prisma.machine.findMany({
    where: { id: { in: machineIds } },
  });

  if (machines.length !== 3) {
    throw new Error("One or more selected machines could not be found");
  }

  for (const m of machines) {
    if (m.status !== MachineStatus.IDLE) {
      throw new Error(`Machine ${m.code} is currently ${m.status}. Only IDLE machines can be scheduled.`);
    }
  }

  const spinningMachine = machines.find((m) => m.type === "SPINNING" && m.id === validated.spinningMachineId);
  const weavingMachine = machines.find((m) => m.type === "WEAVING" && m.id === validated.weavingMachineId);
  const dyeingMachine = machines.find((m) => m.type === "DYEING" && m.id === validated.dyeingMachineId);

  if (!spinningMachine || !weavingMachine || !dyeingMachine) {
    throw new Error("Machine type mismatch: each stage must be allocated to its corresponding machine type.");
  }

  const targetQty = order.qtyMetres;

  const result = await prisma.$transaction(async (tx) => {
    const spinningWO = await tx.workOrder.create({
      data: {
        orderId: order.id,
        stage: ProductionStage.SPINNING,
        machineId: spinningMachine.id,
        targetQty,
        producedQty: new Prisma.Decimal(0),
        status: WorkOrderStatus.PLANNED,
      },
    });

    const weavingWO = await tx.workOrder.create({
      data: {
        orderId: order.id,
        stage: ProductionStage.WEAVING,
        machineId: weavingMachine.id,
        targetQty,
        producedQty: new Prisma.Decimal(0),
        status: WorkOrderStatus.PLANNED,
      },
    });

    const dyeingWO = await tx.workOrder.create({
      data: {
        orderId: order.id,
        stage: ProductionStage.DYEING,
        machineId: dyeingMachine.id,
        targetQty,
        producedQty: new Prisma.Decimal(0),
        status: WorkOrderStatus.PLANNED,
      },
    });

    return [spinningWO, weavingWO, dyeingWO];
  });

  await logAction({
    userId: user.id,
    action: "PLAN_PRODUCTION",
    entity: "Order",
    entityId: order.id,
    meta: {
      orderNo: order.orderNo,
      workOrderIds: result.map((w) => w.id),
    },
  });

  return result;
}

// ----------------------------------------------------------------------------
// 2. MACHINE BOARD
// ----------------------------------------------------------------------------

export interface MachineCardData {
  id: string;
  code: string;
  name: string | null;
  type: string;
  status: MachineStatus;
  currentOrderNo: string | null;
  currentStage: ProductionStage | null;
  currentWorkOrderId: string | null;
  targetQty: number;
  producedQty: number;
  progressPercent: number;
  todayOutputMetres: number;
}

export interface MachineBoardSummary {
  machines: MachineCardData[];
  totalMachines: number;
  runningCount: number;
  idleCount: number;
  maintenanceCount: number;
  breakdownCount: number;
  todayMetres: number;
}

export async function getMachineBoard(): Promise<MachineBoardSummary> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [machines, runningWorkOrders, todayLogs] = await Promise.all([
    prisma.machine.findMany({
      orderBy: [{ type: "asc" }, { code: "asc" }],
    }),
    prisma.workOrder.findMany({
      where: {
        status: { in: [WorkOrderStatus.RUNNING, WorkOrderStatus.BLOCKED] },
        machineId: { not: null },
      },
      include: {
        order: { select: { orderNo: true } },
      },
    }),
    prisma.productionLog.findMany({
      where: {
        createdAt: { gte: startOfDay },
      },
      select: {
        workOrderId: true,
        qty: true,
      },
    }),
  ]);

  // Map machineId -> active workOrder
  const activeWOMap = new Map<string, (typeof runningWorkOrders)[0]>();
  for (const wo of runningWorkOrders) {
    if (wo.machineId) {
      activeWOMap.set(wo.machineId, wo);
    }
  }

  // Map workOrderId -> today's output sum
  const todayOutputByWO = new Map<string, number>();
  let overallTodayMetres = 0;
  for (const log of todayLogs) {
    const qty = Number(log.qty);
    overallTodayMetres += qty;
    todayOutputByWO.set(
      log.workOrderId,
      (todayOutputByWO.get(log.workOrderId) || 0) + qty
    );
  }

  let runningCount = 0;
  let idleCount = 0;
  let maintenanceCount = 0;
  let breakdownCount = 0;

  const cardList: MachineCardData[] = machines.map((m) => {
    if (m.status === MachineStatus.RUNNING) runningCount++;
    else if (m.status === MachineStatus.IDLE) idleCount++;
    else if (m.status === MachineStatus.MAINTENANCE) maintenanceCount++;
    else if (m.status === MachineStatus.BREAKDOWN) breakdownCount++;

    const activeWO = activeWOMap.get(m.id);
    const targetQty = activeWO ? Number(activeWO.targetQty) : 0;
    const producedQty = activeWO ? Number(activeWO.producedQty) : 0;
    const progressPercent = targetQty > 0 ? Math.min(100, Math.round((producedQty / targetQty) * 100)) : 0;
    const todayOutputMetres = activeWO ? todayOutputByWO.get(activeWO.id) || 0 : 0;

    return {
      id: m.id,
      code: m.code,
      name: m.name,
      type: m.type,
      status: m.status,
      currentOrderNo: activeWO?.order.orderNo || null,
      currentStage: activeWO?.stage || null,
      currentWorkOrderId: activeWO?.id || null,
      targetQty,
      producedQty,
      progressPercent,
      todayOutputMetres,
    };
  });

  return {
    machines: cardList,
    totalMachines: machines.length,
    runningCount,
    idleCount,
    maintenanceCount,
    breakdownCount,
    todayMetres: Math.round(overallTodayMetres),
  };
}

// ----------------------------------------------------------------------------
// 3. WORK ORDER EXECUTION (START, BREAKDOWN, RESUME, MARK IDLE)
// ----------------------------------------------------------------------------

/**
 * Starting a PLANNED work order sets it RUNNING, the machine RUNNING and,
 * on the first start for an order, the order IN_PRODUCTION.
 * Ensures one work order per machine at a time.
 */
export async function startWorkOrder(workOrderId: string) {
  const user = await requireRole([Role.ADMIN, Role.SUPERVISOR]);

  const wo = await prisma.workOrder.findUnique({
    where: { id: workOrderId },
    include: { machine: true, order: true },
  });

  if (!wo) throw new Error("Work order not found");
  if (wo.status !== WorkOrderStatus.PLANNED) {
    throw new Error(`Only PLANNED work orders can be started (current: ${wo.status})`);
  }

  if (!wo.machineId || !wo.machine) {
    throw new Error("Work order does not have an assigned machine");
  }

  // Verify machine does not have another active work order
  const existingActive = await prisma.workOrder.findFirst({
    where: {
      machineId: wo.machineId,
      status: { in: [WorkOrderStatus.RUNNING, WorkOrderStatus.BLOCKED] },
      id: { not: wo.id },
    },
  });

  if (existingActive) {
    throw new Error(
      `Machine ${wo.machine.code} already has an active work order in progress`
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update WorkOrder
    const updatedWO = await tx.workOrder.update({
      where: { id: wo.id },
      data: {
        status: WorkOrderStatus.RUNNING,
        startedAt: wo.startedAt || new Date(),
      },
    });

    // 2. Set Machine RUNNING
    await tx.machine.update({
      where: { id: wo.machineId! },
      data: { status: MachineStatus.RUNNING },
    });

    // 3. If first work order starting on this order, set Order IN_PRODUCTION
    if (wo.order.status === OrderStatus.CONFIRMED) {
      await tx.order.update({
        where: { id: wo.orderId },
        data: { status: OrderStatus.IN_PRODUCTION },
      });
    }

    return updatedWO;
  });

  await logAction({
    userId: user.id,
    action: "START_WORK_ORDER",
    entity: "WorkOrder",
    entityId: wo.id,
    meta: {
      orderNo: wo.order.orderNo,
      stage: wo.stage,
      machineCode: wo.machine.code,
    },
  });

  return result;
}

/**
 * Breakdown: sets machine BREAKDOWN, active work order BLOCKED,
 * and creates a Notification for ADMIN and SUPERVISOR.
 */
export async function recordMachineBreakdown(machineId: string, reason?: string) {
  const user = await requireRole([Role.ADMIN, Role.SUPERVISOR]);

  const machine = await prisma.machine.findUnique({
    where: { id: machineId },
  });

  if (!machine) throw new Error("Machine not found");

  const activeWO = await prisma.workOrder.findFirst({
    where: {
      machineId,
      status: WorkOrderStatus.RUNNING,
    },
    include: { order: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.machine.update({
      where: { id: machineId },
      data: { status: MachineStatus.BREAKDOWN },
    });

    if (activeWO) {
      await tx.workOrder.update({
        where: { id: activeWO.id },
        data: { status: WorkOrderStatus.BLOCKED },
      });
    }

    // Send notifications for ADMIN and SUPERVISOR roles
    const notificationMsg = `Machine ${machine.code} (${machine.type}) reported BREAKDOWN: ${reason || "Unspecified mechanical failure"}${activeWO ? ` halting Order #${activeWO.order.orderNo}` : ""}`;
    
    await tx.notification.createMany({
      data: [
        {
          role: Role.ADMIN,
          type: "MACHINE_BREAKDOWN",
          message: notificationMsg,
        },
        {
          role: Role.SUPERVISOR,
          type: "MACHINE_BREAKDOWN",
          message: notificationMsg,
        },
      ],
    });
  });

  await logAction({
    userId: user.id,
    action: "MACHINE_BREAKDOWN",
    entity: "Machine",
    entityId: machineId,
    meta: { machineCode: machine.code, reason },
  });

  return { ok: true };
}

/**
 * Maintenance: sets machine MAINTENANCE, active work order BLOCKED if any.
 */
export async function setMachineMaintenance(machineId: string, reason?: string) {
  const user = await requireRole([Role.ADMIN, Role.SUPERVISOR]);

  const machine = await prisma.machine.findUnique({
    where: { id: machineId },
  });

  if (!machine) throw new Error("Machine not found");

  const activeWO = await prisma.workOrder.findFirst({
    where: {
      machineId,
      status: WorkOrderStatus.RUNNING,
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.machine.update({
      where: { id: machineId },
      data: { status: MachineStatus.MAINTENANCE },
    });

    if (activeWO) {
      await tx.workOrder.update({
        where: { id: activeWO.id },
        data: { status: WorkOrderStatus.BLOCKED },
      });
    }
  });

  await logAction({
    userId: user.id,
    action: "MACHINE_MAINTENANCE",
    entity: "Machine",
    entityId: machineId,
    meta: { machineCode: machine.code, reason },
  });

  return { ok: true };
}

/**
 * Resume: restores machine and blocked work order to RUNNING.
 */
export async function resumeMachine(machineId: string) {
  const user = await requireRole([Role.ADMIN, Role.SUPERVISOR]);

  const machine = await prisma.machine.findUnique({
    where: { id: machineId },
  });

  if (!machine) throw new Error("Machine not found");

  const blockedWO = await prisma.workOrder.findFirst({
    where: {
      machineId,
      status: WorkOrderStatus.BLOCKED,
    },
  });

  await prisma.$transaction(async (tx) => {
    if (blockedWO) {
      await tx.machine.update({
        where: { id: machineId },
        data: { status: MachineStatus.RUNNING },
      });

      await tx.workOrder.update({
        where: { id: blockedWO.id },
        data: { status: WorkOrderStatus.RUNNING },
      });
    } else {
      await tx.machine.update({
        where: { id: machineId },
        data: { status: MachineStatus.IDLE },
      });
    }
  });

  await logAction({
    userId: user.id,
    action: "RESUME_MACHINE",
    entity: "Machine",
    entityId: machineId,
    meta: { machineCode: machine.code },
  });

  return { ok: true };
}

/**
 * Mark idle: only allowed when no active or blocked work order is present.
 */
export async function markMachineIdle(machineId: string) {
  const user = await requireRole([Role.ADMIN, Role.SUPERVISOR]);

  const activeWO = await prisma.workOrder.findFirst({
    where: {
      machineId,
      status: { in: [WorkOrderStatus.RUNNING, WorkOrderStatus.BLOCKED] },
    },
  });

  if (activeWO) {
    throw new Error("Cannot set machine to IDLE while a work order is active or blocked");
  }

  const updated = await prisma.machine.update({
    where: { id: machineId },
    data: { status: MachineStatus.IDLE },
  });

  await logAction({
    userId: user.id,
    action: "MARK_MACHINE_IDLE",
    entity: "Machine",
    entityId: machineId,
    meta: { machineCode: updated.code },
  });

  return updated;
}

// ----------------------------------------------------------------------------
// 4. LOG OUTPUT & ROLL GENERATION
// ----------------------------------------------------------------------------

/**
 * Log output on a work order:
 * In one transaction:
 * - Append ProductionLog
 * - Increase producedQty (reject over-entry beyond targetQty)
 * - SPINNING stage: call issueYarnToWorkOrder for each BOM yarn in proportion to metres logged
 * - DYEING stage: maintain Rolls so sum of roll lengths = floor(producedQty / 50) * 50 using ROLL_LENGTH_M = 50,
 *   creating rollNo with nextNumber("roll", "RL") and qcStatus PENDING; at completion add remainder roll.
 * - When producedQty reaches targetQty: set work order DONE, machine IDLE.
 * - When all 3 stages for an order are DONE: set order status QC.
 */
export async function logProductionOutput(input: LogOutputInput) {
  const user = await requireRole([Role.ADMIN, Role.SUPERVISOR]);
  const validated = logOutputSchema.parse(input);

  const wo = await prisma.workOrder.findUnique({
    where: { id: validated.workOrderId },
    include: {
      machine: true,
      order: {
        include: {
          workOrders: true,
        },
      },
    },
  });

  if (!wo) throw new Error("Work order not found");
  if (wo.status !== WorkOrderStatus.RUNNING) {
    throw new Error(`Output can only be logged for RUNNING work orders (current: ${wo.status})`);
  }

  const currentProduced = Number(wo.producedQty);
  const target = Number(wo.targetQty);
  const newTotalProduced = currentProduced + validated.metres;

  if (newTotalProduced > target) {
    throw new Error(
      `Logged output (${validated.metres}m) exceeds remaining target (${(target - currentProduced).toFixed(2)}m)`
    );
  }

  // 1. If SPINNING stage: check and issue yarn stock in proportion to logged metres
  if (wo.stage === ProductionStage.SPINNING) {
    const boms = await prisma.bOM.findMany({
      where: { fabricType: wo.order.fabricType },
      include: { yarnType: true },
    });

    for (const bom of boms) {
      const requiredQty = Number((Number(bom.yarnPerMetre) * validated.metres).toFixed(4));
      if (requiredQty > 0) {
        await issueYarnToWorkOrder(wo.id, bom.yarnTypeId, requiredQty);
      }
    }
  }

  // 2. Database transaction for ProductionLog, WorkOrder, Rolls and Order state transition
  const result = await prisma.$transaction(async (tx) => {
    // Append ProductionLog
    const log = await tx.productionLog.create({
      data: {
        workOrderId: wo.id,
        qty: new Prisma.Decimal(validated.metres),
        hours: new Prisma.Decimal(validated.hours),
        operatorId: user.id,
        shift: validated.shift,
      },
    });

    const isComplete = newTotalProduced >= target;

    // Update WorkOrder producedQty and status
    const updatedWO = await tx.workOrder.update({
      where: { id: wo.id },
      data: {
        producedQty: new Prisma.Decimal(newTotalProduced),
        status: isComplete ? WorkOrderStatus.DONE : WorkOrderStatus.RUNNING,
        endedAt: isComplete ? new Date() : null,
      },
    });

    // If complete, free up machine
    if (isComplete && wo.machineId) {
      await tx.machine.update({
        where: { id: wo.machineId },
        data: { status: MachineStatus.IDLE },
      });
    }

    // 3. If DYEING stage: generate rolls
    if (wo.stage === ProductionStage.DYEING) {
      const existingRolls = await tx.roll.findMany({
        where: { workOrderId: wo.id },
      });

      const currentRollCount = existingRolls.length;
      const targetFullRolls = Math.floor(newTotalProduced / ROLL_LENGTH_M);
      const newFullRollsNeeded = targetFullRolls - currentRollCount;

      for (let i = 0; i < newFullRollsNeeded; i++) {
        const rollNo = await nextNumber("roll", "RL", 6);
        await tx.roll.create({
          data: {
            rollNo,
            orderId: wo.orderId,
            workOrderId: wo.id,
            machineId: wo.machineId,
            lengthM: new Prisma.Decimal(ROLL_LENGTH_M),
            qcStatus: QCStatus.PENDING,
          },
        });
      }

      // If work order is finished and there's a fractional remainder roll
      if (isComplete) {
        const remainderMetres = Number((newTotalProduced % ROLL_LENGTH_M).toFixed(2));
        if (remainderMetres > 0) {
          const rollNo = await nextNumber("roll", "RL", 6);
          await tx.roll.create({
            data: {
              rollNo,
              orderId: wo.orderId,
              workOrderId: wo.id,
              machineId: wo.machineId,
              lengthM: new Prisma.Decimal(remainderMetres),
              qcStatus: QCStatus.PENDING,
            },
          });
        }
      }
    }

    // 4. If all 3 work orders for this order are DONE, transition order to QC
    if (isComplete) {
      const otherWOs = wo.order.workOrders.filter((w) => w.id !== wo.id);
      const allDone = otherWOs.every((w) => w.status === WorkOrderStatus.DONE);

      if (allDone) {
        await tx.order.update({
          where: { id: wo.orderId },
          data: { status: OrderStatus.QC },
        });
      }
    }

    return { log, updatedWO };
  });

  await logAction({
    userId: user.id,
    action: "LOG_PRODUCTION_OUTPUT",
    entity: "WorkOrder",
    entityId: wo.id,
    meta: {
      orderNo: wo.order.orderNo,
      stage: wo.stage,
      metres: validated.metres,
      hours: validated.hours,
      shift: validated.shift,
      newTotalProduced,
    },
  });

  return result;
}

// ----------------------------------------------------------------------------
// 5. WORK ORDERS LIST
// ----------------------------------------------------------------------------

export async function getWorkOrders(filters: WorkOrdersFilterInput) {
  const { page, pageSize, stage, status, orderId, machineId } =
    workOrdersFilterSchema.parse(filters);

  const where: Prisma.WorkOrderWhereInput = {
    ...(stage ? { stage } : {}),
    ...(status ? { status } : {}),
    ...(orderId ? { orderId } : {}),
    ...(machineId ? { machineId } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            orderNo: true,
            fabricType: true,
            colour: true,
            buyer: { select: { name: true } },
          },
        },
        machine: {
          select: { id: true, code: true, name: true, type: true },
        },
        _count: {
          select: { productionLogs: true, rolls: true },
        },
      },
    }),
  ]);

  return {
    data: items.map((w) => ({
      id: w.id,
      stage: w.stage,
      status: w.status,
      targetQty: Number(w.targetQty),
      producedQty: Number(w.producedQty),
      startedAt: w.startedAt ? w.startedAt.toISOString() : null,
      endedAt: w.endedAt ? w.endedAt.toISOString() : null,
      createdAt: w.createdAt.toISOString(),
      order: {
        id: w.order.id,
        orderNo: w.order.orderNo,
        fabricType: w.order.fabricType,
        colour: w.order.colour,
        buyerName: w.order.buyer.name,
      },
      machine: w.machine
        ? {
            id: w.machine.id,
            code: w.machine.code,
            name: w.machine.name,
            type: w.machine.type,
          }
        : null,
      logCount: w._count.productionLogs,
      rollCount: w._count.rolls,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
