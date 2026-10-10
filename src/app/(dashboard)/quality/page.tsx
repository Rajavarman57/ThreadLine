import { getQCQueue, getQCKpiSummary } from "@/services/quality";
import { getSessionUser } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { QualityTabs } from "./quality-tabs";
import { QCQueueClient } from "./qc-queue-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    orderId?: string;
    machineId?: string;
    search?: string;
  }>;
}

export default async function QualityInspectionQueuePage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  const userRole = user?.role || Role.BUYER;

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = parseInt(params.pageSize || "15", 10);
  const orderId = params.orderId;
  const machineId = params.machineId;
  const search = params.search;

  const [kpis, queueResult] = await Promise.all([
    getQCKpiSummary(),
    getQCQueue({
      page,
      pageSize,
      orderId,
      machineId,
      search,
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quality Control & Inspection Queue"
        description="Inspect finished rolls, log defects, and grade fabric. Strict enforcement: only rolls with PASSED status can be dispatched."
      />

      <QualityTabs />

      <QCQueueClient
        initialData={queueResult.data}
        totalCount={queueResult.total}
        currentPage={queueResult.page}
        pageSize={queueResult.pageSize}
        kpis={kpis}
        userRole={userRole}
        search={search}
      />
    </div>
  );
}
