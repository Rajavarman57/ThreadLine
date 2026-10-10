import { getPurchaseOrders } from "@/services/procurement";
import { getSessionUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryTabs } from "../inventory-tabs";
import { PurchaseOrdersClient } from "./purchase-orders-client";
import { POStatus, Role } from "@prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    status?: string;
  }>;
}

export default async function PurchaseOrdersPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  const userRole = user?.role || Role.BUYER;

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = parseInt(params.pageSize || "15", 10);
  const status = params.status as POStatus | undefined;

  const result = await getPurchaseOrders({
    page,
    pageSize,
    status,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders & Procurement"
        description="Supplier purchase orders, inbound goods tracking, and yarn procurement status."
      />

      <InventoryTabs />

      <PurchaseOrdersClient
        initialData={result.data}
        totalCount={result.total}
        currentPage={result.page}
        pageSize={result.pageSize}
        status={status}
        userRole={userRole}
      />
    </div>
  );
}
