"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Truck,
  Users2,
  Cpu,
  HardHat,
  Layers,
} from "lucide-react";

import { Role } from "@prisma/client";
import { ResetSampleDataButton } from "./reset-sample-data-button";

const MASTER_TABS = [
  { name: "Suppliers", href: "/master/suppliers", icon: Truck },
  { name: "Buyers", href: "/master/buyers", icon: Users2 },
  { name: "Machines", href: "/master/machines", icon: Cpu },
  { name: "Workers", href: "/master/workers", icon: HardHat },
  { name: "Yarn & BOM", href: "/master/yarn-types", icon: Layers },
];

interface MasterTabsProps {
  userRole?: Role;
}

export function MasterTabs({ userRole }: MasterTabsProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/80 gap-2 pb-1 mb-6">
      <div className="flex gap-2 overflow-x-auto">
      {MASTER_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          pathname === tab.href ||
          (tab.href === "/master/suppliers" && pathname === "/master");

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
      <ResetSampleDataButton userRole={userRole} />
    </div>
  );
}
