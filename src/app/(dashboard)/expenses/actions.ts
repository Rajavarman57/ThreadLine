"use server";

import { revalidatePath } from "next/cache";
import { createExpense } from "@/services/expenses";
import { CreateExpenseInput } from "@/services/schemas/expenses";

export async function createExpenseAction(input: CreateExpenseInput) {
  try {
    const result = await createExpense(input);
    revalidatePath("/expenses");
    revalidatePath("/finance");
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to create expense.",
    };
  }
}
