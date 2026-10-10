import { PageHeader } from "@/components/shared/page-header";
import { DispatchTabs } from "../dispatch-tabs";
import { getDispatchHistory } from "@/services/dispatch";
import { DispatchHistoryClient } from "./dispatch-history-client";

export const dynamic = "force-dynamic";

interface DispatchHistoryPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

export default async function DispatchHistoryPage({
  searchParams,
}: DispatchHistoryPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10) || 1;
  const search = params.search || "";

  const data = await getDispatchHistory({
    page,
    pageSize: 10,
    search,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispatch History & Manifests"
        description="Search past shipments, vehicle manifests, driver assignments, and linked invoices."
      />

      <DispatchTabs />

      <DispatchHistoryClient initialData={data} currentSearch={search} />
    </div>
  );
}
