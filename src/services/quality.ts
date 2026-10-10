import { prisma } from "@/lib/db";
import {
  Prisma,
  Role,
  QCStatus,
  OrderStatus,
} from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import {
  inspectRollSchema,
  reworkDoneSchema,
  qcQueueFilterSchema,
  rollsRegisterFilterSchema,
  InspectRollInput,
  ReworkDoneInput,
  QCQueueFilterInput,
  RollsRegisterFilterInput,
} from "./schemas/quality";

// ----------------------------------------------------------------------------
// 1. QC QUEUE & KPI METRICS
// ----------------------------------------------------------------------------

export interface QCKpiSummary {
  waitingCount: number;
  passedToday: number;
  reworkToday: number;
  rejectedToday: number;
}

export async function getQCKpiSummary(): Promise<QCKpiSummary> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [waitingCount, todayInspections] = await Promise.all([
    prisma.roll.count({
      where: { qcStatus: QCStatus.PENDING },
    }),
    prisma.qCInspection.findMany({
      where: { createdAt: { gte: startOfDay } },
      select: { result: true },
    }),
  ]);

  let passedToday = 0;
  let reworkToday = 0;
  let rejectedToday = 0;

  for (const insp of todayInspections) {
    if (insp.result === QCStatus.PASSED) passedToday++;
    else if (insp.result === QCStatus.REWORK) reworkToday++;
    else if (insp.result === QCStatus.REJECTED) rejectedToday++;
  }

  return {
    waitingCount,
    passedToday,
    reworkToday,
    rejectedToday,
  };
}

