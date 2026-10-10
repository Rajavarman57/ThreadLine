import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMonthlyPnL } from "@/services/finance";
import { PnLClient } from "./pnl-client";
import { FinanceTabs } from "../finance-tabs";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

interface PnLPageProps {
  searchParams: Promise<{
    month?: string;
  }>;
}

export default async function PnLPage({ searchParams }: PnLPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ACCOUNTS") {
    redirect("/finance");
  }

  const params = await searchParams;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const selectedMonth = params.month || currentMonth;

  const pnl = await getMonthlyPnL(selectedMonth);

  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="Monthly Profit & Loss Statement"
        description="Consolidated operating statement with direct material, machine overheads, wages allocation, and prior-month comparative growth."
      />

      <FinanceTabs />

      <PnLClient pnl={pnl} selectedMonth={selectedMonth} />
    </div>
  );
}
