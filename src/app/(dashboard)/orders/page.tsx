import { getOrders } from "@/services/orders";
import { getSessionUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { OrdersClient } from "./orders-client";
import { OrderStatus, Role } from "@prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    status?: string;
    search?: string;
  }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  const userRole = user?.role || Role.BUYER;

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = parseInt(params.pageSize || "15", 10);
  const status = params.status as OrderStatus | undefined;
  const search = params.search || "";

  const result = await getOrders({
    page,
    pageSize,
    status,
    search,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Orders & Manufacturing Planning"
        description="Booked commercial fabric orders, delivery schedules, material reservation status, and work order progress."
      />

      <OrdersClient
        initialData={result.data}
        totalCount={result.total}
        currentPage={result.page}
        pageSize={result.pageSize}
        status={status}
        search={search}
        userRole={userRole}
      />
    </div>
  );
}
