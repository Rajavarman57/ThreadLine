import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMachineOutput } from "@/services/finance";
import { MachinesClient } from "./machines-client";
import { FinanceTabs } from "../finance-tabs";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

interface MachinesPageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}

export default async function MachinesPage({
  searchParams,
}: MachinesPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ACCOUNTS" && role !== "SUPERVISOR") {
    redirect("/finance");
  }

  const params = await searchParams;
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const fromStr = params.from || thirtyDaysAgo.toISOString().slice(0, 10);
  const toStr = params.to || today.toISOString().slice(0, 10);

  const report = await getMachineOutput(fromStr, toStr);

  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="Machine Utilisation & Output Analytics"
        description="Monitor runtime hours, production volumes, and capacity utilisation percentages across spinning, weaving, and dyeing equipment."
      />

      <FinanceTabs />

      <MachinesClient report={report} fromDate={fromStr} toDate={toStr} />
    </div>
  );
}
