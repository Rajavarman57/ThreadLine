import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SystemStatus =
  // Order Statuses
  | "CONFIRMED"
  | "IN_PRODUCTION"
  | "QC"
  | "READY"
  | "DISPATCHED"
  | "CANCELLED"
  // QC Statuses
  | "PENDING"
  | "PASSED"
  | "REWORK"
  | "REJECTED"
  // Work Order Statuses
  | "PLANNED"
  | "RUNNING"
  | "DONE"
  | "BLOCKED"
  // Machine Statuses
  | "IDLE"
  | "BREAKDOWN"
  | "MAINTENANCE"
  // Invoice Statuses
  | "UNPAID"
  | "PARTIAL"
  | "PAID"
  // PO Statuses
  | "DRAFT"
  | "SENT"
  | "RECEIVED"
  // General
  | "ACTIVE"
  | "INACTIVE"
  | string;

interface StatusBadgeProps {
  status: SystemStatus;
  className?: string;
  showDot?: boolean;
}

const statusColorMap: Record<
  string,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  // Green / Success
  PASSED: { label: "Passed", bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500", border: "border-emerald-500/20" },
  DONE: { label: "Completed", bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500", border: "border-emerald-500/20" },
  PAID: { label: "Paid", bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500", border: "border-emerald-500/20" },
  READY: { label: "Ready", bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500", border: "border-emerald-500/20" },
  ACTIVE: { label: "Active", bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500", border: "border-emerald-500/20" },

  // Blue / In Progress
  RUNNING: { label: "Running", bg: "bg-sky-500/10", text: "text-sky-500", dot: "bg-sky-500", border: "border-sky-500/20" },
  IN_PRODUCTION: { label: "In Production", bg: "bg-indigo-500/10", text: "text-indigo-400", dot: "bg-indigo-500", border: "border-indigo-500/20" },
  DISPATCHED: { label: "Dispatched", bg: "bg-blue-500/10", text: "text-blue-500", dot: "bg-blue-500", border: "border-blue-500/20" },
  SENT: { label: "Sent", bg: "bg-blue-500/10", text: "text-blue-500", dot: "bg-blue-500", border: "border-blue-500/20" },

  // Amber / Pending / Warning
  PENDING: { label: "Pending", bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500", border: "border-amber-500/20" },
  CONFIRMED: { label: "Confirmed", bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500", border: "border-amber-500/20" },
  QC: { label: "In QC", bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500", border: "border-amber-500/20" },
  PLANNED: { label: "Planned", bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500", border: "border-amber-500/20" },
  REWORK: { label: "Rework Needed", bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500", border: "border-amber-500/20" },
  PARTIAL: { label: "Partial", bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500", border: "border-amber-500/20" },
  IDLE: { label: "Idle", bg: "bg-slate-500/10", text: "text-slate-400", dot: "bg-slate-400", border: "border-slate-500/20" },
  MAINTENANCE: { label: "Maintenance", bg: "bg-purple-500/10", text: "text-purple-400", dot: "bg-purple-500", border: "border-purple-500/20" },
  DRAFT: { label: "Draft", bg: "bg-slate-500/10", text: "text-slate-400", dot: "bg-slate-400", border: "border-slate-500/20" },

  // Red / Destructive
  REJECTED: { label: "Rejected", bg: "bg-rose-500/10", text: "text-rose-500", dot: "bg-rose-500", border: "border-rose-500/20" },
  CANCELLED: { label: "Cancelled", bg: "bg-rose-500/10", text: "text-rose-500", dot: "bg-rose-500", border: "border-rose-500/20" },
  BLOCKED: { label: "Blocked", bg: "bg-rose-500/10", text: "text-rose-500", dot: "bg-rose-500", border: "border-rose-500/20" },
  BREAKDOWN: { label: "Breakdown", bg: "bg-rose-500/10", text: "text-rose-500", dot: "bg-rose-500", border: "border-rose-500/20" },
  UNPAID: { label: "Unpaid", bg: "bg-rose-500/10", text: "text-rose-500", dot: "bg-rose-500", border: "border-rose-500/20" },
  INACTIVE: { label: "Inactive", bg: "bg-rose-500/10", text: "text-rose-500", dot: "bg-rose-500", border: "border-rose-500/20" },
};

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const normalized = String(status).toUpperCase();
  const config = statusColorMap[normalized] || {
    label: status,
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
    border: "border-border",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border transition-colors",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {showDot && (
        <span
          className={cn("size-1.5 rounded-full shrink-0", config.dot)}
          aria-hidden="true"
        />
      )}
      <span>{config.label}</span>
    </Badge>
  );
}
