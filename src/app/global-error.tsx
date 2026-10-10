"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error caught by boundary:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground flex items-center justify-center p-6 antialiased">
        <div className="max-w-md w-full rounded-2xl border border-destructive/30 bg-card p-6 shadow-xl text-center space-y-5">
          <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertTriangle className="size-6" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold">Application Error</h2>
            <p className="text-sm text-muted-foreground">
              {error.message || "A critical error occurred while rendering the page."}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-muted-foreground/70 bg-muted/60 py-1 px-2 rounded-md inline-block">
                Digest: {error.digest}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              <RefreshCw className="size-4" />
              Reload Application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
