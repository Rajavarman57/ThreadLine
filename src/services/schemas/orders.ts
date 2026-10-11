import { z } from "zod";
import { quantity, money, dateNotPast } from "@/lib/validation";

// ============================================================================
// ORDER CREATION SCHEMA
// ============================================================================

export const createOrderSchema = z.object({
  buyerId: z.string().min(1, "Buyer selection is required"),
  fabricType: z.string().min(1, "Fabric type selection is required"),
  colour: z.string().min(1, "Colour / shade is required"),
  qtyMetres: quantity(1_000_000),
  ratePerMetre: money(100_000),
  deadline: dateNotPast,
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ============================================================================
// PURCHASE ORDER SCHEMAS
// ============================================================================

export const purchaseLineInputSchema = z.object({
  yarnTypeId: z.string().min(1, "Yarn type is required"),
  qty: z.coerce.number().positive("Quantity must be greater than 0"),
  rate: z.coerce.number().positive("Rate per unit must be greater than 0"),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier is required"),
  lines: z
    .array(purchaseLineInputSchema)
    .min(1, "At least one purchase order line item is required"),
});

export type PurchaseLineInput = z.infer<typeof purchaseLineInputSchema>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;

// ============================================================================
// FEASIBILITY CHECK SCHEMA
// ============================================================================

export const checkFeasibilitySchema = z.object({
  fabricType: z.string().min(1, "Fabric type is required"),
  qtyMetres: z.coerce.number().positive("Quantity in metres must be positive"),
});

export type CheckFeasibilityInput = z.infer<typeof checkFeasibilitySchema>;
