import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Cpu } from "lucide-react";

export default function ProductionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Production Floor"
        description="Monitor spinning, weaving, and dyeing machines, log operator shift output, and generate batch rolls."
      />

      <EmptyState
        icon={Cpu}
        title="No Active Work Orders"
        description="Machine allocation and live output metrics will populate once work orders are scheduled from confirmed orders."
      />
    </div>
  );
}
