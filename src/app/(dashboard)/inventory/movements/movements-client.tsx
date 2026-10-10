"use client";

import React from "react";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { StockMovementReason } from "@prisma/client";
import { ArrowRightLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export interface StockMovementRow {
  id: string;
  qty: number;
  reason: StockMovementReason;
  refType: string | null;
  refId: string | null;
  note: string | null;
  createdAt: Date | string;
  yarnType: {
    id: string;
    type: string;
    colour: string;
    unit: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface MovementsLedgerClientProps {
  initialData: StockMovementRow[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  yarnTypeId?: string;
  reason?: string;
  yarnTypes: Array<{ id: string; type: string; colour: string }>;
}

export function MovementsLedgerClient({
  initialData,
  totalCount,
  currentPage,
  pageSize,
  yarnTypeId = "",
  reason = "",
  yarnTypes,
}: MovementsLedgerClientProps) {
  const router = useRouter();

  const handleFilterChange = (newYarn: string, newReason: string) => {
    const params = new URLSearchParams();
    if (newYarn) params.set("yarnTypeId", newYarn);
    if (newReason) params.set("reason", newReason);
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    router.push(`/inventory/movements?${params.toString()}`);
  };

  const onPaginationChange = (nextPagination: PaginationState) => {
    const params = new URLSearchParams();
    if (yarnTypeId) params.set("yarnTypeId", yarnTypeId);
    if (reason) params.set("reason", reason);
    params.set("page", String(nextPagination.pageIndex + 1));
    params.set("pageSize", String(nextPagination.pageSize));
    router.push(`/inventory/movements?${params.toString()}`);
  };

  const columns: ColumnDef<StockMovementRow>[] = [
    {
      accessorKey: "yarnType",
      header: "Yarn Material",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="size-4 text-muted-foreground shrink-0" />
          <span className="font-semibold text-foreground">
            {row.original.yarnType.type}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            ({row.original.yarnType.colour})
          </span>
        </div>
      ),
    },
    {
      accessorKey: "reason",
      header: "Movement Nature",
      cell: ({ row }) => {
        const r = row.original.reason;
        return <StatusBadge status={r} />;
      },
    },
    {
      accessorKey: "qty",
      header: "Quantity Delta",
      cell: ({ row }) => {
        const qty = row.original.qty;
        const unit = row.original.yarnType.unit;
        const isPos = qty > 0;
        const isNeg = qty < 0;

        return (
          <span
            className={`font-mono text-sm font-semibold ${
              isPos
                ? "text-emerald-600 dark:text-emerald-400"
                : isNeg
                ? "text-destructive"
                : "text-foreground"
            }`}
          >
            {isPos ? `+${qty.toLocaleString()}` : qty.toLocaleString()} {unit}
          </span>
        );
      },
    },
    {
      accessorKey: "note",
      header: "Audit Note & Reference",
      cell: ({ row }) => (
        <div>
          <span className="text-xs text-foreground block max-w-sm truncate">
            {row.original.note || "—"}
          </span>
          {row.original.refType && (
            <span className="text-[11px] font-mono text-muted-foreground">
              Ref: {row.original.refType}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "createdBy",
      header: "Authorized By",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.createdBy?.name || "System Automated"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters Header */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <select
          value={yarnTypeId}
          onChange={(e) => handleFilterChange(e.target.value, reason)}
          className="w-full sm:w-64 h-9 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Yarn Types</option>
          {yarnTypes.map((y) => (
            <option key={y.id} value={y.id}>
              {y.type} ({y.colour})
            </option>
          ))}
        </select>

        <select
          value={reason}
          onChange={(e) => handleFilterChange(yarnTypeId, e.target.value)}
          className="w-full sm:w-48 h-9 rounded-xl border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Movement Types</option>
          <option value={StockMovementReason.RECEIPT}>RECEIPT (+)</option>
          <option value={StockMovementReason.ISSUE}>ISSUE (-)</option>
          <option value={StockMovementReason.ADJUST}>ADJUST (±)</option>
          <option value={StockMovementReason.RESERVE}>RESERVE (+)</option>
          <option value={StockMovementReason.RELEASE}>RELEASE (+)</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={initialData}
        emptyTitle="No Movements Found"
        emptyDescription="Transactions will appear here as yarn deliveries, floor issues, and reservations are recorded."
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
