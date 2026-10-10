"use server";

import { revalidatePath } from "next/cache";
import {
  createSupplier,
  updateSupplier,
  toggleSupplierActive,
  createBuyer,
  updateBuyer,
  toggleBuyerActive,
  createMachine,
  updateMachine,
  createWorker,
  updateWorker,
  toggleWorkerActive,
  createYarnType,
  updateYarnType,
  upsertBOM,
  deleteBOM,
} from "@/services/master";
import {
  SupplierInput,
  BuyerInput,
  MachineInput,
  WorkerInput,
  YarnTypeInput,
  BomInput,
} from "@/services/schemas/master";

export type ActionResponse<T = any> =
  | { success: true; data: T }
  | { success: false; error: string };

// ----------------------------------------------------------------------------
// SUPPLIER ACTIONS
// ----------------------------------------------------------------------------

export async function createSupplierAction(
  input: SupplierInput
): Promise<ActionResponse> {
  try {
    const data = await createSupplier(input);
    revalidatePath("/master/suppliers");
    revalidatePath("/master");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create supplier" };
  }
}

export async function updateSupplierAction(
  id: string,
  input: Partial<SupplierInput>
): Promise<ActionResponse> {
  try {
    const data = await updateSupplier(id, input);
    revalidatePath("/master/suppliers");
    revalidatePath("/master");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update supplier" };
  }
}

export async function toggleSupplierActiveAction(
  id: string,
  active: boolean
): Promise<ActionResponse> {
  try {
    const data = await toggleSupplierActive(id, active);
    revalidatePath("/master/suppliers");
    revalidatePath("/master");
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to toggle supplier status",
    };
  }
}

// ----------------------------------------------------------------------------
// BUYER ACTIONS
// ----------------------------------------------------------------------------

export async function createBuyerAction(
  input: BuyerInput
): Promise<ActionResponse> {
  try {
    const data = await createBuyer(input);
    revalidatePath("/master/buyers");
    revalidatePath("/master");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create buyer" };
  }
}

export async function updateBuyerAction(
  id: string,
  input: Partial<BuyerInput>
): Promise<ActionResponse> {
  try {
    const data = await updateBuyer(id, input);
    revalidatePath("/master/buyers");
    revalidatePath("/master");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update buyer" };
  }
}

export async function toggleBuyerActiveAction(
  id: string,
  active: boolean
): Promise<ActionResponse> {
  try {
    const data = await toggleBuyerActive(id, active);
    revalidatePath("/master/buyers");
    revalidatePath("/master");
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to toggle buyer status",
    };
  }
}

// ----------------------------------------------------------------------------
// MACHINE ACTIONS
// ----------------------------------------------------------------------------

export async function createMachineAction(
  input: MachineInput
): Promise<ActionResponse> {
  try {
    const data = await createMachine(input);
    revalidatePath("/master/machines");
    revalidatePath("/master");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create machine" };
  }
}

export async function updateMachineAction(
  id: string,
  input: Partial<MachineInput>
): Promise<ActionResponse> {
  try {
    const data = await updateMachine(id, input);
    revalidatePath("/master/machines");
    revalidatePath("/master");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update machine" };
  }
}

// ----------------------------------------------------------------------------
// WORKER ACTIONS
// ----------------------------------------------------------------------------

export async function createWorkerAction(
  input: WorkerInput
): Promise<ActionResponse> {
  try {
    const data = await createWorker(input);
    revalidatePath("/master/workers");
    revalidatePath("/master");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create worker" };
  }
}

export async function updateWorkerAction(
  id: string,
  input: Partial<WorkerInput>
): Promise<ActionResponse> {
  try {
    const data = await updateWorker(id, input);
    revalidatePath("/master/workers");
    revalidatePath("/master");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update worker" };
  }
}

export async function toggleWorkerActiveAction(
  id: string,
  active: boolean
): Promise<ActionResponse> {
  try {
    const data = await toggleWorkerActive(id, active);
    revalidatePath("/master/workers");
    revalidatePath("/master");
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to toggle worker status",
    };
  }
}

// ----------------------------------------------------------------------------
// YARN TYPE ACTIONS
// ----------------------------------------------------------------------------

export async function createYarnTypeAction(
  input: YarnTypeInput
): Promise<ActionResponse> {
  try {
    const data = await createYarnType(input);
    revalidatePath("/master/yarn-types");
    revalidatePath("/master");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create yarn type" };
  }
}

export async function updateYarnTypeAction(
  id: string,
  input: Partial<YarnTypeInput>
): Promise<ActionResponse> {
  try {
    const data = await updateYarnType(id, input);
    revalidatePath("/master/yarn-types");
    revalidatePath("/master");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update yarn type" };
  }
}

// ----------------------------------------------------------------------------
// BOM ACTIONS
// ----------------------------------------------------------------------------

export async function upsertBOMAction(
  input: BomInput
): Promise<ActionResponse> {
  try {
    const data = await upsertBOM(input);
    revalidatePath("/master/yarn-types");
    revalidatePath("/master");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save BOM ratio" };
  }
}

export async function deleteBOMAction(id: string): Promise<ActionResponse> {
  try {
    const data = await deleteBOM(id);
    revalidatePath("/master/yarn-types");
    revalidatePath("/master");
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to remove BOM item" };
  }
}

// ----------------------------------------------------------------------------
// ADMIN RESET SAMPLE DATA ACTION
// ----------------------------------------------------------------------------

export async function resetSampleDataAction(): Promise<ActionResponse> {
  try {
    const { requireRole } = await import("@/lib/auth/session");
    const { Role } = await import("@prisma/client");
    const { prisma } = await import("@/lib/db");
    const { logAction } = await import("@/lib/audit");

    const user = await requireRole([Role.ADMIN]);

    // Transactionally wipe operational and transactional data, keeping master catalog
    await prisma.$transaction([
      prisma.payment.deleteMany({}),
      prisma.invoice.deleteMany({}),
      prisma.dispatchLine.deleteMany({}),
      prisma.dispatch.deleteMany({}),
      prisma.qCInspection.deleteMany({}),
      prisma.roll.deleteMany({}),
      prisma.productionLog.deleteMany({}),
      prisma.workOrder.deleteMany({}),
      prisma.goodsReceipt.deleteMany({}),
      prisma.purchaseLine.deleteMany({}),
      prisma.purchaseOrder.deleteMany({}),
      prisma.order.deleteMany({}),
      prisma.stockMovement.deleteMany({}),
      prisma.attendance.deleteMany({}),
      prisma.expense.deleteMany({}),
    ]);

    await logAction({
      userId: user.id,
      action: "RESET_TRANSACTIONAL_DATA",
      entity: "System",
      meta: { message: "Transactional factory data wiped and reset." },
    });

    revalidatePath("/orders");
    revalidatePath("/inventory");
    revalidatePath("/production");
    revalidatePath("/quality");
    revalidatePath("/dispatch");
    revalidatePath("/finance");
    revalidatePath("/hr");
    revalidatePath("/master");

    return {
      success: true,
      data: { message: "Transactional data has been successfully reset." },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to reset sample data",
    };
  }
}

