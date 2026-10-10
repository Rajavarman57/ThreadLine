import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMonthlyWages } from "@/services/hr";
import { WagesClient } from "./wages-client";
import { HRTabs } from "../hr-tabs";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

interface WagesPageProps {
  searchParams: Promise<{
    month?: string;
  }>;
}

export default async function WagesPage({ searchParams }: WagesPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const canFinalise = role === "ADMIN" || role === "ACCOUNTS";

  const params = await searchParams;
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const selectedMonth = params.month || currentMonthStr;

  const wagesData = await getMonthlyWages(selectedMonth);

  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="Monthly Wages & Payroll Register"
        description="Compute gross wages based on active worker attendance, daily rates, and overtime hours. Finalise monthly records for accounts lock."
      />

      <HRTabs />

      <WagesClient
        initialData={wagesData}
        selectedMonth={selectedMonth}
        canFinalise={canFinalise}
      />
    </div>
  );
}
