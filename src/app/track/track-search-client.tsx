"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function TrackSearchClient() {
  const router = useRouter();
  const [orderNo, setOrderNo] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNo.trim()) return;
    router.push(`/track/${orderNo.trim()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-md w-full mx-auto">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Enter Order Number (e.g. ORD-2026-001)..."
          value={orderNo}
          onChange={(e) => setOrderNo(e.target.value)}
          className="pl-9 h-10 text-xs"
          required
        />
      </div>
      <Button type="submit" size="sm" className="h-10 px-4 text-xs font-semibold">
        Track
      </Button>
    </form>
  );
}
