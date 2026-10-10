import { getMachineBoard } from "@/services/production";
import { getSessionUser } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { ProductionTabs } from "./production-tabs";
import { MachineBoardClient } from "./machine-board-client";

export const dynamic = "force-dynamic";

export default async function ProductionMachineBoardPage() {
  const user = await getSessionUser();
  const userRole = user?.role || Role.BUYER;

  const board = await getMachineBoard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Floor"
        description="Monitor spinning, weaving, and dyeing machines, track active orders and shift progress, and record maintenance."
      />

      <ProductionTabs />

      <MachineBoardClient initialData={board} userRole={userRole} />
    </div>
  );
}
