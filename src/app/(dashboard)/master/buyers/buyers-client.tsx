"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Buyer, Role } from "@prisma/client";
import { buyerSchema, BuyerInput } from "@/services/schemas/master";
import {
  createBuyerAction,
  updateBuyerAction,
  toggleBuyerActiveAction,
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
import { Plus, Edit2, Power, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BuyersClientProps {
  initialData: Buyer[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  search: string;
  userRole: Role;
}

export function BuyersClient({
  initialData,
  totalCount,
  currentPage,
  pageSize,
  search,
  userRole,
}: BuyersClientProps) {
  const router = useRouter();
  const isAdmin = userRole === Role.ADMIN;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const [statusConfirmItem, setStatusConfirmItem] = useState<Buyer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BuyerInput>({
    resolver: zodResolver(buyerSchema) as any,
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
    setEditingBuyer(null);
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

  const openEditDialog = (buyer: Buyer) => {
    setEditingBuyer(buyer);
    reset({
      name: buyer.name,
      contactPerson: buyer.contactPerson || "",
      email: buyer.email || "",
      phone: buyer.phone || "",
      address: buyer.address || "",
      active: buyer.active,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: BuyerInput) => {
    setIsSubmitting(true);
    try {
      if (editingBuyer) {
        const res = await updateBuyerAction(editingBuyer.id, data);
        if (!res.success) throw new Error(res.error);
        toast.success(`Buyer "${data.name}" updated successfully`);
      } else {
        const res = await createBuyerAction(data);
        if (!res.success) throw new Error(res.error);
        toast.success(`Buyer "${data.name}" registered successfully`);
      }
      setDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save buyer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!statusConfirmItem) return;
    setIsSubmitting(true);
    try {
      const res = await toggleBuyerActiveAction(
        statusConfirmItem.id,
        !statusConfirmItem.active
      );
      if (!res.success) throw new Error(res.error);
      toast.success(
        `Buyer "${statusConfirmItem.name}" marked as ${
          statusConfirmItem.active ? "inactive" : "active"
        }`
      );
      setStatusConfirmItem(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update buyer status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onPaginationChange = (nextPagination: PaginationState) => {
    const params = new URLSearchParams();
    params.set("page", String(nextPagination.pageIndex + 1));
    params.set("pageSize", String(nextPagination.pageSize));
    if (search) params.set("search", search);
    router.push(`/master/buyers?${params.toString()}`);
  };

  const handleSearch = (term: string) => {
    const params = new URLSearchParams();
    if (term) params.set("search", term);
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    router.push(`/master/buyers?${params.toString()}`);
  };

  const columns: ColumnDef<Buyer>[] = [
    {
      accessorKey: "name",
      header: "Buyer / Brand",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-muted-foreground shrink-0" />
          <span className="font-medium text-foreground">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "contactPerson",
      header: "Representative",
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
            cell: ({ row }: { row: { original: Buyer } }) => {
              const buyer = row.original;
              return (
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEditDialog(buyer)}
                    title="Edit buyer"
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setStatusConfirmItem(buyer)}
                    title={buyer.active ? "Deactivate" : "Activate"}
                    className={
                      buyer.active
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
            placeholder="Search buyers..."
            defaultValue={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full sm:w-72 h-9 text-sm rounded-xl"
          />
        </div>

        {isAdmin && (
          <Button onClick={openCreateDialog} size="sm" className="gap-2 rounded-xl">
            <Plus className="size-4" />
            Add Buyer
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={initialData}
        emptyTitle="No Buyers Found"
        emptyDescription="Register your commercial customers and apparel brands to place textile orders."
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
              {editingBuyer ? "Edit Buyer" : "Register New Buyer"}
            </DialogTitle>
            <DialogDescription>
              Configure commercial apparel brand and buyer client accounts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="buyer-name">Buyer / Brand Name *</Label>
              <Input
                id="buyer-name"
                placeholder="e.g., Raymond Apparels Ltd."
                {...register("name")}
              />
              {errors.name && (
                <p className="text-destructive text-xs">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="buyer-contact">Representative Contact</Label>
              <Input
                id="buyer-contact"
                placeholder="e.g., Senthil Nathan"
                {...register("contactPerson")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="buyer-email">Email Address</Label>
                <Input
                  id="buyer-email"
                  type="email"
                  placeholder="orders@brand.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-destructive text-xs">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="buyer-phone">Phone Number</Label>
                <Input
                  id="buyer-phone"
                  placeholder="+91 94432 12345"
                  {...register("phone")}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="buyer-address">Registered Business Address</Label>
              <Input
                id="buyer-address"
                placeholder="e.g., Tirupur Garment Complex, Block 4"
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
                {isSubmitting ? "Saving..." : editingBuyer ? "Save Changes" : "Create Buyer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* STATUS TOGGLE CONFIRMATION */}
      <ConfirmDialog
        open={!!statusConfirmItem}
        onOpenChange={(open) => !open && setStatusConfirmItem(null)}
        title={statusConfirmItem?.active ? "Deactivate Buyer?" : "Activate Buyer?"}
        description={`Are you sure you want to ${
          statusConfirmItem?.active ? "deactivate" : "activate"
        } "${statusConfirmItem?.name}"? Inactive buyers cannot be selected on new fabric production orders.`}
        confirmLabel={statusConfirmItem?.active ? "Deactivate" : "Activate"}
        variant={statusConfirmItem?.active ? "destructive" : "default"}
        isLoading={isSubmitting}
        onConfirm={handleToggleActive}
      />
    </div>
  );
}
