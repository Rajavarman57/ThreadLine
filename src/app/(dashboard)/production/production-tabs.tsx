"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, CalendarCheck, Layers } from "lucide-react";

export function ProductionTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      title: "Machine Board",
      href: "/production",
      icon: Cpu,
      active: pathname === "/production",
    },
    {
      title: "Plan Production",
      href: "/production/plan",
      icon: CalendarCheck,
      active: pathname === "/production/plan",
    },
    {
      title: "Work Orders",
      href: "/production/work-orders",
      icon: Layers,
      active: pathname.startsWith("/production/work-orders"),
    },
  ];

  return (
    <div className="flex border-b border-border space-x-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab.active
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
          >
            <Icon className="size-4" />
            {tab.title}
          </Link>
        );
      })}
    </div>
  );
}
