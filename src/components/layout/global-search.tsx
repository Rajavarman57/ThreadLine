"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Package, Layers, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchResultItem } from "@/services/search";

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setIsOpen(true);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(href: string) {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs hidden md:block">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Global search orders, rolls, buyers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          className="h-8 pl-8 pr-8 text-xs rounded-lg bg-muted/40 border-border"
        />
        {isLoading && (
          <Loader2 className="absolute right-2.5 top-2.5 size-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 text-xs">
          {results.length === 0 ? (
            <div className="p-3 text-center text-muted-foreground">
              No matching records found.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-border py-1">
              {results.map((item, idx) => {
                const Icon =
                  item.type === "order"
                    ? Package
                    : item.type === "roll"
                    ? Layers
                    : Building2;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(item.href)}
                    className="w-full text-left p-2.5 hover:bg-muted/50 transition-colors flex items-center gap-2.5"
                  >
                    <div className="size-6 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <Icon className="size-3 text-muted-foreground" />
                    </div>
                    <div className="flex-1 truncate">
                      <span className="font-semibold text-foreground block truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {item.subtitle}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground/60 px-1 py-0.5 rounded bg-muted/60">
                      {item.type}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
