"use server";

import { revalidatePath } from "next/cache";
import { createOrder, cancelOrder } from "@/services/orders";
import { reserveYarnForOrder } from "@/services/inventory";
import { checkFeasibility } from "@/services/feasibility";
import {
  createPurchaseOrder,
  createPOForShortfall,
  updatePOStatus,
} from "@/services/procurement";
import {
  CreateOrderInput,
  CreatePurchaseOrderInput,
  CheckFeasibilityInput,
} from "@/services/schemas/orders";
import { POStatus } from "@prisma/client";

export type ActionResponse<T = any> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createOrderAction(
  input: CreateOrderInput
): Promise<ActionResponse> {
  try {
    const data = await createOrder(input);
    revalidatePath("/orders");
    revalidatePath("/inventory");
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create customer order",
    };
  }
}

export async function checkFeasibilityAction(
  input: CheckFeasibilityInput
): Promise<ActionResponse> {
  try {
    const data = await checkFeasibility(input);
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Feasibility check failed",
    };
  }
}

export async function reserveOrderMaterialAction(
  orderId: string
): Promise<ActionResponse> {
  try {
    const data = await reserveYarnForOrder(orderId);
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
    revalidatePath("/inventory");
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Material reservation failed",
    };
  }
}

export async function cancelOrderAction(
  orderId: string
): Promise<ActionResponse> {
  try {
    const data = await cancelOrder(orderId);
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
    revalidatePath("/inventory");
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to cancel order",
    };
  }
}

export async function createPurchaseOrderAction(
  input: CreatePurchaseOrderInput
): Promise<ActionResponse> {
  try {
    const data = await createPurchaseOrder(input);
    revalidatePath("/inventory/purchase-orders");
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to create purchase order",
    };
  }
}

export async function createPOForShortfallAction(
  supplierId: string,
  lines: Array<{ yarnTypeId: string; qty: number; rate?: number }>
): Promise<ActionResponse> {
  try {
    const data = await createPOForShortfall(supplierId, lines);
    revalidatePath("/inventory/purchase-orders");
    revalidatePath("/orders");
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to raise purchase order for shortfall",
    };
  }
}

export async function updatePOStatusAction(
  poId: string,
  status: POStatus
): Promise<ActionResponse> {
  try {
    const data = await updatePOStatus(poId, status);
    revalidatePath("/inventory/purchase-orders");
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update purchase order status",
    };
  }
}
