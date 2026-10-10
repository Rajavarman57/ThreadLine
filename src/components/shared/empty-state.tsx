import React from "react";
import { FolderOpen, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  actionLabel,
  onAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-border bg-card/40 backdrop-blur-xs",
        className
      )}
    >
      <div className="size-12 rounded-2xl bg-muted/60 border border-border flex items-center justify-center text-muted-foreground mb-4 shadow-xs">
        <Icon className="size-6" />
      </div>

      <h3 className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
        {title}
      </h3>

      {description && (
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <div className="mt-5">
          <Button onClick={onAction} size="sm" className="shadow-xs">
            {actionLabel}
          </Button>
        </div>
      )}

      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
