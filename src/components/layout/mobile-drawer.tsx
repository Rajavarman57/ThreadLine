"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { NavGroup } from "./nav-config";
import { Badge } from "@/components/ui/badge";

interface MobileDrawerProps {
  groups: NavGroup[];
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ groups, isOpen, onClose }: MobileDrawerProps) {
  const pathname = usePathname();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="left" className="w-72 p-0 flex flex-col bg-card border-r border-border">
        <SheetHeader className="p-4 border-b border-border text-left">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-500/20">
              TL
            </div>
            <div>
              <SheetTitle className="font-bold text-foreground text-sm tracking-tight">
                Threadline
              </SheetTitle>
              <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <Building2 className="size-3 text-indigo-400" />
                Everest Textile Mills
              </span>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {groups.map((group) => (
            <div key={group.title} className="space-y-1">
              <h3 className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {group.title}
              </h3>

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-5 shrink-0 transition-colors",
                        isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    <span className="truncate flex-1">{item.title}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
