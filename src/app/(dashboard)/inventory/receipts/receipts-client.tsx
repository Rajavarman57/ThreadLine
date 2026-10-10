"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/shared/data-table";

export interface ReceiptItem {
  id: string;
  qty: number;
  vehicleNo: string | null;
  createdAt: string; // ISO string
  yarnType: {
    type: string;
    colour: string;
    unit: string;
  };
  receivedBy: {
    name: string;
  } | null;
  poLine: {
    purchaseOrder: {
      poNo: string;
    };
  } | null;
}

interface ReceiptsClientProps {
  initialData: ReceiptItem[];
}

export function ReceiptsClient({ initialData }: ReceiptsClientProps) {
  const columns: ColumnDef<ReceiptItem>[] = [
    {
      accessorKey: "yarnType",
      header: "Yarn Material Received",
      cell: ({ row }) => (
        <div>
          <span className="font-semibold text-foreground">
            {row.original.yarnType.type}
          </span>
          <span className="ml-2 font-mono text-xs text-muted-foreground">
            ({row.original.yarnType.colour})
          </span>
        </div>
      ),
    },
    {
      accessorKey: "qty",
      header: "Quantity Received",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          +{row.original.qty.toLocaleString()} {row.original.yarnType.unit}
        </span>
      ),
    },
    {
      accessorKey: "vehicleNo",
      header: "Transport Vehicle",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {row.original.vehicleNo || "—"}
        </span>
      ),
    },
    {
      accessorKey: "poLine",
      header: "Purchase Order",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.poLine?.purchaseOrder.poNo ? (
            <span className="px-2 py-0.5 rounded bg-muted border border-border">
              PO #{row.original.poLine.purchaseOrder.poNo}
            </span>
          ) : (
            <span className="text-muted-foreground">Direct Receipt</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: "receivedBy",
      header: "Received By",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.receivedBy?.name || "Store Personnel"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date Inwards",
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
    <DataTable
      columns={columns}
      data={initialData}
      emptyTitle="No Goods Receipts Found"
      emptyDescription="Receive incoming yarn consignments to populate this inwards ledger."
    />
  );
}
