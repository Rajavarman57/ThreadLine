"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Role } from "@prisma/client";
import { workerSchema, WorkerInput } from "@/services/schemas/master";
import {
  createWorkerAction,
  updateWorkerAction,
  toggleWorkerActiveAction,
} from "../actions";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
import { Plus, Edit2, Power, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface WorkerRow {
  id: string;
  name: string;
  code: string | null;
  role: string | null;
  phone: string | null;
  dailyRate: number;
  otRatePerHour: number;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface WorkersClientProps {
  initialData: WorkerRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  userRole: Role;
}

export function WorkersClient({
  initialData,
  totalCount,
  currentPage,
  pageSize,
  search,
  userRole,
}: WorkersClientProps) {
  const router = useRouter();
  const isAdmin = userRole === Role.ADMIN;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<WorkerRow | null>(null);
  const [statusConfirmItem, setStatusConfirmItem] = useState<WorkerRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkerInput>({
    resolver: zodResolver(workerSchema) as any,
    defaultValues: {
      name: "",
      code: "",
      role: "Weaver",
      phone: "",
      dailyRate: 650,
      otRatePerHour: 85,
      active: true,
    },
  });

  const openCreateDialog = () => {
    setEditingWorker(null);
    reset({
      name: "",
      code: "",
      role: "Weaver",
      phone: "",
      dailyRate: 650,
      otRatePerHour: 85,
      active: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (worker: WorkerRow) => {
    setEditingWorker(worker);
    reset({
      name: worker.name,
      code: worker.code || "",
      role: worker.role || "",
      phone: worker.phone || "",
      dailyRate: worker.dailyRate,
      otRatePerHour: worker.otRatePerHour,
      active: worker.active,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: WorkerInput) => {
    setIsSubmitting(true);
    try {
      if (editingWorker) {
        const res = await updateWorkerAction(editingWorker.id, data);
        if (!res.success) throw new Error(res.error);
        toast.success(`Worker "${data.name}" updated successfully`);
      } else {
        const res = await createWorkerAction(data);
        if (!res.success) throw new Error(res.error);
        toast.success(`Worker "${data.name}" registered successfully`);
      }
      setDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save worker");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!statusConfirmItem) return;
    setIsSubmitting(true);
    try {
      const res = await toggleWorkerActiveAction(
        statusConfirmItem.id,
        !statusConfirmItem.active
      );
      if (!res.success) throw new Error(res.error);
      toast.success(
        `Worker "${statusConfirmItem.name}" marked as ${
          statusConfirmItem.active ? "inactive" : "active"
        }`
      );
      setStatusConfirmItem(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update worker status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPaginationChange = (nextPagination: PaginationState) => {
    const params = new URLSearchParams();
    params.set("page", String(nextPagination.pageIndex + 1));
    params.set("pageSize", String(nextPagination.pageSize));
    if (search) params.set("search", search);
    router.push(`/master/workers?${params.toString()}`);
  };

  const handleSearch = (term: string) => {
    const params = new URLSearchParams();
    if (term) params.set("search", term);
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    router.push(`/master/workers?${params.toString()}`);
  };

  const columns: ColumnDef<WorkerRow>[] = [
    {
      accessorKey: "name",
      header: "Worker Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <UserCheck className="size-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-foreground">{row.original.name}</span>
          {row.original.code && (
            <span className="text-xs font-mono text-muted-foreground">
              [{row.original.code}]
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Floor Trade / Designation",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.role || "Operator"}</span>
      ),
    },
    {
      accessorKey: "dailyRate",
      header: "Daily Wage",
      cell: ({ row }) => (
        <span className="font-mono text-foreground font-medium">
          ₹{row.original.dailyRate.toFixed(2)}/day
        </span>
      ),
    },
    {
      accessorKey: "otRatePerHour",
      header: "OT Rate",
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground text-xs">
          ₹{row.original.otRatePerHour.toFixed(2)}/hr
        </span>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-xs">
          {row.original.phone || "—"}
        </span>
      ),
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.active ? "ACTIVE" : "INACTIVE"}
        />
      ),
    },
    ...(isAdmin
      ? [
          {
            id: "actions",
            header: () => <span className="text-right block">Actions</span>,
            cell: ({ row }: { row: { original: WorkerRow } }) => {
              const worker = row.original;
              return (
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEditDialog(worker)}
                    title="Edit worker"
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setStatusConfirmItem(worker)}
                    title={worker.active ? "Deactivate" : "Activate"}
                    className={
                      worker.active
                        ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    }
                  >
                    <Power className="size-3.5" />
                  </Button>
                </div>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="w-full sm:w-auto">
          <Input
            placeholder="Search workers by name, badge, role..."
            defaultValue={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full sm:w-72 h-9 text-sm rounded-xl"
          />
        </div>

        {isAdmin && (
          <Button onClick={openCreateDialog} size="sm" className="gap-2 rounded-xl">
            <Plus className="size-4" />
            Add Worker
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={initialData}
        emptyTitle="No Workers Found"
        emptyDescription="Register textile mill operatives, weavers, and technicians for shift attendance and payroll."
        serverPagination={{
          pageIndex: currentPage - 1,
          pageSize,
          pageCount: Math.ceil(totalCount / pageSize) || 1,
          totalCount,
          onPaginationChange,
        }}
      />

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingWorker ? "Edit Worker Profile" : "Register New Worker"}
            </DialogTitle>
            <DialogDescription>
              Configure plant personnel wages, badge identification, and trade specialization.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="worker-name">Full Name *</Label>
              <Input
                id="worker-name"
                placeholder="e.g., Arumugam P."
                {...register("name")}
              />
              {errors.name && (
                <p className="text-destructive text-xs">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="worker-code">Badge / ID Code</Label>
                <Input
                  id="worker-code"
                  placeholder="WRK-102"
                  className="font-mono uppercase"
                  {...register("code")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="worker-role">Trade / Designation</Label>
                <Input
                  id="worker-role"
                  placeholder="e.g., Weaver / Sizer"
                  {...register("role")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="worker-phone">Contact Number</Label>
              <Input
                id="worker-phone"
                placeholder="+91 97890 12345"
                {...register("phone")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dailyRate">Daily Wage (₹) *</Label>
                <Input
                  id="dailyRate"
                  type="number"
                  step="0.01"
                  placeholder="650.00"
                  {...register("dailyRate", { valueAsNumber: true })}
                />
                {errors.dailyRate && (
                  <p className="text-destructive text-xs">
                    {errors.dailyRate.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="otRatePerHour">Overtime Rate (₹/hr) *</Label>
                <Input
                  id="otRatePerHour"
                  type="number"
                  step="0.01"
                  placeholder="85.00"
                  {...register("otRatePerHour", { valueAsNumber: true })}
                />
                {errors.otRatePerHour && (
                  <p className="text-destructive text-xs">
                    {errors.otRatePerHour.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingWorker ? "Save Changes" : "Create Worker"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* STATUS TOGGLE CONFIRMATION */}
      <ConfirmDialog
        open={!!statusConfirmItem}
        onOpenChange={(open) => !open && setStatusConfirmItem(null)}
        title={statusConfirmItem?.active ? "Deactivate Worker?" : "Activate Worker?"}
        description={`Are you sure you want to ${
          statusConfirmItem?.active ? "deactivate" : "activate"
        } "${statusConfirmItem?.name}"? Inactive workers cannot be assigned shifts on the factory floor.`}
        confirmLabel={statusConfirmItem?.active ? "Deactivate" : "Activate"}
        variant={statusConfirmItem?.active ? "destructive" : "default"}
        isLoading={isSubmitting}
        onConfirm={handleToggleActive}
      />
    </div>
  );
}
