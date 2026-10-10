"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MachineType, MachineStatus, Role } from "@prisma/client";
import { machineSchema, MachineInput } from "@/services/schemas/master";
import { createMachineAction, updateMachineAction } from "../actions";
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
import { Plus, Edit2, Cpu } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface MachineRow {
  id: string;
  code: string;
  name: string | null;
  type: MachineType;
  status: MachineStatus;
  hourlyOverhead: number;
  capacityPerHour: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface MachinesClientProps {
  initialData: MachineRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  userRole: Role;
}

export function MachinesClient({
  initialData,
  totalCount,
  currentPage,
  pageSize,
  search,
  userRole,
}: MachinesClientProps) {
  const router = useRouter();
  const isAdmin = userRole === Role.ADMIN;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<MachineRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MachineInput>({
    resolver: zodResolver(machineSchema) as any,
    defaultValues: {
      code: "",
      name: "",
      type: MachineType.WEAVING,
      status: MachineStatus.IDLE,
      hourlyOverhead: 150,
      capacityPerHour: 60,
    },
  });

  const openCreateDialog = () => {
    setEditingMachine(null);
    reset({
      code: "",
      name: "",
      type: MachineType.WEAVING,
      status: MachineStatus.IDLE,
      hourlyOverhead: 150,
      capacityPerHour: 60,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (machine: MachineRow) => {
    setEditingMachine(machine);
    reset({
      code: machine.code,
      name: machine.name || "",
      type: machine.type,
      status: machine.status,
      hourlyOverhead: machine.hourlyOverhead,
      capacityPerHour: machine.capacityPerHour,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: MachineInput) => {
    setIsSubmitting(true);
    try {
      if (editingMachine) {
        const res = await updateMachineAction(editingMachine.id, data);
        if (!res.success) throw new Error(res.error);
        toast.success(`Machine "${data.code}" updated successfully`);
      } else {
        const res = await createMachineAction(data);
        if (!res.success) throw new Error(res.error);
        toast.success(`Machine "${data.code}" created successfully`);
      }
      setDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save machine");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPaginationChange = (nextPagination: PaginationState) => {
    const params = new URLSearchParams();
    params.set("page", String(nextPagination.pageIndex + 1));
    params.set("pageSize", String(nextPagination.pageSize));
    if (search) params.set("search", search);
    router.push(`/master/machines?${params.toString()}`);
  };

  const handleSearch = (term: string) => {
    const params = new URLSearchParams();
    if (term) params.set("search", term);
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    router.push(`/master/machines?${params.toString()}`);
  };

  const columns: ColumnDef<MachineRow>[] = [
    {
      accessorKey: "code",
      header: "Machine Code",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Cpu className="size-4 text-primary shrink-0" />
          <span className="font-mono font-semibold text-foreground">
            {row.original.code}
          </span>
          {row.original.name && (
            <span className="text-xs text-muted-foreground font-sans">
              ({row.original.name})
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Stage / Type",
      cell: ({ row }) => {
        return <StatusBadge status={row.original.type} />;
      },
    },
    {
      accessorKey: "status",
      header: "Operational Status",
      cell: ({ row }) => {
        return <StatusBadge status={row.original.status} />;
      },
    },
    {
      accessorKey: "capacityPerHour",
      header: "Capacity",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.capacityPerHour.toLocaleString()} m/hr
        </span>
      ),
    },
    {
      accessorKey: "hourlyOverhead",
      header: "Hourly Overhead",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          ₹{row.original.hourlyOverhead.toFixed(2)}/hr
        </span>
      ),
    },
    ...(isAdmin
      ? [
          {
            id: "actions",
            header: () => <span className="text-right block">Actions</span>,
            cell: ({ row }: { row: { original: MachineRow } }) => {
              const machine = row.original;
              return (
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEditDialog(machine)}
                    title="Edit machine"
                  >
                    <Edit2 className="size-3.5" />
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
            placeholder="Search machine code or name..."
            defaultValue={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full sm:w-72 h-9 text-sm rounded-xl"
          />
        </div>

        {isAdmin && (
          <Button onClick={openCreateDialog} size="sm" className="gap-2 rounded-xl">
            <Plus className="size-4" />
            Add Machine
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={initialData}
        emptyTitle="No Machines Configured"
        emptyDescription="Add plant spinning frames, rapier/air-jet looms, or dyeing jiggers to assign work orders."
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
              {editingMachine ? "Edit Machine" : "Add Production Machine"}
            </DialogTitle>
            <DialogDescription>
              Configure plant equipment codes, floor capacity, and operational overhead.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="code">Machine Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., WV-01"
                  className="font-mono uppercase"
                  {...register("code")}
                />
                {errors.code && (
                  <p className="text-destructive text-xs">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Friendly Name</Label>
                <Input
                  id="name"
                  placeholder="Airjet Loom #1"
                  {...register("name")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="type">Machine Type *</Label>
                <select
                  id="type"
                  {...register("type")}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value={MachineType.SPINNING}>SPINNING</option>
                  <option value={MachineType.WEAVING}>WEAVING</option>
                  <option value={MachineType.DYEING}>DYEING</option>
                </select>
                {errors.type && (
                  <p className="text-destructive text-xs">{errors.type.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">Current Status *</Label>
                <select
                  id="status"
                  {...register("status")}
                  className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value={MachineStatus.IDLE}>IDLE</option>
                  <option value={MachineStatus.RUNNING}>RUNNING</option>
                  <option value={MachineStatus.MAINTENANCE}>MAINTENANCE</option>
                  <option value={MachineStatus.BREAKDOWN}>BREAKDOWN</option>
                </select>
                {errors.status && (
                  <p className="text-destructive text-xs">{errors.status.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="capacity">Capacity (Metres/Hour) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  step="0.01"
                  placeholder="65.0"
                  {...register("capacityPerHour", { valueAsNumber: true })}
                />
                {errors.capacityPerHour && (
                  <p className="text-destructive text-xs">
                    {errors.capacityPerHour.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="overhead">Hourly Overhead (₹/hr) *</Label>
                <Input
                  id="overhead"
                  type="number"
                  step="0.01"
                  placeholder="180.00"
                  {...register("hourlyOverhead", { valueAsNumber: true })}
                />
                {errors.hourlyOverhead && (
                  <p className="text-destructive text-xs">
                    {errors.hourlyOverhead.message}
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
                {isSubmitting ? "Saving..." : editingMachine ? "Save Changes" : "Create Machine"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
