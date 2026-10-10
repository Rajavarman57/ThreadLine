import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Database } from "lucide-react";

export default function MasterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Master Data Management"
        description="Configure suppliers, buyers, machines (spinning, weaving, dyeing), yarn types, and Bill of Materials (BOM) ratios."
      />

      <EmptyState
        icon={Database}
        title="Master Records Configured"
        description="Select a master entity category above to view and maintain foundational operational data."
      />
    </div>
  );
}
