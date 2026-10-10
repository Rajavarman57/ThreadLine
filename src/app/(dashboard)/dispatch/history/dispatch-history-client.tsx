"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DispatchHistoryItem } from "@/services/dispatch";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, Search, ArrowRight, FileText } from "lucide-react";

interface DispatchHistoryClientProps {
  initialData: {
    items: DispatchHistoryItem[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  currentSearch?: string;
}

export function DispatchHistoryClient({
  initialData,
  currentSearch = "",
}: DispatchHistoryClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(currentSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/dispatch/history?search=${encodeURIComponent(searchTerm)}`);
  };

  const columns: ColumnDef<DispatchHistoryItem>[] = [
    {
      accessorKey: "dispatchNo",
      header: "Dispatch No",
      cell: ({ row }) => (
        <Link
          href={`/dispatch/${row.original.id}`}
          className="font-mono text-xs font-bold text-primary hover:underline"
        >
          {row.original.dispatchNo}
        </Link>
      ),
    },
    {
      accessorKey: "orderNo",
      header: "Order / Buyer",
      cell: ({ row }) => (
        <div>
          <div className="font-semibold text-xs text-foreground">
            {row.original.orderNo}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.buyerName}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "vehicleNo",
      header: "Vehicle & Driver",
      cell: ({ row }) => (
        <div>
          <div className="font-mono text-xs font-medium text-foreground">
            {row.original.vehicleNo}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.driver}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "rollCount",
      header: "Quantity",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-xs text-foreground">
            {row.original.rollCount} rolls
          </span>
          <div className="text-xs text-muted-foreground">
            {row.original.totalMetres.toLocaleString()} m
          </div>
        </div>
      ),
    },
    {
      accessorKey: "invoiceNo",
      header: "Invoice",
      cell: ({ row }) => {
        if (!row.original.invoiceNo) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }
        return (
          <div className="flex items-center gap-1.5">
            <FileText className="size-3.5 text-muted-foreground" />
            <span className="font-mono text-xs font-medium">
              {row.original.invoiceNo}
            </span>
            {row.original.invoiceTotal && (
              <span className="text-xs text-muted-foreground">
                (₹{row.original.invoiceTotal.toLocaleString()})
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "dispatchedAt",
      header: "Dispatched At",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.dispatchedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Link
          href={`/dispatch/${row.original.id}`}
          className="inline-flex items-center justify-center size-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="size-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm w-full">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search manifest, vehicle, driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" className="h-10">
            Search
          </Button>
        </form>

        <Link
          href="/dispatch/new"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors h-10"
        >
          <Truck className="size-4" />
          New Dispatch
        </Link>
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
            router.push(
              `/dispatch/history?page=${pagination.pageIndex + 1}&search=${encodeURIComponent(
                searchTerm
              )}`
            );
          },
        }}
      />
    </div>
  );
}
