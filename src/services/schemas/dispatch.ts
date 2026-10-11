import { z } from "zod";
import { vehicleNo, personName } from "@/lib/validation";

export const DEFAULT_TAX_PCT = 5;

export const createDispatchSchema = z.object({
  orderId: z.string().min(1, "Order is required"),
  vehicleNo: vehicleNo,
  driver: personName,
  rollIds: z
    .array(z.string().min(1))
    .min(1, "At least one roll must be selected for dispatch"),
});

export type CreateDispatchInput = z.infer<typeof createDispatchSchema>;

export const dispatchFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  orderId: z.string().optional(),
  search: z.string().optional(),
});

export type DispatchFilterInput = z.infer<typeof dispatchFilterSchema>;
