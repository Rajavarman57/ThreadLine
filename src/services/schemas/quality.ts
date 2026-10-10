import { z } from "zod";
import { QCStatus } from "@prisma/client";

export const defectItemSchema = z.object({
  type: z.enum(["hole", "colour_mismatch", "uneven_weaving", "stain", "other"]),
  severity: z.enum(["minor", "major", "critical"]),
  description: z.string().optional(),
});

export type DefectItem = z.infer<typeof defectItemSchema>;

export const inspectRollSchema = z
  .object({
    rollNo: z.string().min(1, "Roll number is required"),
    result: z.enum(["PASS", "REWORK", "REJECT"]),
    defects: z.array(defectItemSchema).default([]),
    severity: z.enum(["minor", "major", "critical"]).optional(),
    notes: z.string().max(500, "Notes too long").optional(),
  })
  .refine(
    (data) => {
      if ((data.result === "REWORK" || data.result === "REJECT") && data.defects.length === 0) {
        return false;
      }
      return true;
    },
    {
      message: "At least one defect must be selected for REWORK or REJECT outcomes",
      path: ["defects"],
    }
  );

export type InspectRollInput = z.infer<typeof inspectRollSchema>;

export const reworkDoneSchema = z.object({
  rollNo: z.string().min(1, "Roll number is required"),
  notes: z.string().optional(),
});

export type ReworkDoneInput = z.infer<typeof reworkDoneSchema>;

export const qcQueueFilterSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(15),
  orderId: z.string().optional(),
  machineId: z.string().optional(),
  search: z.string().optional(),
});

export type QCQueueFilterInput = z.infer<typeof qcQueueFilterSchema>;

export const rollsRegisterFilterSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(15),
  orderId: z.string().optional(),
  machineId: z.string().optional(),
  qcStatus: z.nativeEnum(QCStatus).optional(),
  search: z.string().optional(),
});

export type RollsRegisterFilterInput = z.infer<typeof rollsRegisterFilterSchema>;
