import { z } from "zod";
import { Shift } from "@prisma/client";
import { dateNotFuture } from "@/lib/validation";

export const ShiftEnum = z.nativeEnum(Shift);

export const attendanceRecordInputSchema = z.object({
  workerId: z.string().min(1, "Worker ID is required"),
  present: z.boolean(),
  hours: z.coerce
    .number()
    .min(0, "Hours cannot be negative")
    .max(12, "Hours cannot exceed 12")
    .default(8),
  overtimeHours: z.coerce
    .number()
    .min(0, "Overtime cannot be negative")
    .max(6, "Overtime cannot exceed 6")
    .default(0),
});

export const bulkAttendanceInputSchema = z.object({
  date: dateNotFuture,
  shift: ShiftEnum,
  records: z.array(attendanceRecordInputSchema).min(1, "At least one record is required"),
});

export type AttendanceRecordInput = z.infer<typeof attendanceRecordInputSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceInputSchema>;

export const monthSelectorSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM"),
});

export type MonthSelectorInput = z.infer<typeof monthSelectorSchema>;
