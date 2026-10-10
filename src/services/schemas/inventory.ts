import { z } from "zod";
import { StockMovementReason } from "@prisma/client";

// ============================================================================
// GOODS RECEIPT SCHEMA
// ============================================================================

export const goodsReceiptSchema = z.object({
  yarnTypeId: z.string().min(1, "Yarn type selection is required"),
  qty: z.coerce
    .number()
    .positive("Receipt quantity must be greater than 0"),
  vehicleNo: z.string().optional().nullable().transform((v) => v || null),
  supplierId: z.string().optional().nullable().transform((v) => v || null),
  poLineId: z.string().optional().nullable().transform((v) => v || null),
  orderId: z.string().optional().nullable().transform((v) => v || null),
});

export type GoodsReceiptInput = z.infer<typeof goodsReceiptSchema>;

// ============================================================================
// STOCK ADJUSTMENT SCHEMA
// ============================================================================

export const stockAdjustmentSchema = z.object({
  yarnTypeId: z.string().min(1, "Yarn type selection is required"),
  qtyDelta: z.coerce
    .number()
    .refine((v) => v !== 0, "Adjustment quantity delta cannot be zero"),
  note: z.string().min(3, "Reason / note for adjustment is required (at least 3 characters)"),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

// ============================================================================
// STOCK LEDGER FILTER SCHEMA
// ============================================================================

export const stockLedgerFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(15),
  yarnTypeId: z.string().optional(),
  reason: z.nativeEnum(StockMovementReason).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type StockLedgerFilter = z.infer<typeof stockLedgerFilterSchema>;

// ============================================================================
// ISSUE TO WORK ORDER SCHEMA
// ============================================================================

export const issueToWorkOrderSchema = z.object({
  workOrderId: z.string().min(1, "Work order ID is required"),
  yarnTypeId: z.string().min(1, "Yarn type is required"),
  qty: z.coerce.number().positive("Issue quantity must be greater than 0"),
});

export type IssueToWorkOrderInput = z.infer<typeof issueToWorkOrderSchema>;
