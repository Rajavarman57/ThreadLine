import { z } from "zod";

export const ExpenseCategoryEnum = z.enum([
  "ELECTRICITY",
  "MAINTENANCE",
  "TRANSPORT",
  "RENT",
  "OTHER",
]);

export type ExpenseCategory = z.infer<typeof ExpenseCategoryEnum>;

export const createExpenseSchema = z.object({
  category: ExpenseCategoryEnum,
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  date: z.string().min(1, "Date is required"),
  orderId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const expenseListFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  category: ExpenseCategoryEnum.optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM").optional(),
});

export type ExpenseListFilterInput = z.infer<typeof expenseListFilterSchema>;
