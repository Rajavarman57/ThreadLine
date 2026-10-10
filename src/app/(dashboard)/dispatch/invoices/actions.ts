"use server";

import { revalidatePath } from "next/cache";
import { recordPayment } from "@/services/payments";
import { PaymentMethod } from "@/services/schemas/payments";

export async function recordPaymentAction(
  invoiceId: string,
  amount: number,
  method: PaymentMethod,
  paidAt?: string
) {
  try {
    const result = await recordPayment({
      invoiceId,
      amount,
      method,
      paidAt: paidAt ?? new Date().toISOString(),
    });
    revalidatePath("/dispatch/invoices");
    revalidatePath(`/dispatch/invoices/${invoiceId}`);
    revalidatePath("/finance");
    return { success: true, data: result };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to record payment.",
    };
  }
}