export async function getQCQueue(filters: QCQueueFilterInput) {
  const { page, pageSize, orderId, machineId, search } =
    qcQueueFilterSchema.parse(filters);

  const where: Prisma.RollWhereInput = {
    qcStatus: QCStatus.PENDING,
    ...(orderId ? { orderId } : {}),
    ...(machineId ? { machineId } : {}),
    ...(search
      ? {
          OR: [
            { rollNo: { contains: search, mode: "insensitive" } },
            { order: { orderNo: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.roll.count({ where }),
    prisma.roll.findMany({
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
        workOrder: {
          select: { id: true, stage: true },
        },
      },
    }),
  ]);

  return {
    data: items.map((r) => ({
      id: r.id,
      rollNo: r.rollNo,
      lengthM: Number(r.lengthM),
      qcStatus: r.qcStatus,
      createdAt: r.createdAt.toISOString(),
      order: {
        id: r.order.id,
        orderNo: r.order.orderNo,
        fabricType: r.order.fabricType,
        colour: r.order.colour,
        buyerName: r.order.buyer.name,
      },
      machine: r.machine
        ? {
            id: r.machine.id,
            code: r.machine.code,
            name: r.machine.name,
            type: r.machine.type,
          }
        : null,
      workOrder: r.workOrder ? { id: r.workOrder.id, stage: r.workOrder.stage } : null,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ----------------------------------------------------------------------------
// 2. ROLL INSPECTION & ORDER EVALUATION
// ----------------------------------------------------------------------------

export async function inspectRoll(input: InspectRollInput) {
  const user = await requireRole([Role.ADMIN, Role.QC]);
  const validated = inspectRollSchema.parse(input);

  const roll = await prisma.roll.findUnique({
    where: { rollNo: validated.rollNo },
    include: {
      order: {
        include: {
          rolls: true,
        },
      },
    },
  });

  if (!roll) throw new Error(`Roll ${validated.rollNo} not found`);

  const mappedStatus: QCStatus =
    validated.result === "PASS"
      ? QCStatus.PASSED
      : validated.result === "REWORK"
      ? QCStatus.REWORK
      : QCStatus.REJECTED;

  // Single transaction: create QCInspection and update Roll.qcStatus
  const result = await prisma.$transaction(async (tx) => {
    const inspection = await tx.qCInspection.create({
      data: {
        rollId: roll.id,
        inspectorId: user.id,
        result: mappedStatus,
        defects: validated.defects as any,
        severity: validated.severity || (validated.defects[0]?.severity ?? null),
        notes: validated.notes,
      },
    });

    const updatedRoll = await tx.roll.update({
      where: { id: roll.id },
      data: { qcStatus: mappedStatus },
    });

    // If REWORK: create Notification for SUPERVISOR
    if (mappedStatus === QCStatus.REWORK) {
      await tx.notification.create({
        data: {
          role: Role.SUPERVISOR,
          type: "ROLL_REWORK",
          message: `Roll ${roll.rollNo} for Order #${roll.order.orderNo} flagged for REWORK. Defects: ${validated.defects.map((d) => `${d.type} (${d.severity})`).join(", ")}`,
        },
      });
    }

    // 3. Evaluate Order Completion:
    // If no rolls are PENDING or REWORK, and total PASSED length >= order.qtyMetres * 0.98 -> READY + Notification to ACCOUNTS
    const allRolls = await tx.roll.findMany({
      where: { orderId: roll.orderId },
    });

    const hasPendingOrRework = allRolls.some(
      (r) => r.qcStatus === QCStatus.PENDING || r.qcStatus === QCStatus.REWORK
    );

    const totalPassedMetres = allRolls
      .filter((r) => r.qcStatus === QCStatus.PASSED)
      .reduce((sum, r) => sum + Number(r.lengthM), 0);

    const targetMetres = Number(roll.order.qtyMetres);
    const requiredMinMetres = targetMetres * 0.98;

    let orderUpdatedToReady = false;
    let shortfallMetres = 0;

    if (!hasPendingOrRework && totalPassedMetres >= requiredMinMetres) {
      await tx.order.update({
        where: { id: roll.orderId },
        data: { status: OrderStatus.READY },
      });
      orderUpdatedToReady = true;

      await tx.notification.create({
        data: {
          role: Role.ACCOUNTS,
          type: "ORDER_READY_FOR_DISPATCH",
          message: `Order #${roll.order.orderNo} has passed 100% QC inspection (${totalPassedMetres.toFixed(1)}m passed) and is READY for dispatch and invoicing.`,
        },
      });
    } else {
      shortfallMetres = Math.max(0, targetMetres - totalPassedMetres);
    }

    return {
      inspection,
      updatedRoll,
      orderEvaluation: {
        orderUpdatedToReady,
        totalPassedMetres,
        targetMetres,
        shortfallMetres,
        hasPendingOrRework,
      },
    };
  });

  await logAction({
    userId: user.id,
    action: "QC_INSPECT_ROLL",
    entity: "Roll",
    entityId: roll.id,
    meta: {
      rollNo: roll.rollNo,
      result: mappedStatus,
      defectCount: validated.defects.length,
      orderReady: result.orderEvaluation.orderUpdatedToReady,
    },
  });

  return result;
}

export async function markReworkDone(input: ReworkDoneInput) {
  const user = await requireRole([Role.ADMIN, Role.SUPERVISOR, Role.QC]);
  const validated = reworkDoneSchema.parse(input);

  const roll = await prisma.roll.findUnique({
    where: { rollNo: validated.rollNo },
  });

  if (!roll) throw new Error(`Roll ${validated.rollNo} not found`);
  if (roll.qcStatus !== QCStatus.REWORK) {
    throw new Error(`Only rolls in REWORK status can be marked rework done (current: ${roll.qcStatus})`);
  }

  const updated = await prisma.roll.update({
    where: { id: roll.id },
    data: { qcStatus: QCStatus.PENDING },
  });

  await logAction({
    userId: user.id,
    action: "ROLL_REWORK_DONE",
    entity: "Roll",
    entityId: roll.id,
    meta: { rollNo: roll.rollNo, notes: validated.notes },
  });

  return updated;
}

// ----------------------------------------------------------------------------
// 3. ROLL TRACE & QR CODE GENERATION
// ----------------------------------------------------------------------------

export async function getRollTrace(rollNo: string) {
  const roll = await prisma.roll.findUnique({
    where: { rollNo },
    include: {
      order: {
        include: {
          buyer: true,
          workOrders: {
            include: {
              machine: true,
              productionLogs: {
                include: { operator: { select: { id: true, name: true, email: true } } },
                orderBy: { createdAt: "desc" },
              },
            },
          },
        },
      },
      machine: true,
      workOrder: true,
      qcInspections: {
        include: { inspector: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      dispatch: true,
    },
  });

  if (!roll) return null;

  // Fetch yarn issued to the work orders of this order
  const workOrderIds = roll.order.workOrders.map((w) => w.id);
  const yarnIssuedMovements = await prisma.stockMovement.findMany({
    where: {
      refType: "WORK_ORDER",
      refId: { in: workOrderIds },
      reason: "ISSUE",
    },
    include: {
      yarnType: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    roll: {
      id: roll.id,
      rollNo: roll.rollNo,
      lengthM: Number(roll.lengthM),
      qcStatus: roll.qcStatus,
      createdAt: roll.createdAt.toISOString(),
      updatedAt: roll.updatedAt.toISOString(),
    },
    order: {
      id: roll.order.id,
      orderNo: roll.order.orderNo,
      fabricType: roll.order.fabricType,
      colour: roll.order.colour,
      qtyMetres: Number(roll.order.qtyMetres),
      status: roll.order.status,
      buyer: {
        id: roll.order.buyer.id,
        name: roll.order.buyer.name,
      },
    },
    machine: roll.machine
      ? {
          id: roll.machine.id,
          code: roll.machine.code,
          name: roll.machine.name,
          type: roll.machine.type,
        }
      : null,
    workOrders: roll.order.workOrders.map((wo) => ({
      id: wo.id,
      stage: wo.stage,
      status: wo.status,
      targetQty: Number(wo.targetQty),
      producedQty: Number(wo.producedQty),
      machine: wo.machine ? { code: wo.machine.code, type: wo.machine.type } : null,
      logs: wo.productionLogs.map((l) => ({
        id: l.id,
        qty: Number(l.qty),
        hours: Number(l.hours),
        shift: l.shift,
        operatorName: l.operator?.name || "Floor Operator",
        createdAt: l.createdAt.toISOString(),
      })),
    })),
    yarnIssued: yarnIssuedMovements.map((m) => ({
      id: m.id,
      yarnType: m.yarnType.type,
      colour: m.yarnType.colour,
      unit: m.yarnType.unit,
      qty: Math.abs(Number(m.qty)),
      workOrderId: m.refId,
      date: m.createdAt.toISOString(),
    })),
    inspections: roll.qcInspections.map((insp) => ({
      id: insp.id,
      result: insp.result,
      severity: insp.severity,
      notes: insp.notes,
      defects: (insp.defects as any) || [],
      inspectorName: insp.inspector?.name || "QC Inspector",
      date: insp.createdAt.toISOString(),
    })),
    dispatch: roll.dispatch
      ? {
          id: roll.dispatch.id,
          dispatchNo: roll.dispatch.dispatchNo,
          vehicleNo: roll.dispatch.vehicleNo,
          driverName: roll.dispatch.driver,
          date: roll.dispatch.dispatchedAt.toISOString(),
        }
      : null,
  };
}

// ----------------------------------------------------------------------------
// 4. ROLLS REGISTER
// ----------------------------------------------------------------------------

export async function getRollsRegister(filters: RollsRegisterFilterInput) {
  const { page, pageSize, orderId, machineId, qcStatus, search } =
    rollsRegisterFilterSchema.parse(filters);

  const where: Prisma.RollWhereInput = {
    ...(qcStatus ? { qcStatus } : {}),
    ...(orderId ? { orderId } : {}),
    ...(machineId ? { machineId } : {}),
    ...(search
      ? {
          OR: [
            { rollNo: { contains: search, mode: "insensitive" } },
            { order: { orderNo: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.roll.count({ where }),
    prisma.roll.findMany({
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
          select: { qcInspections: true },
        },
      },
    }),
  ]);

  return {
    data: items.map((r) => ({
      id: r.id,
      rollNo: r.rollNo,
      lengthM: Number(r.lengthM),
      qcStatus: r.qcStatus,
      createdAt: r.createdAt.toISOString(),
      order: {
        id: r.order.id,
        orderNo: r.order.orderNo,
        fabricType: r.order.fabricType,
        colour: r.order.colour,
        buyerName: r.order.buyer.name,
      },
      machine: r.machine
        ? {
            id: r.machine.id,
            code: r.machine.code,
            name: r.machine.name,
            type: r.machine.type,
          }
        : null,
      inspectionCount: r._count.qcInspections,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
