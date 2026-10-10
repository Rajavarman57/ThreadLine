"use client";

import React, { useState } from "react";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { POStatus, Role } from "@prisma/client";
import { updatePOStatusAction } from "../../orders/actions";
import {
  FileText,
  Send,
  Plus,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface PurchaseOrderRow {
  id: string;
  poNo: string;
  status: POStatus;
  createdAt: Date | string;
  supplier: {
    id: string;
    name: string;
    phone: string | null;
  };
  lines: Array<{
    id: string;
    qty: number;
    receivedQty: number;
    rate: number;
    yarnType: {
      type: string;
      colour: string;
      unit: string;
    };
  }>;
}

interface PurchaseOrdersClientProps {
  initialData: PurchaseOrderRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  status?: string;
  userRole: Role;
}

export function PurchaseOrdersClient({
  initialData,
  totalCount,
  currentPage,
  pageSize,
  status = "",
  userRole,
}: PurchaseOrdersClientProps) {
  const router = useRouter();
  const canManage = userRole === Role.ADMIN || userRole === Role.STORE;
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusUpdate = async (poId: string, nextStatus: POStatus) => {
    setUpdatingId(poId);
    try {
      const res = await updatePOStatusAction(poId, nextStatus);
      if (!res.success) throw new Error(res.error);
      toast.success(`PO status updated to ${nextStatus}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const onPaginationChange = (nextPagination: PaginationState) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(nextPagination.pageIndex + 1));
    params.set("pageSize", String(nextPagination.pageSize));
    router.push(`/inventory/purchase-orders?${params.toString()}`);
  };

  const columns: ColumnDef<PurchaseOrderRow>[] = [
    {
      accessorKey: "poNo",
      header: "PO Number",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary shrink-0" />
          <span className="font-mono font-bold text-foreground">
            {row.original.poNo}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "supplier",
      header: "Delivering Supplier",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="size-3.5 text-muted-foreground" />
          <span className="font-medium text-foreground">
            {row.original.supplier.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "lines",
      header: "Yarn Specifications & Inwards Progress",
      cell: ({ row }) => (
        <div className="space-y-1 py-1">
          {row.original.lines.map((l) => (
            <div key={l.id} className="text-xs flex items-center gap-2 font-mono">
              <span className="font-medium text-foreground">
                {l.yarnType.type} ({l.yarnType.colour}):
              </span>
              <span className="text-muted-foreground">
                {l.receivedQty} / {l.qty} {l.yarnType.unit}
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Procurement Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: "Issued Date",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    ...(canManage
      ? [
          {
            id: "actions",
            header: () => <span className="text-right block">Actions</span>,
            cell: ({ row }: { row: { original: PurchaseOrderRow } }) => {
              const po = row.original;
              if (po.status === POStatus.DRAFT) {
                return (
                  <div className="flex items-center justify-end">
                    <Button
                      size="xs"
                      onClick={() => handleStatusUpdate(po.id, POStatus.SENT)}
                      disabled={updatingId === po.id}
                      className="gap-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs"
                    >
                      <Send className="size-3" />
                      Send to Vendor
                    </Button>
                  </div>
                );
              }
              return null;
            },
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={initialData}
        emptyTitle="No Purchase Orders Found"
        emptyDescription="Generate purchase orders to procure raw cotton or polyester yarns from suppliers."
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
