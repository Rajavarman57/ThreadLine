import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Truck } from "lucide-react";

export default function DispatchPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispatch & Logistics"
        description="Pack approved rolls, assign transport vehicles and drivers, generate packing slips, and trigger invoice generation."
      />

      <EmptyState
        icon={Truck}
        title="No Dispatches Scheduled"
        description="Create a new dispatch manifest by allocating QC-approved (PASSED) fabric rolls to customer orders."
      />
    </div>
  );
}
