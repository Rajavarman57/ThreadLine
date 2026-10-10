"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calculator,
  TrendingUp,
  Cpu,
  FileText,
} from "lucide-react";

const FINANCE_TABS = [
  {
    label: "Owner Overview",
    href: "/finance",
    icon: LayoutDashboard,
  },
  {
    label: "Order Costing & Margin",
    href: "/finance/costing",
    icon: Calculator,
  },
  {
    label: "Monthly P&L Statement",
    href: "/finance/pnl",
    icon: TrendingUp,
  },
  {
    label: "Machine Utilisation",
    href: "/finance/machines",
    icon: Cpu,
  },
];

export function FinanceTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 border-b border-border pb-3 mb-6">
      {FINANCE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          tab.href === "/finance"
            ? pathname === "/finance"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
