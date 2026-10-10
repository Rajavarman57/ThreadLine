import { PageHeader } from "@/components/shared/page-header";
import { DispatchTabs } from "../dispatch-tabs";
import { getInvoicesList } from "@/services/payments";
import { InvoicesListClient } from "./invoices-list-client";
import { InvoiceStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface InvoicesPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    buyerId?: string;
    search?: string;
  }>;
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10) || 1;
  const status =
    params.status && Object.values(InvoiceStatus).includes(params.status as InvoiceStatus)
      ? (params.status as InvoiceStatus)
      : undefined;
  const buyerId = params.buyerId || undefined;
  const search = params.search || "";

  const data = await getInvoicesList({
    page,
    pageSize: 10,
    status,
    buyerId,
    search,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices & Receivables"
        description="Monitor commercial invoicing, overdue aging balances (>30 days), payments collection, and export official PDF invoices."
      />

      <DispatchTabs />

      <InvoicesListClient
        initialData={data}
        currentStatus={status}
        currentBuyerId={buyerId}
        currentSearch={search}
      />
    </div>
  );
}
