"use server";

import { revalidatePath } from "next/cache";
import { createDispatch } from "@/services/dispatch";

export async function createDispatchAction(
  orderId: string,
  rollIds: string[],
  vehicleNo: string,
  driver: string
) {
  try {
    const result = await createDispatch(orderId, rollIds, vehicleNo, driver);
    revalidatePath("/dispatch");
    revalidatePath("/dispatch/history");
    revalidatePath(`/dispatch/${result.dispatchId}`);
    revalidatePath("/quality/rolls");
    revalidatePath("/orders");
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to create dispatch manifest.",
    };
  }
}
