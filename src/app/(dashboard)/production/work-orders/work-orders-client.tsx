"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProductionStage,
  WorkOrderStatus,
  Role,
  Shift,
} from "@prisma/client";
import {
  logOutputSchema,
  LogOutputInput,
} from "@/services/schemas/production";
import {
  startWorkOrderAction,
  logProductionOutputAction,
} from "../actions";
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
  Layers,
  Play,
  CheckCircle2,
  Cpu,
  PlusCircle,
  Clock,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface WorkOrderRow {
  id: string;
  stage: ProductionStage;
  status: WorkOrderStatus;
  targetQty: number;
  producedQty: number;
  startedAt: string | null;
  endedAt: string | null;
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
  logCount: number;
  rollCount: number;
}

interface WorkOrdersClientProps {
  initialData: WorkOrderRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  stage?: ProductionStage;
  status?: WorkOrderStatus;
  userRole: Role;
}

export function WorkOrdersClient({
  initialData,
  totalCount,
  currentPage,
  pageSize,
  stage,
  status,
  userRole,
}: WorkOrdersClientProps) {
  const router = useRouter();
  const canOperate = userRole === Role.ADMIN || userRole === Role.SUPERVISOR;

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: currentPage - 1,
    pageSize,
  });

  // Output logging dialog state
  const [logModalWO, setLogModalWO] = useState<WorkOrderRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LogOutputInput>({
    resolver: zodResolver(logOutputSchema) as any,
    defaultValues: {
      workOrderId: "",
      metres: 50,
      hours: 8,
      shift: Shift.A,
    },
  });

  const onPaginationChange = (updaterOrValue: any) => {
    const nextPagination =
      typeof updaterOrValue === "function"
        ? updaterOrValue(pagination)
        : updaterOrValue;
    setPagination(nextPagination);

    const params = new URLSearchParams(window.location.search);
    params.set("page", String(nextPagination.pageIndex + 1));
    params.set("pageSize", String(nextPagination.pageSize));
    router.push(`/production/work-orders?${params.toString()}`);
  };

  const handleStart = async (wo: WorkOrderRow) => {
    try {
      const res = await startWorkOrderAction(wo.id);
      if (!res.success) throw new Error(res.error);
      toast.success(
        `Work order started! Machine ${wo.machine?.code || ""} is now RUNNING.`
      );
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to start work order");
    }
  };

  const openLogDialog = (wo: WorkOrderRow) => {
    setLogModalWO(wo);
    const remaining = Math.max(0, wo.targetQty - wo.producedQty);
    reset({
      workOrderId: wo.id,
      metres: Math.min(50, remaining),
      hours: 8,
      shift: Shift.A,
    });
  };

  const onLogSubmit = async (data: LogOutputInput) => {
    setIsSubmitting(true);
    try {
      const res = await logProductionOutputAction(data);
      if (!res.success) throw new Error(res.error);

      toast.success(
        `Logged ${data.metres}m output for Work Order #${logModalWO?.id.slice(-6)}!`
      );
      setLogModalWO(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to log output");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<WorkOrderRow>[] = [
    {
      accessorKey: "order",
      header: "Customer Order",
      cell: ({ row }) => (
        <div>
          <span className="font-mono font-bold text-foreground">
            PO #{row.original.order.orderNo}
          </span>
          <div className="text-xs text-muted-foreground">
            {row.original.order.buyerName} • {row.original.order.fabricType}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "stage",
      header: "Stage",
      cell: ({ row }) => (
        <span className="font-semibold text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20">
          {row.original.stage}
        </span>
      ),
    },
    {
      accessorKey: "machine",
      header: "Allocated Machine",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.machine ? (
            <span className="px-2 py-0.5 rounded bg-muted border border-border">
              {row.original.machine.code} ({row.original.machine.type})
            </span>
          ) : (
            <span className="text-muted-foreground italic">Unassigned</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "progress",
      header: "Production Progress",
      cell: ({ row }) => {
        const percent = Math.min(
          100,
          Math.round(
            (row.original.producedQty / row.original.targetQty) * 100
          )
        );
        return (
          <div className="w-44 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span>{row.original.producedQty.toLocaleString()} m</span>
              <span className="text-muted-foreground">
                / {row.original.targetQty.toLocaleString()} m ({percent}%)
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  percent === 100 ? "bg-emerald-500" : "bg-primary"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "rollCount",
      header: "Output Units",
      cell: ({ row }) => (
        <div className="text-xs font-mono text-muted-foreground">
          {row.original.stage === "DYEING" ? (
            <span>{row.original.rollCount} Rolls generated</span>
          ) : (
            <span>{row.original.logCount} Shift logs</span>
          )}
        </div>
      ),
    },
    ...(canOperate
      ? [
          {
            id: "actions",
            header: () => <span className="text-right block">Actions</span>,
            cell: ({ row }: { row: { original: WorkOrderRow } }) => {
              const wo = row.original;
              return (
                <div className="flex items-center justify-end gap-1.5">
                  {wo.status === WorkOrderStatus.PLANNED && (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleStart(wo)}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 text-xs"
                    >
                      <Play className="size-3 mr-1" />
                      Start
                    </Button>
                  )}

                  {wo.status === WorkOrderStatus.RUNNING && (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => openLogDialog(wo)}
                      className="text-xs bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
                    >
                      <PlusCircle className="size-3 mr-1" />
                      Log Output
                    </Button>
                  )}
                </div>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground mr-1">
          Stage:
        </span>
        {["ALL", "SPINNING", "WEAVING", "DYEING"].map((st) => (
          <button
            key={st}
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              if (st === "ALL") params.delete("stage");
              else params.set("stage", st);
              params.set("page", "1");
              router.push(`/production/work-orders?${params.toString()}`);
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-colors ${
              (st === "ALL" && !stage) || stage === st
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {st}
          </button>
        ))}

        <div className="h-4 w-px bg-border mx-2" />

        <span className="text-xs font-semibold text-muted-foreground mr-1">
          Status:
        </span>
        {["ALL", "PLANNED", "RUNNING", "DONE", "BLOCKED"].map((st) => (
          <button
            key={st}
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              if (st === "ALL") params.delete("status");
              else params.set("status", st);
              params.set("page", "1");
              router.push(`/production/work-orders?${params.toString()}`);
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-colors ${
              (st === "ALL" && !status) || status === st
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

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
        emptyTitle="No Work Orders Found"
        emptyDescription="Plan production from confirmed customer orders to generate manufacturing work orders."
      />

      {/* LOG OUTPUT MODAL */}
      <Dialog
        open={!!logModalWO}
        onOpenChange={(open) => !open && setLogModalWO(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Shift Production Output</DialogTitle>
            <DialogDescription>
              Record completed fabric metres for Work Order #
              {logModalWO?.id.slice(-6)} on {logModalWO?.stage} (
              {logModalWO?.machine?.code}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onLogSubmit)} className="space-y-4 py-2">
            <input
              type="hidden"
              {...register("workOrderId")}
              value={logModalWO?.id || ""}
            />

            <div className="rounded-xl bg-muted/50 p-3 border border-border/80 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Target:</span>
                <span className="font-mono font-semibold">
                  {logModalWO?.targetQty.toLocaleString()} m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already Produced:</span>
                <span className="font-mono text-emerald-600 font-semibold">
                  {logModalWO?.producedQty.toLocaleString()} m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-mono font-bold text-foreground">
                  {(
                    (logModalWO?.targetQty || 0) - (logModalWO?.producedQty || 0)
                  ).toLocaleString()}{" "}
                  m
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="metres">Output Metres *</Label>
                <Input
                  id="metres"
                  type="number"
                  step="0.01"
                  {...register("metres", { valueAsNumber: true })}
                />
                {errors.metres && (
                  <p className="text-destructive text-xs">
                    {errors.metres.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hours">Shift Run Hours *</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.1"
                  {...register("hours", { valueAsNumber: true })}
                />
                {errors.hours && (
                  <p className="text-destructive text-xs">
                    {errors.hours.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shift">Operating Shift *</Label>
              <select
                id="shift"
                {...register("shift")}
                className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value={Shift.A}>Shift A (Morning 06:00 - 14:00)</option>
                <option value={Shift.B}>Shift B (Evening 14:00 - 22:00)</option>
                <option value={Shift.C}>Shift C (Night 22:00 - 06:00)</option>
              </select>
              {errors.shift && (
                <p className="text-destructive text-xs">
                  {errors.shift.message}
                </p>
              )}
            </div>

            {logModalWO?.stage === "SPINNING" && (
              <p className="text-[11px] text-muted-foreground bg-muted p-2 rounded-lg">
                Notice: Logging spinning output will automatically issue raw yarn from the stock ledger according to the fabric BOM ratio.
              </p>
            )}

            {logModalWO?.stage === "DYEING" && (
              <p className="text-[11px] text-muted-foreground bg-muted p-2 rounded-lg">
                Notice: Dyeing output will automatically generate serialised fabric rolls (50m each) with <strong>PENDING</strong> status ready for QC inspection.
              </p>
            )}

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLogModalWO(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Logging Output..." : "Confirm & Save Output"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
