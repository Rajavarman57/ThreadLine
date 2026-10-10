import { getBuyers } from "@/services/master";
import { getSessionUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { MasterTabs } from "../master-tabs";
import { BuyersClient } from "./buyers-client";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
  }>;
}

export default async function BuyersPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  const userRole = user?.role || Role.BUYER;

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = parseInt(params.pageSize || "10", 10);
  const search = params.search || "";

  const result = await getBuyers({
    page,
    pageSize,
    search,
    includeInactive: true,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data"
        description="Foundational entities for Everest Textile Mills: Suppliers, Buyers, Machines, Workers, and Yarn/BOM specifications."
      />

      <MasterTabs />

      <BuyersClient
        initialData={result.data}
        totalCount={result.total}
        currentPage={result.page}
        pageSize={result.pageSize}
        search={search}
        userRole={userRole}
      />
    </div>
  );
}
