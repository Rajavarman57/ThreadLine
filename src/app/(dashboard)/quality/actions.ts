"use server";

import { revalidatePath } from "next/cache";
import {
  inspectRoll,
  markReworkDone,
} from "@/services/quality";
import {
  InspectRollInput,
  ReworkDoneInput,
} from "@/services/schemas/quality";

export async function inspectRollAction(input: InspectRollInput) {
  try {
    const res = await inspectRoll(input);
    revalidatePath("/quality");
    revalidatePath("/quality/rolls");
    revalidatePath(`/quality/rolls/${input.rollNo}`);
    revalidatePath("/orders");
    return { success: true, data: res };
  } catch (err: any) {
    console.error("inspectRollAction error:", err);
    return { success: false, error: err.message || "Failed to inspect roll" };
  }
}

export async function markReworkDoneAction(input: ReworkDoneInput) {
  try {
    const res = await markReworkDone(input);
    revalidatePath("/quality");
    revalidatePath("/quality/rolls");
    revalidatePath(`/quality/rolls/${input.rollNo}`);
    return { success: true, data: res };
  } catch (err: any) {
    console.error("markReworkDoneAction error:", err);
    return { success: false, error: err.message || "Failed to mark rework done" };
  }
}
