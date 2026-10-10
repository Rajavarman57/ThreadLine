import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ReceiptText } from "lucide-react";

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & Invoicing"
        description="Review generated buyer invoices, reconcile payments, calculate production cost breakdowns, and monitor monthly P&L."
      />

      <EmptyState
        icon={ReceiptText}
        title="No Invoices Generated"
        description="Invoices are automatically created upon dispatch finalization and will appear here for accounts reconciliation."
      />
    </div>
  );
}
