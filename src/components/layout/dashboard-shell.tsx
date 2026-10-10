"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { MobileDrawer } from "./mobile-drawer";
import { getFilteredNav } from "./nav-config";
import { SessionUser } from "@/lib/auth/session";

interface DashboardShellProps {
  user: SessionUser;
  children: React.ReactNode;
  lowStockCount?: number;
}

export function DashboardShell({ user, children, lowStockCount = 0 }: DashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const rawGroups = getFilteredNav(user.role);
  const navGroups = rawGroups.map((group) => ({
    ...group,
    items: group.items.map((item) => {
      if (item.href === "/inventory" && lowStockCount > 0) {
        return {
          ...item,
          badge: `${lowStockCount} Low`,
        };
      }
      return item;
    }),
  }));

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop Collapsible Sidebar */}
      <Sidebar
        groups={navGroups}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        groups={navGroups}
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          user={user}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
