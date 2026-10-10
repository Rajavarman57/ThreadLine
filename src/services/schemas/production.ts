import { z } from "zod";
import { ProductionStage, WorkOrderStatus, Shift, MachineStatus } from "@prisma/client";

export const planProductionSchema = z.object({
  orderId: z.string().min(1, "Order selection is required"),
  spinningMachineId: z.string().min(1, "Spinning machine selection is required"),
  weavingMachineId: z.string().min(1, "Weaving machine selection is required"),
  dyeingMachineId: z.string().min(1, "Dyeing machine selection is required"),
});

export type PlanProductionInput = z.infer<typeof planProductionSchema>;

export const startWorkOrderSchema = z.object({
  workOrderId: z.string().min(1, "Work order ID is required"),
});

export type StartWorkOrderInput = z.infer<typeof startWorkOrderSchema>;

export const machineActionSchema = z.object({
  machineId: z.string().min(1, "Machine ID is required"),
  action: z.enum(["BREAKDOWN", "MAINTENANCE", "RESUME", "IDLE"]),
  reason: z.string().max(255).optional(),
});

export type MachineActionInput = z.infer<typeof machineActionSchema>;

export const logOutputSchema = z.object({
  workOrderId: z.string().min(1, "Work order ID is required"),
  metres: z
    .number()
    .positive("Output metres must be greater than zero")
    .max(100000, "Quantity is unrealistically high"),
  hours: z
    .number()
    .positive("Production hours must be greater than zero")
    .max(24, "Shift hours cannot exceed 24"),
  shift: z.nativeEnum(Shift),
});

export type LogOutputInput = z.infer<typeof logOutputSchema>;

export const workOrdersFilterSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(15),
  stage: z.nativeEnum(ProductionStage).optional(),
  status: z.nativeEnum(WorkOrderStatus).optional(),
  orderId: z.string().optional(),
  machineId: z.string().optional(),
});

export type WorkOrdersFilterInput = z.infer<typeof workOrdersFilterSchema>;
