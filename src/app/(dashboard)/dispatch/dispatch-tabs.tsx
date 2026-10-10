"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PackageCheck, History, PlusCircle } from "lucide-react";

export function DispatchTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      title: "Finished Goods Ready",
      href: "/dispatch",
      icon: PackageCheck,
      active: pathname === "/dispatch",
    },
    {
      title: "New Dispatch",
      href: "/dispatch/new",
      icon: PlusCircle,
      active: pathname.startsWith("/dispatch/new"),
    },
    {
      title: "Dispatch History",
      href: "/dispatch/history",
      icon: History,
      active: pathname === "/dispatch/history",
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
