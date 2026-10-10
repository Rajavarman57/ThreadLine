"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { NavGroup } from "./nav-config";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  groups: NavGroup[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ groups, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-md transition-all duration-300 z-30 select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-500/20 shrink-0">
              TL
            </div>
            <div className="truncate">
              <span className="font-bold text-foreground text-sm tracking-tight block">Threadline</span>
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 truncate">
                <Building2 className="size-3 shrink-0 text-indigo-400" />
                Everest Textile Mills
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto size-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-500/20">
            TL
          </div>
        )}

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onToggleCollapse}
          className={cn("text-muted-foreground hover:text-foreground", isCollapsed && "hidden")}
          title="Collapse sidebar"
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {groups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {group.title}
              </h3>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group relative",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed && "justify-center px-0 size-11 mx-auto"
                  )}
                >
                  <Icon className={cn("size-5 shrink-0 transition-colors", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />

                  {!isCollapsed && (
                    <span className="truncate flex-1">{item.title}</span>
                  )}

                  {!isCollapsed && item.badge && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger className="w-full flex justify-center">
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium text-xs">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </div>
        ))}
      </div>

      {/* Collapse Toggle Footer (when collapsed) */}
      {isCollapsed && (
        <div className="p-3 border-t border-border flex justify-center">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            className="text-muted-foreground hover:text-foreground"
            title="Expand sidebar"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </aside>
  );
}
