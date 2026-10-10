import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CircleDollarSign } from "lucide-react";

export default function ExpensesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational & Order Expenses"
        description="Track operational expenses across utility, dyes/chemicals, machine maintenance, and overhead allocations."
      />

      <EmptyState
        icon={CircleDollarSign}
        title="No Expenses Recorded"
        description="Log factory operating expenditures and tie them to customer orders for accurate gross margin reporting."
      />
    </div>
  );
}
