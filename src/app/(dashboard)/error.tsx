"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught by boundary:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-destructive/30 bg-card p-6 shadow-lg text-center space-y-5">
        <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="size-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred while loading this dashboard view."}
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-muted-foreground/70 bg-muted/60 py-1 px-2 rounded-md inline-block">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <RefreshCw className="size-4" />
            Try again
          </Button>

          <Link href="/inventory">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="size-4" />
              Back to Overview
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
