import { getStockMovementsLedger } from "@/services/inventory";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryTabs } from "../inventory-tabs";
import { MovementsLedgerClient } from "./movements-client";
import { StockMovementReason } from "@prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    yarnTypeId?: string;
    reason?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function MovementsLedgerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = parseInt(params.pageSize || "15", 10);
  const yarnTypeId = params.yarnTypeId;
  const reason = params.reason as StockMovementReason | undefined;
  const startDate = params.startDate;
  const endDate = params.endDate;

  const [ledger, yarnTypes] = await Promise.all([
    getStockMovementsLedger({
      page,
      pageSize,
      yarnTypeId,
      reason,
      startDate,
      endDate,
    }),
    prisma.yarnType.findMany({
      select: { id: true, type: true, colour: true },
      orderBy: [{ type: "asc" }, { colour: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock Movements Ledger"
        description="Append-only audited transaction log tracking all physical receipts, floor issues, adjustments, and reservations."
      />

      <InventoryTabs />

      <MovementsLedgerClient
        initialData={ledger.data}
        totalCount={ledger.total}
        currentPage={ledger.page}
        pageSize={ledger.pageSize}
        yarnTypeId={yarnTypeId}
        reason={reason}
        yarnTypes={yarnTypes}
      />
    </div>
  );
}
