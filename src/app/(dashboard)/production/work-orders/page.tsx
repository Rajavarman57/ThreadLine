import { getWorkOrders } from "@/services/production";
import { getSessionUser } from "@/lib/auth/session";
import { Role, ProductionStage, WorkOrderStatus } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { ProductionTabs } from "../production-tabs";
import { WorkOrdersClient } from "./work-orders-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    stage?: string;
    status?: string;
    orderId?: string;
    machineId?: string;
  }>;
}

export default async function WorkOrdersListPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  const userRole = user?.role || Role.BUYER;

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = parseInt(params.pageSize || "15", 10);
  const stage = params.stage as ProductionStage | undefined;
  const status = params.status as WorkOrderStatus | undefined;
  const orderId = params.orderId;
  const machineId = params.machineId;

  const result = await getWorkOrders({
    page,
    pageSize,
    stage,
    status,
    orderId,
    machineId,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manufacturing Work Orders"
        description="Stage-by-stage work orders across spinning, weaving, and dyeing with live machine allocation and output tracking."
      />

      <ProductionTabs />

      <WorkOrdersClient
        initialData={result.data}
        totalCount={result.total}
        currentPage={result.page}
        pageSize={result.pageSize}
        stage={stage}
        status={status}
        userRole={userRole}
      />
    </div>
  );
}
