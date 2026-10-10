import { prisma } from "@/lib/db";
import { Role, Shift } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import {
  bulkAttendanceInputSchema,
  BulkAttendanceInput,
  monthSelectorSchema,
} from "./schemas/hr";

// ----------------------------------------------------------------------------
// 1. WORKER ATTENDANCE
// ----------------------------------------------------------------------------

export interface WorkerAttendanceRow {
  workerId: string;
  name: string;
  code: string | null;
  role: string | null;
  dailyRate: number;
  otRatePerHour: number;
  present: boolean;
  hours: number;
  overtimeHours: number;
}

export interface DayAttendanceData {
  date: string;
  shift: Shift;
  workers: WorkerAttendanceRow[];
}

export async function getAttendanceForShift(
  dateStr: string,
  shift: Shift
): Promise<DayAttendanceData> {
  // SUPERVISOR, ADMIN, ACCOUNTS, STORE can view
  await requireRole([
    Role.ADMIN,
    Role.SUPERVISOR,
    Role.ACCOUNTS,
    Role.STORE,
  ]);

  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

  const activeWorkers = await prisma.worker.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const existingRecords = await prisma.attendance.findMany({
    where: {
      date: targetDate,
      shift,
    },
  });

  const recordMap = new Map(existingRecords.map((r) => [r.workerId, r]));

  const workers: WorkerAttendanceRow[] = activeWorkers.map((w) => {
    const existing = recordMap.get(w.id);
    return {
      workerId: w.id,
      name: w.name,
      code: w.code,
      role: w.role,
      dailyRate: Number(w.dailyRate),
      otRatePerHour: Number(w.otRatePerHour),
      present: existing ? existing.present : true,
      hours: existing ? Number(existing.hours) : 8,
      overtimeHours: existing ? Number(existing.overtimeHours) : 0,
    };
  });

  return {
    date: dateStr,
    shift,
    workers,
  };
}

export async function saveBulkAttendance(
  input: BulkAttendanceInput
): Promise<{ count: number }> {
  // SUPERVISOR and ADMIN can record attendance
  const user = await requireRole([Role.SUPERVISOR, Role.ADMIN]);

  const validated = bulkAttendanceInputSchema.parse(input);
  const targetDate = new Date(`${validated.date}T00:00:00.000Z`);

  await prisma.$transaction(
    validated.records.map((rec) =>
      prisma.attendance.upsert({
        where: {
          workerId_date_shift: {
            workerId: rec.workerId,
            date: targetDate,
            shift: validated.shift,
          },
        },
        create: {
          workerId: rec.workerId,
          date: targetDate,
          shift: validated.shift,
          present: rec.present,
          hours: rec.present ? rec.hours : 0,
          overtimeHours: rec.present ? rec.overtimeHours : 0,
        },
        update: {
          present: rec.present,
          hours: rec.present ? rec.hours : 0,
          overtimeHours: rec.present ? rec.overtimeHours : 0,
        },
      })
    )
  );

  await logAction({
    userId: user.id,
    action: "ATTENDANCE_RECORDED",
    entity: "Attendance",
    meta: {
      date: validated.date,
      shift: validated.shift,
      recordCount: validated.records.length,
    },
  });

  return { count: validated.records.length };
}

// ----------------------------------------------------------------------------
// 2. MONTHLY ATTENDANCE SUMMARY
// ----------------------------------------------------------------------------

export interface WorkerMonthlyAttendance {
  workerId: string;
  name: string;
  code: string | null;
  role: string | null;
  daysPresent: number;
  totalHours: number;
  overtimeHours: number;
}

export async function getMonthlyAttendanceSummary(
  month: string
): Promise<WorkerMonthlyAttendance[]> {
  await requireRole([
    Role.ADMIN,
    Role.SUPERVISOR,
    Role.ACCOUNTS,
  ]);

  monthSelectorSchema.parse({ month });

  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
  const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

  const workers = await prisma.worker.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const attendances = await prisma.attendance.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
      present: true,
    },
  });

  const map = new Map<
    string,
    { daysPresent: number; totalHours: number; overtimeHours: number }
  >();

  for (const att of attendances) {
    const cur = map.get(att.workerId) || {
      daysPresent: 0,
      totalHours: 0,
      overtimeHours: 0,
    };
    cur.daysPresent += 1;
    cur.totalHours += Number(att.hours);
    cur.overtimeHours += Number(att.overtimeHours);
    map.set(att.workerId, cur);
  }

  return workers.map((w) => {
    const stats = map.get(w.id) || {
      daysPresent: 0,
      totalHours: 0,
      overtimeHours: 0,
    };
    return {
      workerId: w.id,
      name: w.name,
      code: w.code,
      role: w.role,
      daysPresent: stats.daysPresent,
      totalHours: stats.totalHours,
      overtimeHours: stats.overtimeHours,
    };
  });
}

// ----------------------------------------------------------------------------
// 3. WAGES CALCULATION & FINALISATION
// ----------------------------------------------------------------------------

export interface WorkerWageCalculation {
  workerId: string;
  name: string;
  code: string | null;
  role: string | null;
  dailyRate: number;
  otRatePerHour: number;
  daysPresent: number;
  otHours: number;
  grossPay: number;
}

export interface MonthlyWagesResult {
  month: string;
  isFinalised: boolean;
  finalisedAt: string | null;
  workers: WorkerWageCalculation[];
  totalGross: number;
}

