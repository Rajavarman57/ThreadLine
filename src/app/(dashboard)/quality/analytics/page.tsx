import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getDefectAnalytics } from "@/services/analytics";
import { AnalyticsClient } from "./analytics-client";
import { QualityTabs } from "../quality-tabs";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

interface AnalyticsPageProps {
  searchParams: Promise<{
    days?: string;
  }>;
}

export default async function QualityAnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "QC" && role !== "SUPERVISOR" && role !== "ADMIN") {
    redirect("/quality");
  }

  const params = await searchParams;
  const days = parseInt(params.days || "30", 10);
  const analytics = await getDefectAnalytics(days);

  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="Quality Control & Defect Analytics"
        description="Comprehensive analysis of defect categories, loom/spindle correlation, shift operator trends, and rolling weekly pass rates."
      />

      <QualityTabs />

      <AnalyticsClient analytics={analytics} selectedDays={days} />
    </div>
  );
}
