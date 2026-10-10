import { z } from "zod";
import { InvoiceStatus } from "@prisma/client";

export const PaymentMethodEnum = z.enum(["CASH", "BANK", "UPI", "CHEQUE"]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  method: PaymentMethodEnum,
  paidAt: z.string().optional().default(() => new Date().toISOString()),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

export const invoiceListFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  status: z.nativeEnum(InvoiceStatus).optional(),
  buyerId: z.string().optional(),
  search: z.string().optional(),
});

export type InvoiceListFilterInput = z.infer<typeof invoiceListFilterSchema>;