export async function getMonthlyWages(month: string): Promise<MonthlyWagesResult> {
  await requireRole([Role.ADMIN, Role.ACCOUNTS, Role.SUPERVISOR]);
  monthSelectorSchema.parse({ month });

  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
  const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

  // Check if wage records are already finalised for this month
  const finalisedRecords = await prisma.wageRecord.findMany({
    where: { month },
    include: { worker: true },
  });

  const isFinalised = finalisedRecords.length > 0;
  const finalisedAt = isFinalised && finalisedRecords[0].finalisedAt
    ? finalisedRecords[0].finalisedAt.toISOString()
    : null;

  if (isFinalised) {
    const workersMap = new Map(finalisedRecords.map((r) => [r.workerId, r]));

    // Fetch attendances for that month to supply breakdown
    const attendances = await prisma.attendance.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        present: true,
      },
    });

    const attMap = new Map<string, { daysPresent: number; otHours: number }>();
    for (const a of attendances) {
      const cur = attMap.get(a.workerId) || { daysPresent: 0, otHours: 0 };
      cur.daysPresent += 1;
      cur.otHours += Number(a.overtimeHours);
      attMap.set(a.workerId, cur);
    }

    let totalGross = 0;
    const workers: WorkerWageCalculation[] = finalisedRecords.map((rec) => {
      const att = attMap.get(rec.workerId) || { daysPresent: 0, otHours: 0 };
      const gross = Number(rec.amount);
      totalGross += gross;
      return {
        workerId: rec.workerId,
        name: rec.worker.name,
        code: rec.worker.code,
        role: rec.worker.role,
        dailyRate: Number(rec.worker.dailyRate),
        otRatePerHour: Number(rec.worker.otRatePerHour),
        daysPresent: att.daysPresent,
        otHours: att.otHours,
        grossPay: gross,
      };
    });

    return {
      month,
      isFinalised: true,
      finalisedAt,
      workers,
      totalGross: Number(totalGross.toFixed(2)),
    };
  }

  // Otherwise calculate live from attendance
  const activeWorkers = await prisma.worker.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  const attendances = await prisma.attendance.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      present: true,
    },
  });

  const attMap = new Map<string, { daysPresent: number; otHours: number }>();
  for (const a of attendances) {
    const cur = attMap.get(a.workerId) || { daysPresent: 0, otHours: 0 };
    cur.daysPresent += 1;
    cur.otHours += Number(a.overtimeHours);
    attMap.set(a.workerId, cur);
  }

  let totalGross = 0;
  const workers: WorkerWageCalculation[] = activeWorkers.map((w) => {
    const att = attMap.get(w.id) || { daysPresent: 0, otHours: 0 };
    const dailyRate = Number(w.dailyRate);
    const otRate = Number(w.otRatePerHour);
    // gross = dailyRate x days + otRatePerHour x OT hours
    const gross = Number(
      (dailyRate * att.daysPresent + otRate * att.otHours).toFixed(2)
    );
    totalGross += gross;

    return {
      workerId: w.id,
      name: w.name,
      code: w.code,
      role: w.role,
      dailyRate,
      otRatePerHour: otRate,
      daysPresent: att.daysPresent,
      otHours: att.otHours,
      grossPay: gross,
    };
  });

  return {
    month,
    isFinalised: false,
    finalisedAt: null,
    workers,
    totalGross: Number(totalGross.toFixed(2)),
  };
}

export async function finaliseMonthWages(
  month: string
): Promise<{ count: number; totalGross: number }> {
  const user = await requireRole([Role.ADMIN, Role.ACCOUNTS]);
  monthSelectorSchema.parse({ month });

  // 1. Check idempotency: if already finalised, refuse to run twice
  const existing = await prisma.wageRecord.findFirst({
    where: { month },
  });

  if (existing) {
    throw new Error(
      `Wage records for month ${month} have already been finalised and locked.`
    );
  }

  // 2. Compute wages for all active workers
  const computed = await getMonthlyWages(month);
  const now = new Date();

  // 3. Write WageRecords idempotently in one transaction
  await prisma.$transaction(
    computed.workers.map((w) =>
      prisma.wageRecord.create({
        data: {
          workerId: w.workerId,
          month,
          amount: w.grossPay,
          finalisedAt: now,
        },
      })
    )
  );

  await logAction({
    userId: user.id,
    action: "WAGES_FINALISED",
    entity: "WageRecord",
    meta: {
      month,
      workerCount: computed.workers.length,
      totalGross: computed.totalGross,
    },
  });

  return {
    count: computed.workers.length,
    totalGross: computed.totalGross,
  };
}

/**
 * Export getMonthlyWagesTotal(month):
 * finalised records if present, otherwise computed dynamically.
 */
export async function getMonthlyWagesTotal(month: string): Promise<number> {
  monthSelectorSchema.parse({ month });

  const finalised = await prisma.wageRecord.findMany({
    where: { month },
    select: { amount: true },
  });

  if (finalised.length > 0) {
    const total = finalised.reduce((acc, r) => acc + Number(r.amount), 0);
    return Number(total.toFixed(2));
  }

  // Not finalised: compute from attendance
  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
  const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

  const attendances = await prisma.attendance.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      present: true,
    },
    include: {
      worker: true,
    },
  });

  let total = 0;
  for (const a of attendances) {
    const dailyRate = Number(a.worker.dailyRate);
    const otRate = Number(a.worker.otRatePerHour);
    const otHours = Number(a.overtimeHours);
    total += dailyRate + otRate * otHours;
  }

  return Number(total.toFixed(2));
}
