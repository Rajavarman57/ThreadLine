"use client";

import { useState } from "react";
import Link from "next/link";
import { FinishedGoodsOrderSummary } from "@/services/dispatch";
import {
  PackageCheck,
  Truck,
  Building2,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FinishedGoodsClientProps {
  summary: {
    overallReadyMetres: number;
    totalPassedUndispatchedRolls: number;
    orders: FinishedGoodsOrderSummary[];
  };
}

export function FinishedGoodsClient({ summary }: FinishedGoodsClientProps) {
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Overall Ready Metres
            </span>
            <PackageCheck className="size-5 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {summary.overallReadyMetres.toLocaleString()} m
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            QC-Passed finished fabric ready for transit
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Passed Rolls Ready
            </span>
            <Layers className="size-5 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {summary.totalPassedUndispatchedRolls} rolls
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Awaiting allocation into vehicle manifests
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Orders with Ready Goods
            </span>
            <Building2 className="size-5 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">
            {summary.orders.length}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Distinct sales contracts with inventory
          </p>
        </div>
      </div>

      {/* Orders Group List */}
      {summary.orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card">
          <PackageCheck className="size-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="text-lg font-semibold text-foreground">
            No Finished Goods Awaiting Dispatch
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
            All QC-passed fabric rolls have either been dispatched or are currently in production / awaiting quality inspection.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/quality"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Go to QC Queue
            </Link>
            <Link
              href="/dispatch/history"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              View Dispatch History
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-500" />
              Orders Ready for Dispatch Allocation
            </h3>
            <span className="text-xs text-muted-foreground">
              Grouped by Sales Order
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {summary.orders.map((group) => {
              const isExpanded = !!expandedOrders[group.orderId];
              const fulfillPct = Math.min(
                100,
                Math.round((group.totalMetres / group.orderQtyMetres) * 100)
              );

              return (
                <div
                  key={group.orderId}
                  className="rounded-xl border border-border bg-card shadow-sm hover:border-border/80 transition-all overflow-hidden"
                >
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-primary">
                          {group.orderNo}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {group.rollCount} Rolls Ready
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({fulfillPct}% of {group.orderQtyMetres.toLocaleString()}m target)
                        </span>
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {group.buyerName}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{group.fabricType}</span>
                        <span>•</span>
                        <span>{group.colour}</span>
                        <span>•</span>
                        <span>₹{group.ratePerMetre}/m</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xl font-bold text-foreground">
                          {group.totalMetres.toLocaleString()} m
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Estimated value: ₹
                          {Math.round(
                            group.totalMetres * group.ratePerMetre
                          ).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleOrder(group.orderId)}
                          className="text-xs text-muted-foreground"
                        >
                          {isExpanded ? (
                            <>
                              Hide Rolls <ChevronUp className="size-3.5 ml-1" />
                            </>
                          ) : (
                            <>
                              View Rolls <ChevronDown className="size-3.5 ml-1" />
                            </>
                          )}
                        </Button>

                        <Link
                          href={`/dispatch/new?orderId=${group.orderId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                        >
                          <Truck className="size-3.5" />
                          Create Dispatch
                          <ArrowRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Rolls Breakdown */}
                  {isExpanded && (
                    <div className="border-t border-border/80 bg-muted/20 px-5 py-4">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                        Available Rolls Ready for Shipment ({group.rolls.length})
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                        {group.rolls.map((roll) => (
                          <div
                            key={roll.id}
                            className="p-2.5 rounded-lg border border-border bg-card/60 flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-semibold text-foreground">
                                {roll.rollNo}
                              </span>
                              <span className="size-2 rounded-full bg-emerald-500" />
                            </div>
                            <div className="mt-1 text-xs text-muted-foreground flex justify-between">
                              <span>{roll.lengthM}m</span>
                              {roll.machineCode && (
                                <span className="font-mono text-[10px]">
                                  {roll.machineCode}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
