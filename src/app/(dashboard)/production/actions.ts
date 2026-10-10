"use server";

import { revalidatePath } from "next/cache";
import {
  planProduction,
  startWorkOrder,
  recordMachineBreakdown,
  setMachineMaintenance,
  resumeMachine,
  markMachineIdle,
  logProductionOutput,
} from "@/services/production";
import {
  PlanProductionInput,
  LogOutputInput,
} from "@/services/schemas/production";

export async function planProductionAction(input: PlanProductionInput) {
  try {
    const res = await planProduction(input);
    revalidatePath("/production");
    revalidatePath("/production/plan");
    revalidatePath("/production/work-orders");
    revalidatePath("/orders");
    return { success: true, data: res };
  } catch (err: any) {
    console.error("planProductionAction error:", err);
    return { success: false, error: err.message || "Failed to plan production" };
  }
}

export async function startWorkOrderAction(workOrderId: string) {
  try {
    const res = await startWorkOrder(workOrderId);
    revalidatePath("/production");
    revalidatePath("/production/work-orders");
    return { success: true, data: res };
  } catch (err: any) {
    console.error("startWorkOrderAction error:", err);
    return { success: false, error: err.message || "Failed to start work order" };
  }
}

export async function machineBreakdownAction(machineId: string, reason?: string) {
  try {
    const res = await recordMachineBreakdown(machineId, reason);
    revalidatePath("/production");
    revalidatePath("/production/work-orders");
    return { success: true, data: res };
  } catch (err: any) {
    console.error("machineBreakdownAction error:", err);
    return { success: false, error: err.message || "Failed to report breakdown" };
  }
}

export async function machineMaintenanceAction(machineId: string, reason?: string) {
  try {
    const res = await setMachineMaintenance(machineId, reason);
    revalidatePath("/production");
    return { success: true, data: res };
  } catch (err: any) {
    console.error("machineMaintenanceAction error:", err);
    return { success: false, error: err.message || "Failed to set maintenance" };
  }
}

export async function resumeMachineAction(machineId: string) {
  try {
    const res = await resumeMachine(machineId);
    revalidatePath("/production");
    revalidatePath("/production/work-orders");
    return { success: true, data: res };
  } catch (err: any) {
    console.error("resumeMachineAction error:", err);
    return { success: false, error: err.message || "Failed to resume machine" };
  }
}

export async function markMachineIdleAction(machineId: string) {
  try {
    const res = await markMachineIdle(machineId);
    revalidatePath("/production");
    return { success: true, data: res };
  } catch (err: any) {
    console.error("markMachineIdleAction error:", err);
    return { success: false, error: err.message || "Failed to mark machine idle" };
  }
}

export async function logProductionOutputAction(input: LogOutputInput) {
  try {
    const res = await logProductionOutput(input);
    revalidatePath("/production");
    revalidatePath("/production/work-orders");
    revalidatePath("/inventory");
    return { success: true, data: res };
  } catch (err: any) {
    console.error("logProductionOutputAction error:", err);
    return { success: false, error: err.message || "Failed to log production output" };
  }
}
