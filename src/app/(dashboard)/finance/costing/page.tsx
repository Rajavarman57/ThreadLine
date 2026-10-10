import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllOrdersCosting } from "@/services/finance";
import { CostingClient } from "./costing-client";
import { FinanceTabs } from "../finance-tabs";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

export default async function CostingPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ACCOUNTS") {
    redirect("/finance");
  }

  const costings = await getAllOrdersCosting();

  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="Order Costing & Margin Analysis"
        description="Comprehensive manufacturing cost allocation across raw yarn consumption, machine hourly overheads, and shift labor wages."
      />

      <FinanceTabs />

      <CostingClient costings={costings} />
    </div>
  );
}
