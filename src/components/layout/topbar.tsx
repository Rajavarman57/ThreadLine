"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Bell, 
  Menu, 
  LogOut, 
  User, 
  ChevronRight, 
  ShieldCheck,
  Building2 
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SessionUser } from "@/lib/auth/session";

interface TopbarProps {
  user: SessionUser;
  onOpenMobileMenu: () => void;
}

export function Topbar({ user, onOpenMobileMenu }: TopbarProps) {
  const pathname = usePathname();

  // Generate breadcrumbs from pathname
  const pathSegments = pathname.split("/").filter(Boolean);
  const breadcrumbItems = pathSegments.map((segment, idx) => {
    const href = "/" + pathSegments.slice(0, idx + 1).join("/");
    const formatted = segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = idx === pathSegments.length - 1;

    return { title: formatted, href, isLast };
  });

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.slice(0, 2).toUpperCase() || "TL";

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onOpenMobileMenu}
          className="md:hidden text-muted-foreground hover:text-foreground"
        >
          <Menu className="size-5" />
        </Button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
          <Link href="/orders" className="hover:text-foreground transition-colors font-medium">
            Dashboard
          </Link>
          {breadcrumbItems.map((item) => (
            <div key={item.href} className="flex items-center gap-1.5">
              <ChevronRight className="size-3.5 text-muted-foreground/60" />
              {item.isLast ? (
                <span className="font-semibold text-foreground">{item.title}</span>
              ) : (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.title}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right: Notifications & User Menu */}
      <div className="flex items-center gap-3">
        {/* Organisation Pill on larger screens */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 border border-border text-[11px] font-medium text-muted-foreground">
          <Building2 className="size-3 text-indigo-400" />
          <span>Everest Textile Mills</span>
        </div>

        {/* Notification Bell Placeholder */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground relative rounded-xl"
            title="Notifications"
          >
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-2 bg-indigo-500 rounded-full" />
          </Button>
        </div>

        {/* User Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 pl-2 pr-3 py-1.5 h-auto rounded-xl hover:bg-muted transition-all outline-none">
            <Avatar className="size-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-semibold">
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-foreground leading-tight">
                {user.name || user.email?.split("@")[0]}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {user.role}
              </span>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
            <DropdownMenuLabel className="font-normal px-2 py-1.5">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none text-foreground">{user.name || "Staff Member"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                <div className="pt-1">
                  <Badge variant="outline" className="text-[10px] font-mono border-indigo-500/30 text-indigo-400 bg-indigo-500/10">
                    <ShieldCheck className="size-3 mr-1" />
                    Role: {user.role}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-xs">
              <Link href="/orders" className="flex items-center gap-2 w-full">
                <User className="size-3.5" />
                Operational Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-destructive focus:text-destructive cursor-pointer text-xs flex items-center gap-2"
            >
              <LogOut className="size-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
