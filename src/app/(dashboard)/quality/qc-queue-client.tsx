"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { QCStatus, Role } from "@prisma/client";
import { QCKpiSummary } from "@/services/quality";
import {
  inspectRollSchema,
  InspectRollInput,
  DefectItem,
} from "@/services/schemas/quality";
import { inspectRollAction } from "./actions";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import {
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  XCircle,
  Eye,
  Plus,
  Trash2,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface QCQueueRow {
  id: string;
  rollNo: string;
  lengthM: number;
  qcStatus: QCStatus;
  createdAt: string;
  order: {
    id: string;
    orderNo: string;
    fabricType: string;
    colour: string;
    buyerName: string;
  };
  machine: {
    id: string;
    code: string;
    name: string | null;
    type: string;
  } | null;
  workOrder: {
    id: string;
    stage: string;
  } | null;
}

interface QCQueueClientProps {
  initialData: QCQueueRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  kpis: QCKpiSummary;
  userRole: Role;
  search?: string;
}

export function QCQueueClient({
  initialData,
  totalCount,
  currentPage,
  pageSize,
  kpis,
  userRole,
  search,
}: QCQueueClientProps) {
  const router = useRouter();
  const canInspect = userRole === Role.ADMIN || userRole === Role.QC;

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: currentPage - 1,
    pageSize,
  });

  // Inspection Modal State
  const [inspectModalRoll, setInspectModalRoll] = useState<QCQueueRow | null>(
    null
  );
  const [selectedResult, setSelectedResult] = useState<
    "PASS" | "REWORK" | "REJECT"
  >("PASS");
  const [defectsList, setDefectsList] = useState<DefectItem[]>([]);
  const [newDefectType, setNewDefectType] = useState<
    "hole" | "colour_mismatch" | "uneven_weaving" | "stain" | "other"
  >("hole");
  const [newDefectSeverity, setNewDefectSeverity] = useState<
    "minor" | "major" | "critical"
  >("minor");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onPaginationChange = (updaterOrValue: any) => {
    const nextPagination =
      typeof updaterOrValue === "function"
        ? updaterOrValue(pagination)
        : updaterOrValue;
    setPagination(nextPagination);

    const params = new URLSearchParams(window.location.search);
    params.set("page", String(nextPagination.pageIndex + 1));
    params.set("pageSize", String(nextPagination.pageSize));
    router.push(`/quality?${params.toString()}`);
  };

  const openInspectDialog = (roll: QCQueueRow) => {
    setInspectModalRoll(roll);
    setSelectedResult("PASS");
    setDefectsList([]);
    setNotes("");
  };

  const addDefect = () => {
    setDefectsList((prev) => [
      ...prev,
      {
        type: newDefectType,
        severity: newDefectSeverity,
      },
    ]);
  };

  const removeDefect = (index: number) => {
    setDefectsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInspectSubmit = async () => {
    if (!inspectModalRoll) return;

    if (
      (selectedResult === "REWORK" || selectedResult === "REJECT") &&
      defectsList.length === 0
    ) {
      toast.error("Please add at least one defect before submitting a REWORK or REJECT decision.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await inspectRollAction({
        rollNo: inspectModalRoll.rollNo,
        result: selectedResult,
        defects: defectsList,
        severity: defectsList[0]?.severity,
        notes: notes || undefined,
      });

      if (!res.success) throw new Error(res.error);

      if (selectedResult === "PASS") {
        toast.success(`Roll #${inspectModalRoll.rollNo} passed QC inspection!`);
      } else if (selectedResult === "REWORK") {
        toast.warning(
          `Roll #${inspectModalRoll.rollNo} marked for rework. Supervisor notified.`
        );
      } else {
        toast.error(`Roll #${inspectModalRoll.rollNo} rejected.`);
      }

      if (res.data?.orderEvaluation?.orderUpdatedToReady) {
        toast.success(
          `🎉 All rolls passed for Order #${inspectModalRoll.order.orderNo}! Order transitioned to READY.`
        );
      }

      setInspectModalRoll(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit inspection");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<QCQueueRow>[] = [
    {
      accessorKey: "rollNo",
      header: "Roll Barcode",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-foreground">
            {row.original.rollNo}
          </span>
          <Link
            href={`/quality/rolls/${row.original.rollNo}`}
            className="text-muted-foreground hover:text-primary transition-colors"
            title="Inspect full traceability"
          >
            <Eye className="size-3.5" />
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "order",
      header: "Order & Fabric",
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-semibold text-foreground">
            PO #{row.original.order.orderNo}
          </span>
          <div className="text-xs text-muted-foreground truncate">
            {row.original.order.fabricType} ({row.original.order.colour})
          </div>
        </div>
      ),
    },
    {
      accessorKey: "lengthM",
      header: "Roll Length",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold text-foreground">
          {row.original.lengthM.toLocaleString()} m
        </span>
      ),
    },
    {
      accessorKey: "machine",
      header: "Producing Machine",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.machine ? row.original.machine.code : "—"}
        </span>
      ),
    },
    {
      accessorKey: "qcStatus",
      header: "QC Status",
      cell: ({ row }) => <StatusBadge status={row.original.qcStatus} />,
    },
    {
      accessorKey: "createdAt",
      header: "Generated Date",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
      ),
    },
    ...(canInspect
      ? [
          {
            id: "actions",
            header: () => <span className="text-right block">Actions</span>,
            cell: ({ row }: { row: { original: QCQueueRow } }) => (
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => openInspectDialog(row.original)}
                  className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 text-xs"
                >
                  <Sparkles className="size-3 mr-1" />
                  Inspect
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
            <span>Awaiting Inspection</span>
            <AlertTriangle className="size-4" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 font-mono">
            {kpis.waitingCount}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <span>Passed Today</span>
            <CheckCircle2 className="size-4" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
            {kpis.passedToday}
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-medium">
            <span>Rework Today</span>
            <RotateCcw className="size-4" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2 font-mono">
            {kpis.reworkToday}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-rose-600 dark:text-rose-400 font-medium">
            <span>Rejected Today</span>
            <XCircle className="size-4" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 font-mono">
            {kpis.rejectedToday}
          </p>
        </div>
      </div>

      {/* QUEUE TABLE */}
      <DataTable
        columns={columns}
        data={initialData}
        serverPagination={{
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          pageCount: Math.ceil(totalCount / pageSize),
          totalCount,
          onPaginationChange,
        }}
        searchKey="rollNo"
        searchPlaceholder="Filter queue by roll barcode or order number..."
        emptyTitle="Inspection Queue Clear"
        emptyDescription="All completed fabric rolls have been inspected and graded."
      />

      {/* INSPECT ROLL MODAL */}
      <Dialog
        open={!!inspectModalRoll}
        onOpenChange={(open) => !open && setInspectModalRoll(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>QC Roll Inspection & Grading</DialogTitle>
            <DialogDescription>
              Evaluate Roll #{inspectModalRoll?.rollNo} ({inspectModalRoll?.lengthM}m) for Order #{inspectModalRoll?.order.orderNo}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Decision selector */}
            <div className="space-y-1.5">
              <Label>Inspection Outcome *</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedResult("PASS")}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                    selectedResult === "PASS"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <CheckCircle2 className="size-4" />
                  PASS
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedResult("REWORK")}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                    selectedResult === "REWORK"
                      ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <RotateCcw className="size-4" />
                  REWORK
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedResult("REJECT")}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                    selectedResult === "REJECT"
                      ? "border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <XCircle className="size-4" />
                  REJECT
                </button>
              </div>
            </div>

            {/* Defect Checklist */}
            {(selectedResult === "REWORK" || selectedResult === "REJECT") && (
              <div className="rounded-xl border border-border p-3 space-y-3 bg-muted/40">
                <Label className="text-xs font-semibold">
                  Defect Checklist (Required for {selectedResult})
                </Label>

                <div className="flex items-center gap-2">
                  <select
                    value={newDefectType}
                    onChange={(e: any) => setNewDefectType(e.target.value)}
                    className="flex-1 h-8 rounded-lg border border-input bg-background px-2 text-xs"
                  >
                    <option value="hole">Hole</option>
                    <option value="colour_mismatch">Colour Mismatch</option>
                    <option value="uneven_weaving">Uneven Weaving</option>
                    <option value="stain">Stain</option>
                    <option value="other">Other Defect</option>
                  </select>

                  <select
                    value={newDefectSeverity}
                    onChange={(e: any) => setNewDefectSeverity(e.target.value)}
                    className="h-8 rounded-lg border border-input bg-background px-2 text-xs"
                  >
                    <option value="minor">Minor</option>
                    <option value="major">Major</option>
                    <option value="critical">Critical</option>
                  </select>

                  <Button
                    type="button"
                    size="xs"
                    onClick={addDefect}
                    className="h-8"
                  >
                    <Plus className="size-3 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Defect list */}
                {defectsList.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {defectsList.map((d, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-card border border-border text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {d.type.replace("_", " ")}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                            {d.severity}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDefect(idx)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="notes">Inspector Notes / Observations</Label>
              <Input
                id="notes"
                placeholder="e.g. Minor selvedge curl, within commercial tolerance"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setInspectModalRoll(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleInspectSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Confirm Inspection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
