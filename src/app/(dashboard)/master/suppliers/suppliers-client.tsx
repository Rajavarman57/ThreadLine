"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Supplier } from "@prisma/client";
import { Role } from "@prisma/client";
import { supplierSchema, SupplierInput } from "@/services/schemas/master";
import {
  createSupplierAction,
  updateSupplierAction,
  toggleSupplierActiveAction,
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
import { Plus, Edit2, Power, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SuppliersClientProps {
  initialData: Supplier[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  userRole: Role;
}

export function SuppliersClient({
  initialData,
  totalCount,
  currentPage,
  pageSize,
  search,
  userRole,
}: SuppliersClientProps) {
  const router = useRouter();
  const isAdmin = userRole === Role.ADMIN;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [statusConfirmItem, setStatusConfirmItem] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema) as any,
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      active: true,
    },
  });

  const openCreateDialog = () => {
    setEditingSupplier(null);
    reset({
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      active: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    reset({
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      address: supplier.address || "",
      active: supplier.active,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: SupplierInput) => {
    setIsSubmitting(true);
    try {
      if (editingSupplier) {
        const res = await updateSupplierAction(editingSupplier.id, data);
        if (!res.success) throw new Error(res.error);
        toast.success(`Supplier "${data.name}" updated successfully`);
      } else {
        const res = await createSupplierAction(data);
        if (!res.success) throw new Error(res.error);
        toast.success(`Supplier "${data.name}" registered successfully`);
      }
      setDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!statusConfirmItem) return;
    setIsSubmitting(true);
    try {
      const res = await toggleSupplierActiveAction(
        statusConfirmItem.id,
        !statusConfirmItem.active
      );
      if (!res.success) throw new Error(res.error);
      toast.success(
        `Supplier "${statusConfirmItem.name}" marked as ${
          statusConfirmItem.active ? "inactive" : "active"
        }`
      );
      setStatusConfirmItem(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update supplier status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPaginationChange = (nextPagination: PaginationState) => {
    const params = new URLSearchParams();
    params.set("page", String(nextPagination.pageIndex + 1));
    params.set("pageSize", String(nextPagination.pageSize));
    if (search) params.set("search", search);
    router.push(`/master/suppliers?${params.toString()}`);
  };

  const handleSearch = (term: string) => {
    const params = new URLSearchParams();
    if (term) params.set("search", term);
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    router.push(`/master/suppliers?${params.toString()}`);
  };

  const columns: ColumnDef<Supplier>[] = [
    {
      accessorKey: "name",
      header: "Supplier Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-foreground">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "contactPerson",
      header: "Contact Person",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.contactPerson || "—"}
        </span>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-muted-foreground font-mono text-xs">
          {row.original.email || "—"}
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
            cell: ({ row }: { row: { original: Supplier } }) => {
              const supplier = row.original;
              return (
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEditDialog(supplier)}
                    title="Edit supplier"
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setStatusConfirmItem(supplier)}
                    title={supplier.active ? "Deactivate" : "Activate"}
                    className={
                      supplier.active
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
            placeholder="Search suppliers..."
            defaultValue={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full sm:w-72 h-9 text-sm rounded-xl"
          />
        </div>

        {isAdmin && (
          <Button onClick={openCreateDialog} size="sm" className="gap-2 rounded-xl">
            <Plus className="size-4" />
            Add Supplier
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={initialData}
        emptyTitle="No Suppliers Found"
        emptyDescription="Create your first raw material or yarn supplier to start purchase orders."
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
              {editingSupplier ? "Edit Supplier" : "Register New Supplier"}
            </DialogTitle>
            <DialogDescription>
              Configure yarn and raw material vendor details for procurement.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Premier Spun Yarns Ltd."
                {...register("name")}
              />
              {errors.name && (
                <p className="text-destructive text-xs">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                placeholder="e.g., Rajesh Kumar"
                {...register("contactPerson")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vendor@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-destructive text-xs">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  {...register("phone")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Factory / Office Address</Label>
              <Input
                id="address"
                placeholder="e.g., SIPCOT Industrial Complex, Perundurai"
                {...register("address")}
              />
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
                {isSubmitting ? "Saving..." : editingSupplier ? "Save Changes" : "Create Supplier"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* STATUS TOGGLE CONFIRMATION */}
      <ConfirmDialog
        open={!!statusConfirmItem}
        onOpenChange={(open) => !open && setStatusConfirmItem(null)}
        title={statusConfirmItem?.active ? "Deactivate Supplier?" : "Activate Supplier?"}
        description={`Are you sure you want to ${
          statusConfirmItem?.active ? "deactivate" : "activate"
        } "${statusConfirmItem?.name}"? Deactivated suppliers cannot be assigned to new purchase orders.`}
        confirmLabel={statusConfirmItem?.active ? "Deactivate" : "Activate"}
        variant={statusConfirmItem?.active ? "destructive" : "default"}
        isLoading={isSubmitting}
        onConfirm={handleToggleActive}
      />
    </div>
  );
}
