"use server";

import { revalidatePath } from "next/cache";
import {
  saveBulkAttendance,
  finaliseMonthWages,
} from "@/services/hr";
import { BulkAttendanceInput } from "@/services/schemas/hr";

export async function saveBulkAttendanceAction(input: BulkAttendanceInput) {
  try {
    const result = await saveBulkAttendance(input);
    revalidatePath("/hr");
    revalidatePath("/hr/wages");
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to save attendance records.",
    };
  }
}

export async function finaliseMonthWagesAction(month: string) {
  try {
    const result = await finaliseMonthWages(month);
    revalidatePath("/hr");
    revalidatePath("/hr/wages");
    revalidatePath("/finance");
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to finalise month wages.",
    };
  }
}
