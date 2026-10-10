"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Boxes,
  Truck,
  ArrowRightLeft,
  PlusCircle,
  ShoppingCart,
} from "lucide-react";

const INVENTORY_TABS = [
  { name: "Stock Overview", href: "/inventory", icon: Boxes },
  { name: "Goods Receipts", href: "/inventory/receipts", icon: Truck },
  { name: "Purchase Orders", href: "/inventory/purchase-orders", icon: ShoppingCart },
  { name: "Movements Ledger", href: "/inventory/movements", icon: ArrowRightLeft },
];

export function InventoryTabs() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/80 gap-3 pb-1 mb-6">
      <div className="flex gap-2 overflow-x-auto">
        {INVENTORY_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon className="size-4" />
              {tab.name}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/inventory/receipts/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
        >
          <PlusCircle className="size-3.5" />
          Receive Goods (GRN)
        </Link>
      </div>
    </div>
  );
}
