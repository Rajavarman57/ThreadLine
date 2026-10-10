import { PageHeader } from "@/components/shared/page-header";
import { DispatchTabs } from "./dispatch-tabs";
import { getFinishedGoodsSummary } from "@/services/dispatch";
import { FinishedGoodsClient } from "./finished-goods-client";

export const dynamic = "force-dynamic";

export default async function DispatchPage() {
  const summary = await getFinishedGoodsSummary();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispatch & Finished Goods"
        description="Inspect QC-Passed fabric rolls ready for shipment, prepare transport manifests, and issue invoices."
      />

      <DispatchTabs />

      <FinishedGoodsClient summary={summary} />
    </div>
  );
}
