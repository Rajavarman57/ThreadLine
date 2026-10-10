"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CalendarCheck, DollarSign } from "lucide-react";

const HR_TABS = [
  {
    label: "Daily Attendance & Shifts",
    href: "/hr",
    icon: CalendarCheck,
  },
  {
    label: "Monthly Wages & Register",
    href: "/hr/wages",
    icon: DollarSign,
  },
];

export function HRTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 border-b border-border pb-3 mb-6">
      {HR_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive =
          tab.href === "/hr"
            ? pathname === "/hr"
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
