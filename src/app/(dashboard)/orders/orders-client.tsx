"use client";

import React, { useState } from "react";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { OrderStatus, Role } from "@prisma/client";
import {
  ClipboardList,
  Plus,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface OrderRow {
  id: string;
  orderNo: string;
  fabricType: string;
  colour: string;
  qtyMetres: number;
  ratePerMetre: number;
  deadline: Date | string;
  status: OrderStatus;
  createdAt: Date | string;
  awaitingMaterial: boolean;
  buyer: {
    id: string;
    name: string;
  };
  _count: {
    workOrders: number;
    rolls: number;
    dispatches: number;
  };
}

interface OrdersClientProps {
  initialData: OrderRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  status?: string;
  search?: string;
  userRole: Role;
}

export function OrdersClient({
  initialData,
  totalCount,
  currentPage,
  pageSize,
  status = "",
  search = "",
  userRole,
}: OrdersClientProps) {
  const router = useRouter();
  const canCreate = userRole === Role.ADMIN || userRole === Role.ACCOUNTS;

  const [searchTerm, setSearchTerm] = useState(search);

  const handleFilter = (newStatus: string, term: string) => {
    const params = new URLSearchParams();
    if (newStatus) params.set("status", newStatus);
    if (term) params.set("search", term);
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    router.push(`/orders?${params.toString()}`);
  };

  const onPaginationChange = (nextPagination: PaginationState) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    params.set("page", String(nextPagination.pageIndex + 1));
    params.set("pageSize", String(nextPagination.pageSize));
    router.push(`/orders?${params.toString()}`);
  };

  const columns: ColumnDef<OrderRow>[] = [
    {
      accessorKey: "orderNo",
      header: "Order Number",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-primary shrink-0" />
          <Link
            href={`/orders/${row.original.id}`}
            className="font-mono font-bold text-foreground hover:underline"
          >
            {row.original.orderNo}
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "buyer",
      header: "Buyer / Brand",
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.buyer.name}
        </span>
      ),
    },
    {
      accessorKey: "fabricType",
      header: "Fabric Quality & Shade",
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-foreground block">
            {row.original.fabricType}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {row.original.colour}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "qtyMetres",
      header: "Ordered Volume",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold">
          {row.original.qtyMetres.toLocaleString()} m
        </span>
      ),
    },
    {
      accessorKey: "deadline",
      header: "Delivery Deadline",
      cell: ({ row }) => {
        const deadline = new Date(row.original.deadline);
        const today = new Date();
        const diffDays = Math.ceil(
          (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        const isPast = diffDays < 0;
        const isDueSoon = diffDays >= 0 && diffDays <= 5;
        const isDone =
          row.original.status === OrderStatus.DISPATCHED ||
          row.original.status === OrderStatus.READY;

        return (
          <div className="flex items-center gap-1.5">
            {!isDone && isPast && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                <AlertCircle className="size-3" />
                Overdue
              </span>
            )}
            {!isDone && isDueSoon && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md">
                <Clock className="size-3" />
                Due in {diffDays}d
              </span>
            )}
            <span className="text-xs font-mono text-muted-foreground">
              {deadline.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status & Materials",
      cell: ({ row }) => {
        const st = row.original.status;
        const awaiting = row.original.awaitingMaterial;

        return (
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={st} />
            {awaiting && (
              <span className="text-[10px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                Awaiting Material
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="text-right block">Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end">
          <Link
            href={`/orders/${row.original.id}`}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="View Order Details"
          >
            <Eye className="size-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Input
            placeholder="Search order number, buyer..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handleFilter(status, e.target.value);
            }}
            className="w-full sm:w-64 h-9 text-sm rounded-xl"
          />

          <select
            value={status}
            onChange={(e) => handleFilter(e.target.value, searchTerm)}
            className="w-full sm:w-44 h-9 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value={OrderStatus.CONFIRMED}>CONFIRMED</option>
            <option value={OrderStatus.IN_PRODUCTION}>IN_PRODUCTION</option>
            <option value={OrderStatus.QC}>QC</option>
            <option value={OrderStatus.READY}>READY</option>
            <option value={OrderStatus.DISPATCHED}>DISPATCHED</option>
            <option value={OrderStatus.CANCELLED}>CANCELLED</option>
          </select>
        </div>

        {canCreate && (
          <Link
            href="/orders/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs shrink-0"
          >
            <Plus className="size-4" />
            New Customer Order
          </Link>
        )}
      </div>

      <DataTable
        columns={columns}
        data={initialData}
        emptyTitle="No Orders Found"
        emptyDescription="Book your first apparel fabric production order to begin loom scheduling."
        serverPagination={{
          pageIndex: currentPage - 1,
          pageSize,
          pageCount: Math.ceil(totalCount / pageSize) || 1,
          totalCount,
          onPaginationChange,
        }}
      />
    </div>
  );
}
