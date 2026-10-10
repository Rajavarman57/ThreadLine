import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryTabs } from "../inventory-tabs";
import { Truck } from "lucide-react";
import Link from "next/link";
import { ReceiptsClient, ReceiptItem } from "./receipts-client";

export const dynamic = "force-dynamic";

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

  const formatted: ReceiptItem[] = receipts.map((r) => ({
    id: r.id,
    qty: Number(r.qty),
    vehicleNo: r.vehicleNo,
    createdAt: r.createdAt.toISOString(),
    yarnType: r.yarnType,
    receivedBy: r.receivedBy,
    poLine: r.poLine,
  }));

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

      <ReceiptsClient initialData={formatted} />
    </div>
  );
}
