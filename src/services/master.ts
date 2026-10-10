import { prisma } from "@/lib/db";
import { Prisma, Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import {
  supplierSchema,
  buyerSchema,
  machineSchema,
  workerSchema,
  yarnTypeSchema,
  bomSchema,
  SupplierInput,
  BuyerInput,
  MachineInput,
  WorkerInput,
  YarnTypeInput,
  BomInput,
  PaginationQuery,
} from "./schemas/master";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// ============================================================================
// SUPPLIERS SERVICE
// ============================================================================

export async function getSuppliers(params: PaginationQuery): Promise<PaginatedResult<any>> {
  const { page, pageSize, search, includeInactive } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.SupplierWhereInput = {
    ...(includeInactive ? {} : { active: true }),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { contactPerson: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize) || 1,
  };
}

export async function createSupplier(input: SupplierInput) {
  const user = await requireRole([Role.ADMIN]);
  const validated = supplierSchema.parse(input);

  const record = await prisma.supplier.create({
    data: validated,
  });

  await logAction({
    userId: user.id,
    action: "CREATE_SUPPLIER",
    entity: "Supplier",
    entityId: record.id,
    meta: { name: record.name },
  });

  return record;
}

export async function updateSupplier(id: string, input: Partial<SupplierInput>) {
  const user = await requireRole([Role.ADMIN]);
  const validated = supplierSchema.partial().parse(input);

  const record = await prisma.supplier.update({
    where: { id },
    data: validated,
  });

  await logAction({
    userId: user.id,
    action: "UPDATE_SUPPLIER",
    entity: "Supplier",
    entityId: record.id,
    meta: { changes: validated },
  });

  return record;
}

export async function toggleSupplierActive(id: string, active: boolean) {
  const user = await requireRole([Role.ADMIN]);
  const record = await prisma.supplier.update({
    where: { id },
    data: { active },
  });

  await logAction({
    userId: user.id,
    action: active ? "ACTIVATE_SUPPLIER" : "DEACTIVATE_SUPPLIER",
    entity: "Supplier",
    entityId: id,
  });

  return record;
}

// ============================================================================
// BUYERS SERVICE
// ============================================================================

export async function getBuyers(params: PaginationQuery): Promise<PaginatedResult<any>> {
  const { page, pageSize, search, includeInactive } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.BuyerWhereInput = {
    ...(includeInactive ? {} : { active: true }),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { contactPerson: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.buyer.count({ where }),
    prisma.buyer.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize) || 1,
  };
}

export async function createBuyer(input: BuyerInput) {
  const user = await requireRole([Role.ADMIN]);
  const validated = buyerSchema.parse(input);

  const record = await prisma.buyer.create({
    data: validated,
  });

  await logAction({
    userId: user.id,
    action: "CREATE_BUYER",
    entity: "Buyer",
    entityId: record.id,
    meta: { name: record.name },
  });

  return record;
}

export async function updateBuyer(id: string, input: Partial<BuyerInput>) {
  const user = await requireRole([Role.ADMIN]);
  const validated = buyerSchema.partial().parse(input);

  const record = await prisma.buyer.update({
    where: { id },
    data: validated,
  });

  await logAction({
    userId: user.id,
    action: "UPDATE_BUYER",
    entity: "Buyer",
    entityId: record.id,
    meta: { changes: validated },
  });

  return record;
}

export async function toggleBuyerActive(id: string, active: boolean) {
  const user = await requireRole([Role.ADMIN]);
  const record = await prisma.buyer.update({
    where: { id },
    data: { active },
  });

  await logAction({
    userId: user.id,
    action: active ? "ACTIVATE_BUYER" : "DEACTIVATE_BUYER",
    entity: "Buyer",
    entityId: id,
  });

  return record;
}

// ============================================================================
// MACHINES SERVICE
// ============================================================================

export async function getMachines(params: PaginationQuery): Promise<PaginatedResult<any>> {
  const { page, pageSize, search } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.MachineWhereInput = search
    ? {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, rawData] = await Promise.all([
    prisma.machine.count({ where }),
    prisma.machine.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Convert Decimals to string/number for client consumption
  const data = rawData.map((m) => ({
    ...m,
    hourlyOverhead: Number(m.hourlyOverhead),
    capacityPerHour: Number(m.capacityPerHour),
  }));

  return {
    data,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize) || 1,
  };
}

export async function createMachine(input: MachineInput) {
  const user = await requireRole([Role.ADMIN]);
  const validated = machineSchema.parse(input);

  const record = await prisma.machine.create({
    data: {
      code: validated.code,
      name: validated.name,
      type: validated.type,
      status: validated.status,
      hourlyOverhead: new Prisma.Decimal(validated.hourlyOverhead),
      capacityPerHour: new Prisma.Decimal(validated.capacityPerHour),
    },
  });

  await logAction({
    userId: user.id,
    action: "CREATE_MACHINE",
    entity: "Machine",
    entityId: record.id,
    meta: { code: record.code, type: record.type },
  });

  return {
    ...record,
    hourlyOverhead: Number(record.hourlyOverhead),
    capacityPerHour: Number(record.capacityPerHour),
  };
}

export async function updateMachine(id: string, input: Partial<MachineInput>) {
  const user = await requireRole([Role.ADMIN]);
  const validated = machineSchema.partial().parse(input);

  const data: Prisma.MachineUpdateInput = {
    ...(validated.code !== undefined ? { code: validated.code } : {}),
    ...(validated.name !== undefined ? { name: validated.name } : {}),
    ...(validated.type !== undefined ? { type: validated.type } : {}),
    ...(validated.status !== undefined ? { status: validated.status } : {}),
    ...(validated.hourlyOverhead !== undefined
      ? { hourlyOverhead: new Prisma.Decimal(validated.hourlyOverhead) }
      : {}),
    ...(validated.capacityPerHour !== undefined
      ? { capacityPerHour: new Prisma.Decimal(validated.capacityPerHour) }
      : {}),
  };

  const record = await prisma.machine.update({
    where: { id },
    data,
  });

  await logAction({
    userId: user.id,
    action: "UPDATE_MACHINE",
    entity: "Machine",
    entityId: record.id,
    meta: { changes: validated },
  });

  return {
    ...record,
    hourlyOverhead: Number(record.hourlyOverhead),
    capacityPerHour: Number(record.capacityPerHour),
  };
}

// ============================================================================
// WORKERS SERVICE
// ============================================================================

export async function getWorkers(params: PaginationQuery): Promise<PaginatedResult<any>> {
  const { page, pageSize, search, includeInactive } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.WorkerWhereInput = {
    ...(includeInactive ? {} : { active: true }),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
            { role: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rawData] = await Promise.all([
    prisma.worker.count({ where }),
    prisma.worker.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const data = rawData.map((w) => ({
    ...w,
    dailyRate: Number(w.dailyRate),
    otRatePerHour: Number(w.otRatePerHour),
  }));

  return {
    data,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize) || 1,
  };
}

export async function createWorker(input: WorkerInput) {
  const user = await requireRole([Role.ADMIN]);
  const validated = workerSchema.parse(input);

  const record = await prisma.worker.create({
    data: {
      name: validated.name,
      code: validated.code,
      role: validated.role,
      phone: validated.phone,
      active: validated.active,
      dailyRate: new Prisma.Decimal(validated.dailyRate),
      otRatePerHour: new Prisma.Decimal(validated.otRatePerHour),
    },
  });

  await logAction({
    userId: user.id,
    action: "CREATE_WORKER",
    entity: "Worker",
    entityId: record.id,
    meta: { name: record.name, code: record.code },
  });

  return {
    ...record,
    dailyRate: Number(record.dailyRate),
    otRatePerHour: Number(record.otRatePerHour),
  };
}

export async function updateWorker(id: string, input: Partial<WorkerInput>) {
  const user = await requireRole([Role.ADMIN]);
  const validated = workerSchema.partial().parse(input);

  const data: Prisma.WorkerUpdateInput = {
    ...(validated.name !== undefined ? { name: validated.name } : {}),
    ...(validated.code !== undefined ? { code: validated.code } : {}),
    ...(validated.role !== undefined ? { role: validated.role } : {}),
    ...(validated.phone !== undefined ? { phone: validated.phone } : {}),
    ...(validated.active !== undefined ? { active: validated.active } : {}),
    ...(validated.dailyRate !== undefined
      ? { dailyRate: new Prisma.Decimal(validated.dailyRate) }
      : {}),
    ...(validated.otRatePerHour !== undefined
      ? { otRatePerHour: new Prisma.Decimal(validated.otRatePerHour) }
      : {}),
  };

  const record = await prisma.worker.update({
    where: { id },
    data,
  });

  await logAction({
    userId: user.id,
    action: "UPDATE_WORKER",
    entity: "Worker",
    entityId: record.id,
    meta: { changes: validated },
  });

  return {
    ...record,
    dailyRate: Number(record.dailyRate),
    otRatePerHour: Number(record.otRatePerHour),
  };
}

export async function toggleWorkerActive(id: string, active: boolean) {
  const user = await requireRole([Role.ADMIN]);
  const record = await prisma.worker.update({
    where: { id },
    data: { active },
  });

  await logAction({
    userId: user.id,
    action: active ? "ACTIVATE_WORKER" : "DEACTIVATE_WORKER",
    entity: "Worker",
    entityId: id,
  });

  return {
    ...record,
    dailyRate: Number(record.dailyRate),
    otRatePerHour: Number(record.otRatePerHour),
  };
}

// ============================================================================
// YARN TYPES SERVICE
// ============================================================================

export async function getYarnTypes(params: PaginationQuery): Promise<PaginatedResult<any>> {
  const { page, pageSize, search } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.YarnTypeWhereInput = search
    ? {
        OR: [
          { type: { contains: search, mode: "insensitive" } },
          { colour: { contains: search, mode: "insensitive" } },
          { unit: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, rawData] = await Promise.all([
    prisma.yarnType.count({ where }),
    prisma.yarnType.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        _count: {
          select: { boms: true, stockMovements: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const data = rawData.map((y) => ({
    ...y,
    reorderLevel: Number(y.reorderLevel),
    ratePerUnit: Number(y.ratePerUnit),
  }));

  return {
    data,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize) || 1,
  };
}

export async function createYarnType(input: YarnTypeInput) {
  const user = await requireRole([Role.ADMIN]);
  const validated = yarnTypeSchema.parse(input);

  const record = await prisma.yarnType.create({
    data: {
      type: validated.type,
      colour: validated.colour,
      unit: validated.unit,
      reorderLevel: new Prisma.Decimal(validated.reorderLevel),
      ratePerUnit: new Prisma.Decimal(validated.ratePerUnit),
    },
  });

  await logAction({
    userId: user.id,
    action: "CREATE_YARN_TYPE",
    entity: "YarnType",
    entityId: record.id,
    meta: { type: record.type, colour: record.colour },
  });

  return {
    ...record,
    reorderLevel: Number(record.reorderLevel),
    ratePerUnit: Number(record.ratePerUnit),
  };
}

export async function updateYarnType(id: string, input: Partial<YarnTypeInput>) {
  const user = await requireRole([Role.ADMIN]);
  const validated = yarnTypeSchema.partial().parse(input);

  const data: Prisma.YarnTypeUpdateInput = {
    ...(validated.type !== undefined ? { type: validated.type } : {}),
    ...(validated.colour !== undefined ? { colour: validated.colour } : {}),
    ...(validated.unit !== undefined ? { unit: validated.unit } : {}),
    ...(validated.reorderLevel !== undefined
      ? { reorderLevel: new Prisma.Decimal(validated.reorderLevel) }
      : {}),
    ...(validated.ratePerUnit !== undefined
      ? { ratePerUnit: new Prisma.Decimal(validated.ratePerUnit) }
      : {}),
  };

  const record = await prisma.yarnType.update({
    where: { id },
    data,
  });

  await logAction({
    userId: user.id,
    action: "UPDATE_YARN_TYPE",
    entity: "YarnType",
    entityId: record.id,
    meta: { changes: validated },
  });

  return {
    ...record,
    reorderLevel: Number(record.reorderLevel),
    ratePerUnit: Number(record.ratePerUnit),
  };
}

// ============================================================================
// BOM (BILL OF MATERIALS) SERVICE
// ============================================================================

export async function getBOMs(params: PaginationQuery & { fabricType?: string }): Promise<PaginatedResult<any>> {
  const { page, pageSize, search, fabricType } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.BOMWhereInput = {
    ...(fabricType ? { fabricType } : {}),
    ...(search
      ? {
          OR: [
            { fabricType: { contains: search, mode: "insensitive" } },
            { yarnType: { type: { contains: search, mode: "insensitive" } } },
            { yarnType: { colour: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [total, rawData] = await Promise.all([
    prisma.bOM.count({ where }),
    prisma.bOM.findMany({
      where,
      skip,
      take: pageSize,
      include: {
        yarnType: {
          select: {
            id: true,
            type: true,
            colour: true,
            unit: true,
          },
        },
      },
      orderBy: [{ fabricType: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const data = rawData.map((b) => ({
    ...b,
    yarnPerMetre: Number(b.yarnPerMetre),
  }));

  return {
    data,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize) || 1,
  };
}

export async function upsertBOM(input: BomInput) {
  const user = await requireRole([Role.ADMIN]);
  const validated = bomSchema.parse(input);

  const record = await prisma.bOM.upsert({
    where: {
      fabricType_yarnTypeId: {
        fabricType: validated.fabricType,
        yarnTypeId: validated.yarnTypeId,
      },
    },
    update: {
      yarnPerMetre: new Prisma.Decimal(validated.yarnPerMetre),
    },
    create: {
      fabricType: validated.fabricType,
      yarnTypeId: validated.yarnTypeId,
      yarnPerMetre: new Prisma.Decimal(validated.yarnPerMetre),
    },
    include: {
      yarnType: true,
    },
  });

  await logAction({
    userId: user.id,
    action: "UPSERT_BOM",
    entity: "BOM",
    entityId: record.id,
    meta: {
      fabricType: record.fabricType,
      yarnTypeId: record.yarnTypeId,
      yarnPerMetre: Number(record.yarnPerMetre),
    },
  });

  return {
    ...record,
    yarnPerMetre: Number(record.yarnPerMetre),
  };
}

export async function deleteBOM(id: string) {
  const user = await requireRole([Role.ADMIN]);
  const record = await prisma.bOM.delete({
    where: { id },
  });

  await logAction({
    userId: user.id,
    action: "DELETE_BOM",
    entity: "BOM",
    entityId: id,
    meta: { fabricType: record.fabricType, yarnTypeId: record.yarnTypeId },
  });

  return record;
}
