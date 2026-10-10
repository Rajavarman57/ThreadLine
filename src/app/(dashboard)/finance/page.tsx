import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOwnerDashboardSummary } from "@/services/finance";
import { OwnerDashboardClient } from "./owner-dashboard-client";
import { FinanceTabs } from "./finance-tabs";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

interface FinancePageProps {
  searchParams: Promise<{
    month?: string;
  }>;
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ACCOUNTS") {
    redirect("/");
  }

  const params = await searchParams;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const selectedMonth = params.month || currentMonth;

  const summary = await getOwnerDashboardSummary(selectedMonth);

  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="Mill Owner & Finance Executive Dashboard"
        description="Real-time commercial operating figures: gross revenues, labor expenditure, outstanding accounts receivable, machinery outputs, and at-risk production orders."
      />

      <FinanceTabs />

      <OwnerDashboardClient
        summary={summary}
        selectedMonth={selectedMonth}
      />
    </div>
  );
}
