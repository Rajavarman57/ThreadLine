import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus } from "lucide-react";

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Orders & Planning"
        description="Manage sales orders, check BOM yarn feasibility, schedule spinning/weaving/dyeing, and track order fulfillment."
      >
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs gap-1.5">
          <Plus className="size-4" />
          Create Order
        </Button>
      </PageHeader>

      <EmptyState
        icon={ClipboardList}
        title="No Orders Registered Yet"
        description="Orders placed by buyers or logged by sales staff will appear here with real-time manufacturing stage progress."
        actionLabel="Create First Order"
      />
    </div>
  );
}
