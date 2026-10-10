"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Bell, Check, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationItem } from "@/services/notifications";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function NotificationBell() {
  const { data, mutate } = useSWR<{
    notifications: NotificationItem[];
    unreadCount: number;
  }>("/api/notifications", fetcher, {
    refreshInterval: 120000, // Polling every 120 seconds
    revalidateOnFocus: true,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  async function handleMarkAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      mutate(
        {
          notifications: notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        },
        false
      );
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark notifications as read");
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      mutate(
        {
          notifications: notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, unreadCount - 1),
        },
        false
      );
    } catch {}
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground relative rounded-xl"
            title="Notifications"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 p-2 rounded-xl shadow-lg border border-border"
      >
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-border">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y divide-border py-1">
          {notifications.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground">
              No new alerts or notifications.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-2.5 hover:bg-muted/50 transition-colors flex items-start justify-between gap-2 text-xs ${
                  !n.read ? "bg-muted/30 font-medium" : "opacity-80"
                }`}
              >
                <div className="space-y-1 flex-1">
                  <p className="text-foreground leading-snug">{n.message}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={() => handleMarkRead(n.id)}
                        className="text-primary hover:underline flex items-center gap-0.5"
                      >
                        View Details <ExternalLink className="size-2.5" />
                      </Link>
                    )}
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
                    title="Mark as read"
                  >
                    <Check className="size-3" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
