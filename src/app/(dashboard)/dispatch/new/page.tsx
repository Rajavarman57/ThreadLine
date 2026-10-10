import { PageHeader } from "@/components/shared/page-header";
import { DispatchTabs } from "../dispatch-tabs";
import { getFinishedGoodsSummary, getOrderForDispatch } from "@/services/dispatch";
import { NewDispatchClient } from "./new-dispatch-client";

export const dynamic = "force-dynamic";

interface NewDispatchPageProps {
  searchParams: Promise<{
    orderId?: string;
  }>;
}

export default async function NewDispatchPage({ searchParams }: NewDispatchPageProps) {
  const params = await searchParams;
  const summary = await getFinishedGoodsSummary();

  const ordersList = summary.orders.map((o) => ({
    id: o.orderId,
    orderNo: o.orderNo,
    buyerName: o.buyerName,
    fabricType: o.fabricType,
    colour: o.colour,
    ratePerMetre: o.ratePerMetre,
    availableRollCount: o.rollCount,
  }));

  const activeOrderId = params.orderId || (ordersList.length > 0 ? ordersList[0].id : undefined);

  let selectedOrderData = null;
  if (activeOrderId) {
    try {
      selectedOrderData = await getOrderForDispatch(activeOrderId);
    } catch {
      selectedOrderData = null;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Dispatch Manifest"
        description="Select approved fabric rolls, assign carrier logistics, and generate an immediate sales invoice."
      />

      <DispatchTabs />

      <NewDispatchClient
        ordersList={ordersList}
        selectedOrderData={selectedOrderData}
        initialOrderId={activeOrderId}
      />
    </div>
  );
}
