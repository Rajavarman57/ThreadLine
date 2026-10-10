"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Role } from "@prisma/client";
import { YarnStockSummary } from "@/services/inventory";
import {
  stockAdjustmentSchema,
  StockAdjustmentInput,
} from "@/services/schemas/inventory";
import { adjustStockAction } from "./actions";
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
import { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  Layers,
  SlidersHorizontal,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface InventoryClientProps {
  initialData: YarnStockSummary[];
  userRole: Role;
}

export function InventoryClient({ initialData, userRole }: InventoryClientProps) {
  const router = useRouter();
  const canWrite = userRole === Role.ADMIN || userRole === Role.STORE;

  const [adjustItem, setAdjustItem] = useState<YarnStockSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StockAdjustmentInput>({
    resolver: zodResolver(stockAdjustmentSchema) as any,
    defaultValues: {
      yarnTypeId: "",
      qtyDelta: 0,
      note: "",
    },
  });

  const lowStockYarns = initialData.filter(
    (y) => y.status === "LOW" || y.status === "OUT"
  );

  const openAdjustDialog = (item: YarnStockSummary) => {
    setAdjustItem(item);
    reset({
      yarnTypeId: item.id,
      qtyDelta: 0,
      note: "",
    });
  };

  const onAdjustSubmit = async (data: StockAdjustmentInput) => {
    setIsSubmitting(true);
    try {
      const res = await adjustStockAction(data);
      if (!res.success) throw new Error(res.error);
      toast.success("Stock adjustment successfully posted to ledger");
      setAdjustItem(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to post adjustment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<YarnStockSummary>[] = [
    {
      accessorKey: "type",
      header: "Yarn Count & Composition",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary shrink-0" />
          <span className="font-semibold text-foreground">{row.original.type}</span>
        </div>
      ),
    },
    {
      accessorKey: "colour",
      header: "Colour / Shade",
      cell: ({ row }) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-muted border border-border">
          {row.original.colour}
        </span>
      ),
    },
    {
      accessorKey: "onHand",
      header: "Physical On-Hand",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">
          {row.original.onHand.toLocaleString()} {row.original.unit}
        </span>
      ),
    },
    {
      accessorKey: "reserved",
      header: "Reserved (Orders)",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-amber-600 dark:text-amber-400">
          {row.original.reserved.toLocaleString()} {row.original.unit}
        </span>
      ),
    },
    {
      accessorKey: "available",
      header: "Available (Free)",
      cell: ({ row }) => (
        <span
          className={`font-mono text-sm font-semibold ${
            row.original.available < row.original.reorderLevel
              ? "text-destructive"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {row.original.available.toLocaleString()} {row.original.unit}
        </span>
      ),
    },
    {
      accessorKey: "reorderLevel",
      header: "Reorder Threshold",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.reorderLevel.toLocaleString()} {row.original.unit}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Stock Health",
      cell: ({ row }) => {
        const st = row.original.status;
        return (
          <StatusBadge
            status={st === "OK" ? "PASSED" : st === "LOW" ? "REWORK" : "REJECTED"}
          />
        );
      },
    },
    ...(canWrite
      ? [
          {
            id: "actions",
            header: () => <span className="text-right block">Actions</span>,
            cell: ({ row }: { row: { original: YarnStockSummary } }) => (
              <div className="flex items-center justify-end gap-1.5">
                <Button
                  variant="outline"
                  size="icon-xs"
                  onClick={() => openAdjustDialog(row.original)}
                  title="Adjust Stock Ledger"
                >
                  <SlidersHorizontal className="size-3.5" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* LOW STOCK BANNER */}
      {lowStockYarns.length > 0 && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-destructive/10 text-destructive shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-destructive">
                Critical Low Stock Alert ({lowStockYarns.length} Yarns Below Reorder Threshold)
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                The following yarn specifications require replenishment:{" "}
                <span className="font-medium text-foreground">
                  {lowStockYarns.map((y) => `${y.type} (${y.colour})`).join(", ")}
                </span>
                .
              </p>
            </div>
          </div>

          {canWrite && (
            <Link
              href="/inventory/receipts/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-destructive text-white hover:bg-destructive/90 transition-colors shadow-xs shrink-0"
            >
              <PlusCircle className="size-3.5" />
              Receive Restock
            </Link>
          )}
        </div>
      )}

      {/* TABLE */}
      <DataTable
        columns={columns}
        data={initialData}
        searchKey="type"
        searchPlaceholder="Filter yarns by composition or count..."
        emptyTitle="No Yarn Stock Found"
        emptyDescription="Create yarn types and post goods receipts to initialize inventory balances."
      />

      {/* ADJUST STOCK MODAL */}
      <Dialog open={!!adjustItem} onOpenChange={(open) => !open && setAdjustItem(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Stock Balance</DialogTitle>
            <DialogDescription>
              Post an audited signed adjustment movement for{" "}
              <span className="font-semibold text-foreground">
                {adjustItem?.type} ({adjustItem?.colour})
              </span>
              .
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onAdjustSubmit)} className="space-y-4 py-2">
            <input type="hidden" {...register("yarnTypeId")} value={adjustItem?.id || ""} />

            <div className="rounded-xl bg-muted/50 p-3 border border-border/80 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current On-Hand:</span>
                <span className="font-mono font-semibold">
                  {adjustItem?.onHand.toLocaleString()} {adjustItem?.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Free Available:</span>
                <span className="font-mono font-semibold">
                  {adjustItem?.available.toLocaleString()} {adjustItem?.unit}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qtyDelta">
                Quantity Delta ({adjustItem?.unit}) *
              </Label>
              <Input
                id="qtyDelta"
                type="number"
                step="0.01"
                placeholder="e.g. +50.0 for found stock, -25.5 for wastage"
                {...register("qtyDelta", { valueAsNumber: true })}
              />
              <p className="text-[11px] text-muted-foreground">
                Use a positive number to add stock, or a negative number for wastage/damage.
              </p>
              {errors.qtyDelta && (
                <p className="text-destructive text-xs">{errors.qtyDelta.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="note">Adjustment Reason / Audit Note *</Label>
              <Input
                id="note"
                placeholder="e.g., Annual physical count discrepancy audit"
                {...register("note")}
              />
              {errors.note && (
                <p className="text-destructive text-xs">{errors.note.message}</p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAdjustItem(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Posting..." : "Confirm Adjustment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
