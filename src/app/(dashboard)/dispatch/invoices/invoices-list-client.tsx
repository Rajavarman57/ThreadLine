"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InvoiceListItem } from "@/services/payments";
import { InvoiceStatus } from "@prisma/client";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  ArrowRight,
  AlertTriangle,
  Download,
  Filter,
} from "lucide-react";

interface InvoicesListClientProps {
  initialData: {
    items: InvoiceListItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    buyers: Array<{ id: string; name: string }>;
  };
  currentStatus?: InvoiceStatus;
  currentBuyerId?: string;
  currentSearch?: string;
}

export function InvoicesListClient({
  initialData,
  currentStatus,
  currentBuyerId,
  currentSearch = "",
}: InvoicesListClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const [selectedStatus, setSelectedStatus] = useState<string>(
    currentStatus || "ALL"
  );
  const [selectedBuyerId, setSelectedBuyerId] = useState<string>(
    currentBuyerId || "ALL"
  );

  const applyFilters = (newParams: {
    status?: string;
    buyerId?: string;
    search?: string;
    page?: number;
  }) => {
    const params = new URLSearchParams();
    const st = newParams.status !== undefined ? newParams.status : selectedStatus;
    const bId = newParams.buyerId !== undefined ? newParams.buyerId : selectedBuyerId;
    const q = newParams.search !== undefined ? newParams.search : searchTerm;
    const p = newParams.page !== undefined ? newParams.page : 1;

    if (st && st !== "ALL") params.set("status", st);
    if (bId && bId !== "ALL") params.set("buyerId", bId);
    if (q && q.trim().length > 0) params.set("search", q.trim());
    if (p > 1) params.set("page", String(p));

    router.push(`/dispatch/invoices?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ search: searchTerm });
  };

  const columns: ColumnDef<InvoiceListItem>[] = [
    {
      accessorKey: "invoiceNo",
      header: "Invoice No",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Link
            href={`/dispatch/invoices/${row.original.id}`}
            className="font-mono text-xs font-bold text-primary hover:underline"
          >
            {row.original.invoiceNo}
          </Link>
          {row.original.isOverdue30 && (
            <span
              title="Overdue for > 30 days"
              className="inline-flex items-center text-amber-500"
            >
              <AlertTriangle className="size-3.5" />
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "buyerName",
      header: "Buyer / Order",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-xs text-foreground">
            {row.original.buyerName}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="font-mono">{row.original.orderNo}</span>
            <span>•</span>
            <span className="font-mono">{row.original.dispatchNo}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "total",
      header: "Billed Total",
      cell: ({ row }) => (
        <div>
          <div className="font-mono text-xs font-bold text-foreground">
            ₹{row.original.total.toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground">
            {row.original.taxPct}% GST incl.
          </div>
        </div>
      ),
    },
    {
      accessorKey: "paidAmount",
      header: "Paid Amount",
      cell: ({ row }) => (
        <div className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          ₹{row.original.paidAmount.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "outstanding",
      header: "Outstanding",
      cell: ({ row }) => {
        const isZero = row.original.outstanding <= 0;
        return (
          <div>
            <div
              className={`font-mono text-xs font-bold ${
                isZero
                  ? "text-muted-foreground"
                  : row.original.isOverdue30
                  ? "text-red-500 font-extrabold"
                  : "text-amber-500"
              }`}
            >
              ₹{row.original.outstanding.toLocaleString()}
            </div>
            {row.original.isOverdue30 && (
              <span className="text-[10px] font-semibold text-red-500">
                &gt;30 Days Overdue
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "ageDays",
      header: "Age",
      cell: ({ row }) => (
        <span
          className={`text-xs ${
            row.original.isOverdue30
              ? "font-bold text-red-500"
              : "text-muted-foreground"
          }`}
        >
          {row.original.ageDays} days
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const color =
          status === "PAID"
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
            : status === "PARTIAL"
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
            : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20";
        return (
          <span
            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${color}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <a
            href={`/api/invoices/${row.original.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            title="Download PDF"
            className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Download className="size-3.5" />
          </a>
          <Link
            href={`/dispatch/invoices/${row.original.id}`}
            className="inline-flex items-center justify-center size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search invoice, buyer, order..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-10">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              applyFilters({ status: e.target.value });
            }}
            className="h-10 px-3 rounded-lg border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNPAID">UNPAID</option>
            <option value="PARTIAL">PARTIAL</option>
            <option value="PAID">PAID</option>
          </select>

          {/* Buyer Filter */}
          <select
            value={selectedBuyerId}
            onChange={(e) => {
              setSelectedBuyerId(e.target.value);
              applyFilters({ buyerId: e.target.value });
            }}
            className="h-10 px-3 rounded-lg border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary max-w-xs"
          >
            <option value="ALL">All Buyers</option>
            {initialData.buyers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shared DataTable */}
      <DataTable
        columns={columns}
        data={initialData.items}
        serverPagination={{
          pageIndex: initialData.page - 1,
          pageSize: initialData.pageSize,
          pageCount: initialData.totalPages,
          totalCount: initialData.total,
          onPaginationChange: (pagination: PaginationState) => {
            applyFilters({ page: pagination.pageIndex + 1 });
          },
        }}
      />
    </div>
  );
}
