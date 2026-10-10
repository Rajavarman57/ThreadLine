"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { MachineBoardSummary, MachineCardData } from "@/services/production";
import { MachineStatus, Role } from "@prisma/client";
import {
  machineBreakdownAction,
  machineMaintenanceAction,
  resumeMachineAction,
  markMachineIdleAction,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Activity,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  Radio,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface MachineBoardClientProps {
  initialData: MachineBoardSummary;
  userRole: Role;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MachineBoardClient({
  initialData,
  userRole,
}: MachineBoardClientProps) {
  const canOperate = userRole === Role.ADMIN || userRole === Role.SUPERVISOR;

  // Poll every 60 seconds with refreshWhenHidden false
  const { data: boardData, mutate } = useSWR<MachineBoardSummary>(
    "/api/production/machine-board",
    fetcher,
    {
      fallbackData: initialData,
      refreshInterval: 60000,
      revalidateOnFocus: true,
      refreshWhenHidden: false,
    }
  );

  const currentBoard = boardData || initialData;

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [idleOnly, setIdleOnly] = useState<boolean>(false);

  // Dialog state for Breakdown / Maintenance
  const [actionMachine, setActionMachine] = useState<{
    machine: MachineCardData;
    action: "BREAKDOWN" | "MAINTENANCE";
  } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleActionSubmit = async () => {
    if (!actionMachine) return;
    setIsSubmitting(true);
    try {
      if (actionMachine.action === "BREAKDOWN") {
        const res = await machineBreakdownAction(
          actionMachine.machine.id,
          actionReason
        );
        if (!res.success) throw new Error(res.error);
        toast.error(`Machine ${actionMachine.machine.code} reported BREAKDOWN`);
      } else {
        const res = await machineMaintenanceAction(
          actionMachine.machine.id,
          actionReason
        );
        if (!res.success) throw new Error(res.error);
        toast.warning(
          `Machine ${actionMachine.machine.code} moved to MAINTENANCE`
        );
      }
      setActionMachine(null);
      setActionReason("");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to update machine state");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResume = async (machine: MachineCardData) => {
    try {
      const res = await resumeMachineAction(machine.id);
      if (!res.success) throw new Error(res.error);
      toast.success(`Machine ${machine.code} resumed successfully`);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to resume machine");
    }
  };

  const handleMarkIdle = async (machine: MachineCardData) => {
    try {
      const res = await markMachineIdleAction(machine.id);
      if (!res.success) throw new Error(res.error);
      toast.success(`Machine ${machine.code} set to IDLE`);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to mark machine idle");
    }
  };

  // Filter machines
  const filteredMachines = currentBoard.machines.filter((m) => {
    if (idleOnly && m.status !== MachineStatus.IDLE) return false;
    if (statusFilter !== "ALL" && m.status !== statusFilter) return false;
    if (typeFilter !== "ALL" && m.type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* SUMMARY KPI STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Total Machines
            </span>
            <Activity className="size-4 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {currentBoard.totalMachines}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Running
            </span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
            {currentBoard.runningCount}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Idle
            </span>
            <div className="size-2.5 rounded-full bg-slate-400" />
          </div>
          <p className="text-2xl font-bold text-muted-foreground mt-2">
            {currentBoard.idleCount}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Maintenance
            </span>
            <Wrench className="size-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {currentBoard.maintenanceCount}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              Breakdown
            </span>
            <AlertTriangle className="size-4 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2">
            {currentBoard.breakdownCount}
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              Today&apos;s Output
            </span>
            <Flame className="size-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2 font-mono">
            {currentBoard.todayMetres.toLocaleString()} m
          </p>
        </div>
      </div>

      {/* FILTER CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border">
            {["ALL", "RUNNING", "IDLE", "MAINTENANCE", "BREAKDOWN"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  statusFilter === st
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 rounded-xl border border-input bg-background px-3 text-xs focus:outline-none"
          >
            <option value="ALL">All Machine Types</option>
            <option value="SPINNING">Spinning</option>
            <option value="WEAVING">Weaving</option>
            <option value="DYEING">Dyeing</option>
          </select>

          {/* Idle only toggle */}
          <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer select-none ml-2">
            <input
              type="checkbox"
              checked={idleOnly}
              onChange={(e) => setIdleOnly(e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary size-4"
            />
            Idle Only
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/production/plan"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            Plan Production
          </Link>
          <Link
            href="/production/work-orders"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors"
          >
            All Work Orders
          </Link>
        </div>
      </div>

      {/* MACHINE CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMachines.map((machine) => {
          let statusBadgeClass = "bg-slate-500/10 text-slate-500 border-slate-500/20";
          if (machine.status === MachineStatus.RUNNING) {
            statusBadgeClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
          } else if (machine.status === MachineStatus.MAINTENANCE) {
            statusBadgeClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
          } else if (machine.status === MachineStatus.BREAKDOWN) {
            statusBadgeClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
          }

          return (
            <div
              key={machine.id}
              className={`rounded-2xl border p-5 shadow-xs bg-card flex flex-col justify-between transition-all hover:border-primary/40 ${
                machine.status === MachineStatus.RUNNING
                  ? "border-emerald-500/40"
                  : machine.status === MachineStatus.BREAKDOWN
                  ? "border-rose-500/40"
                  : machine.status === MachineStatus.MAINTENANCE
                  ? "border-amber-500/40"
                  : "border-border"
              }`}
            >
              <div>
                {/* Header: Code, Type, Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {machine.code}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                      {machine.type}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${statusBadgeClass}`}
                  >
                    {machine.status}
                  </span>
                </div>

                {machine.name && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {machine.name}
                  </p>
                )}

                {/* Body: Current Order, Stage, Progress */}
                <div className="mt-4 pt-3 border-t border-border/60 space-y-2.5">
                  {machine.currentOrderNo ? (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Order:</span>
                        <span className="font-mono font-semibold text-foreground">
                          PO #{machine.currentOrderNo}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Stage:</span>
                        <span className="font-semibold text-primary">
                          {machine.currentStage}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-muted-foreground">Progress:</span>
                          <span className="font-semibold">
                            {machine.producedQty.toLocaleString()} /{" "}
                            {machine.targetQty.toLocaleString()} m ({machine.progressPercent}%)
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all rounded-full"
                            style={{ width: `${machine.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-2 text-center text-xs text-muted-foreground italic">
                      No active work order scheduled
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground border-t border-border/40 font-mono">
                    <span>Shift output today:</span>
                    <span className="font-semibold text-foreground">
                      {machine.todayOutputMetres.toLocaleString()} m
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer: Operator Action Buttons */}
              {canOperate && (
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-1.5">
                  {machine.status === MachineStatus.RUNNING && (
                    <>
                      <Button
                        variant="outline"
                        size="xs"
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 text-[11px]"
                        onClick={() =>
                          setActionMachine({
                            machine,
                            action: "MAINTENANCE",
                          })
                        }
                      >
                        <Wrench className="size-3 mr-1" />
                        Maint
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 text-[11px]"
                        onClick={() =>
                          setActionMachine({
                            machine,
                            action: "BREAKDOWN",
                          })
                        }
                      >
                        <AlertTriangle className="size-3 mr-1" />
                        Breakdown
                      </Button>
                    </>
                  )}

                  {(machine.status === MachineStatus.BREAKDOWN ||
                    machine.status === MachineStatus.MAINTENANCE) && (
                    <Button
                      variant="outline"
                      size="xs"
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 text-[11px] w-full"
                      onClick={() => handleResume(machine)}
                    >
                      <RotateCcw className="size-3 mr-1" />
                      Resume Machine
                    </Button>
                  )}

                  {machine.status !== MachineStatus.IDLE &&
                    !machine.currentOrderNo && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="text-[11px] text-muted-foreground hover:text-foreground"
                        onClick={() => handleMarkIdle(machine)}
                      >
                        Mark Idle
                      </Button>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredMachines.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          No machines matching your current filter criteria.
        </div>
      )}

      {/* BREAKDOWN / MAINTENANCE MODAL */}
      <Dialog
        open={!!actionMachine}
        onOpenChange={(open) => !open && setActionMachine(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionMachine?.action === "BREAKDOWN"
                ? "Report Machine Breakdown"
                : "Schedule Machine Maintenance"}
            </DialogTitle>
            <DialogDescription>
              {actionMachine?.action === "BREAKDOWN"
                ? `Halts Machine ${actionMachine?.machine.code} and alerts Administrators and Supervisors.`
                : `Marks Machine ${actionMachine?.machine.code} as under scheduled maintenance.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-foreground">
              Reason / Fault Details *
            </label>
            <Input
              placeholder="e.g. Spindle bearing overheat, hydraulic leak, electrical trip"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionMachine(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={
                actionMachine?.action === "BREAKDOWN"
                  ? "destructive"
                  : "default"
              }
              onClick={handleActionSubmit}
              disabled={isSubmitting || !actionReason.trim()}
            >
              {isSubmitting ? "Recording..." : "Confirm Status Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
