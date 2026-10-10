import { getRollsRegister } from "@/services/quality";
import { getSessionUser } from "@/lib/auth/session";
import { Role, QCStatus } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { QualityTabs } from "../quality-tabs";
import { RollsRegisterClient } from "./rolls-register-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    orderId?: string;
    machineId?: string;
    qcStatus?: string;
    search?: string;
  }>;
}

export default async function RollsRegisterPage({ searchParams }: PageProps) {
  const user = await getSessionUser();
  const userRole = user?.role || Role.BUYER;

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const pageSize = parseInt(params.pageSize || "15", 10);
  const orderId = params.orderId;
  const machineId = params.machineId;
  const qcStatus = params.qcStatus as QCStatus | undefined;
  const search = params.search;

  const result = await getRollsRegister({
    page,
    pageSize,
    orderId,
    machineId,
    qcStatus,
    search,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fabric Rolls Register"
        description="Master ledger of all manufactured rolls across spinning, weaving, and dyeing with complete inspection history."
      />

      <QualityTabs />

      <RollsRegisterClient
        initialData={result.data}
        totalCount={result.total}
        currentPage={result.page}
        pageSize={result.pageSize}
        qcStatus={qcStatus}
        userRole={userRole}
      />
    </div>
  );
}
