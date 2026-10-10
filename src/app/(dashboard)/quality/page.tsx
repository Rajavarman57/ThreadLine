import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { CheckCircle2 } from "lucide-react";

export default function QualityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Quality Control & Inspection"
        description="Inspect finished rolls, log defects, and grade fabric. Strict enforcement: only rolls with PASSED status can be dispatched."
        badge={<StatusBadge status="PASSED" />}
      />

      <EmptyState
        icon={CheckCircle2}
        title="No Rolls Pending Inspection"
        description="Rolls produced on spinning, weaving, and dyeing machines will appear here for QC approval."
      />
    </div>
  );
}
