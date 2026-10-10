"use server";

import { revalidatePath } from "next/cache";
import {
  createGoodsReceipt,
  adjustStock,
  triggerLowStockNotifications,
} from "@/services/inventory";
import {
  GoodsReceiptInput,
  StockAdjustmentInput,
} from "@/services/schemas/inventory";

export type ActionResponse<T = any> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createGoodsReceiptAction(
  input: GoodsReceiptInput
): Promise<ActionResponse> {
  try {
    const data = await createGoodsReceipt(input);
    await triggerLowStockNotifications();
    revalidatePath("/inventory");
    revalidatePath("/inventory/receipts");
    revalidatePath("/inventory/movements");
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to record goods receipt",
    };
  }
}

export async function adjustStockAction(
  input: StockAdjustmentInput
): Promise<ActionResponse> {
  try {
    const data = await adjustStock(input);
    await triggerLowStockNotifications();
    revalidatePath("/inventory");
    revalidatePath("/inventory/movements");
    return { success: true, data };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to record stock adjustment",
    };
  }
}
