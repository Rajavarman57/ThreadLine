import { z } from "zod";
import { MachineType, MachineStatus } from "@prisma/client";

// ============================================================================
// SUPPLIER SCHEMAS
// ============================================================================

export const supplierSchema = z.object({
  name: z.string().min(2, "Supplier name must be at least 2 characters"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  active: z.boolean().default(true),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

// ============================================================================
// BUYER SCHEMAS
// ============================================================================

export const buyerSchema = z.object({
  name: z.string().min(2, "Buyer name must be at least 2 characters"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  active: z.boolean().default(true),
});

export type BuyerInput = z.infer<typeof buyerSchema>;

// ============================================================================
// MACHINE SCHEMAS
// ============================================================================

export const machineSchema = z.object({
  code: z
    .string()
    .min(2, "Machine code is required (e.g. SP-01, WV-04)")
    .toUpperCase(),
  name: z.string().optional(),
  type: z.nativeEnum(MachineType),
  status: z.nativeEnum(MachineStatus).default(MachineStatus.IDLE),
  hourlyOverhead: z.coerce
    .number()
    .min(0, "Hourly overhead cannot be negative"),
  capacityPerHour: z.coerce
    .number()
    .min(0, "Capacity per hour cannot be negative"),
});

export type MachineInput = z.infer<typeof machineSchema>;

// ============================================================================
// WORKER SCHEMAS
// ============================================================================

export const workerSchema = z.object({
  name: z.string().min(2, "Worker name is required"),
  code: z.string().optional(),
  role: z.string().optional(),
  phone: z.string().optional(),
  dailyRate: z.coerce
    .number()
    .min(0, "Daily rate cannot be negative"),
  otRatePerHour: z.coerce
    .number()
    .min(0, "Overtime rate cannot be negative"),
  active: z.boolean().default(true),
});

export type WorkerInput = z.infer<typeof workerSchema>;

// ============================================================================
// YARN TYPE SCHEMAS
// ============================================================================

export const yarnTypeSchema = z.object({
  type: z.string().min(1, "Yarn type / composition is required"),
  colour: z.string().min(1, "Colour is required"),
  unit: z.string().default("KG"),
  reorderLevel: z.coerce
    .number()
    .min(0, "Reorder level cannot be negative"),
  ratePerUnit: z.coerce
    .number()
    .min(0, "Rate per unit cannot be negative"),
});

export type YarnTypeInput = z.infer<typeof yarnTypeSchema>;

// ============================================================================
// BOM (BILL OF MATERIALS) SCHEMAS
// ============================================================================

export const bomSchema = z.object({
  fabricType: z.string().min(2, "Fabric type is required"),
  yarnTypeId: z.string().min(1, "Please select a yarn type"),
  yarnPerMetre: z.coerce
    .number()
    .positive("Yarn consumption per metre must be greater than 0"),
});

export type BomInput = z.infer<typeof bomSchema>;

// ============================================================================
// PAGINATION & QUERY SCHEMAS
// ============================================================================

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional().default(""),
  includeInactive: z.coerce.boolean().optional().default(false),
});

export type PaginationQuery = {
  page: number;
  pageSize: number;
  search?: string;
  includeInactive?: boolean;
};
