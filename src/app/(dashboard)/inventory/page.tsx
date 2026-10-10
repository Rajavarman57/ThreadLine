import { getStockSummary } from "@/services/inventory";
import { getSessionUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryTabs } from "./inventory-tabs";
import { InventoryClient } from "./inventory-client";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const user = await getSessionUser();
  const userRole = user?.role || Role.BUYER;

  const summaries = await getStockSummary();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Raw Material & Yarn Inventory"
        description="Live stock ledger, material reservations for customer orders, and warehouse health thresholds."
      />

      <InventoryTabs />

      <InventoryClient initialData={summaries} userRole={userRole} />
    </div>
  );
}
