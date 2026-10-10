import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryTabs } from "../inventory-tabs";
import { DataTable } from "@/components/shared/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Truck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface ReceiptRow {
  id: string;
  qty: number;
  vehicleNo: string | null;
  createdAt: Date;
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

export default async function GoodsReceiptsListPage() {
  const receipts = await prisma.goodsReceipt.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      yarnType: {
        select: { type: true, colour: true, unit: true },
      },
      receivedBy: {
        select: { name: true },
      },
      poLine: {
        select: {
          purchaseOrder: { select: { poNo: true } },
        },
      },
    },
  });

  const formatted: ReceiptRow[] = receipts.map((r) => ({
    id: r.id,
    qty: Number(r.qty),
    vehicleNo: r.vehicleNo,
    createdAt: r.createdAt,
    yarnType: r.yarnType,
    receivedBy: r.receivedBy,
    poLine: r.poLine,
  }));

  const columns: ColumnDef<ReceiptRow>[] = [
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <PageHeader
          title="Goods Receipts History (GRN)"
          description="Inwards warehouse receipts of raw cotton, poly yarns, and deliveries."
        />
        <Link
          href="/inventory/receipts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs shrink-0"
        >
          <Truck className="size-4" />
          Receive New Consignment
        </Link>
      </div>

      <InventoryTabs />

      <DataTable
        columns={columns}
        data={formatted}
        emptyTitle="No Goods Receipts Found"
        emptyDescription="Receive incoming yarn consignments to populate this inwards ledger."
      />
    </div>
  );
}
