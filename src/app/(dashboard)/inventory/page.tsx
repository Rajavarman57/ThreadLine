import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Boxes, Plus } from "lucide-react";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Raw Material & Inventory"
        description="Monitor yarn lot stock levels, log receipts and issuances through the immutable StockMovement ledger."
      >
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-xs gap-1.5">
          <Plus className="size-4" />
          Receive Yarn Lot
        </Button>
      </PageHeader>

      <EmptyState
        icon={Boxes}
        title="No Inventory Movements Logged"
        description="Receive raw material from suppliers or issue yarn lots to production work orders to begin tracking."
        actionLabel="Receive Inbound Lot"
      />
    </div>
  );
}
