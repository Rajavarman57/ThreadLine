"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, ListChecks, QrCode, BarChart3 } from "lucide-react";

export function QualityTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      title: "Inspection Queue",
      href: "/quality",
      icon: CheckCircle2,
      active: pathname === "/quality",
    },
    {
      title: "Rolls Register",
      href: "/quality/rolls",
      icon: ListChecks,
      active: pathname === "/quality/rolls",
    },
    {
      title: "Defect Analytics",
      href: "/quality/analytics",
      icon: BarChart3,
      active: pathname === "/quality/analytics",
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
