"use client";

import React, { useState } from "react";
import { QCStatus, Role } from "@prisma/client";
import { markReworkDoneAction } from "../actions";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Eye, RotateCcw, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface RollRegisterRow {
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
  inspectionCount: number;
}

interface RollsRegisterClientProps {
  initialData: RollRegisterRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  qcStatus?: QCStatus;
  userRole: Role;
}

export function RollsRegisterClient({
  initialData,
  totalCount,
  currentPage,
  pageSize,
  qcStatus,
  userRole,
}: RollsRegisterClientProps) {
  const router = useRouter();
  const canManageRework =
    userRole === Role.ADMIN ||
    userRole === Role.SUPERVISOR ||
    userRole === Role.QC;

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: currentPage - 1,
    pageSize,
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
    router.push(`/quality/rolls?${params.toString()}`);
  };

  const handleReworkDone = async (rollNo: string) => {
    try {
      const res = await markReworkDoneAction({ rollNo });
      if (!res.success) throw new Error(res.error);
      toast.success(`Roll #${rollNo} rework marked done and returned to QC queue!`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to mark rework done");
    }
  };

  const columns: ColumnDef<RollRegisterRow>[] = [
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
            title="View roll lineage & traceability"
          >
            <Eye className="size-3.5" />
          </Link>
          <Link
            href={`/quality/rolls/${row.original.rollNo}/label`}
            className="text-muted-foreground hover:text-primary transition-colors"
            title="Print roll barcode label"
          >
            <QrCode className="size-3.5" />
          </Link>
        </div>
      ),
    },
    {
      accessorKey: "order",
      header: "Order & Buyer",
      cell: ({ row }) => (
        <div>
          <span className="font-mono text-xs font-semibold text-foreground">
            PO #{row.original.order.orderNo}
          </span>
          <div className="text-xs text-muted-foreground truncate">
            {row.original.order.buyerName} • {row.original.order.fabricType}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "lengthM",
      header: "Length",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold">
          {row.original.lengthM.toLocaleString()} m
        </span>
      ),
    },
    {
      accessorKey: "machine",
      header: "Dyeing Vessel",
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
      accessorKey: "inspectionCount",
      header: "Inspections",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.inspectionCount} logged
        </span>
      ),
    },
    ...(canManageRework
      ? [
          {
            id: "actions",
            header: () => <span className="text-right block">Actions</span>,
            cell: ({ row }: { row: { original: RollRegisterRow } }) => {
              const r = row.original;
              return (
                <div className="flex items-center justify-end gap-1.5">
                  {r.qcStatus === QCStatus.REWORK && (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleReworkDone(r.rollNo)}
                      className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                    >
                      <RotateCcw className="size-3 mr-1" />
                      Rework Done
                    </Button>
                  )}
                  <Link href={`/quality/rolls/${r.rollNo}`}>
                    <Button variant="ghost" size="xs" className="text-xs">
                      Trace
                    </Button>
                  </Link>
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
          Status:
        </span>
        {["ALL", "PENDING", "PASSED", "REWORK", "REJECTED"].map((st) => (
          <button
            key={st}
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              if (st === "ALL") params.delete("qcStatus");
              else params.set("qcStatus", st);
              params.set("page", "1");
              router.push(`/quality/rolls?${params.toString()}`);
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-xl border transition-colors ${
              (st === "ALL" && !qcStatus) || qcStatus === st
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
        searchKey="rollNo"
        searchPlaceholder="Search master rolls by roll barcode or PO number..."
        emptyTitle="No Fabric Rolls Found"
        emptyDescription="Produce fabric rolls on the dyeing stage to populate the master roll register."
      />
    </div>
  );
}
