import { getYarnTypes, getBOMs } from "@/services/master";
import { getSessionUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { MasterTabs } from "../master-tabs";
import { YarnTypesClient } from "./yarn-types-client";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    tab?: string;
  }>;
}

export default async function YarnTypesPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  const userRole = user?.role || Role.BUYER;

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = parseInt(params.pageSize || "10", 10);
  const search = params.search || "";
  const activeTab = params.tab || "yarn";

  const [yarnResult, bomResult] = await Promise.all([
    getYarnTypes({
      page: activeTab === "yarn" ? page : 1,
      pageSize: 50,
      search: activeTab === "yarn" ? search : "",
    }),
    getBOMs({
      page: activeTab === "bom" ? page : 1,
      pageSize: 50,
      search: activeTab === "bom" ? search : "",
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data"
        description="Foundational entities for Everest Textile Mills: Suppliers, Buyers, Machines, Workers, and Yarn/BOM specifications."
      />

      <MasterTabs />

      <YarnTypesClient
        yarnData={yarnResult.data}
        yarnTotal={yarnResult.total}
        bomData={bomResult.data}
        bomTotal={bomResult.total}
        currentPage={page}
        pageSize={pageSize}
        search={search}
        activeTab={activeTab}
        userRole={userRole}
      />
    </div>
  );
}
