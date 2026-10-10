"use client";

import { useState } from "react";
import { OrderCostDetail } from "@/services/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calculator,
  Search,
  ExternalLink,
  Layers,
  TrendingUp,
  Percent,
} from "lucide-react";

interface CostingClientProps {
  costings: OrderCostDetail[];
}

export function CostingClient({ costings }: CostingClientProps) {
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderCostDetail | null>(null);

  const filtered = costings.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.orderNo.toLowerCase().includes(q) ||
      c.buyerName.toLowerCase().includes(q) ||
      c.fabricType.toLowerCase().includes(q)
    );
  });

  const totalRevenue = costings.reduce((s, c) => s + c.revenue, 0);
  const totalCost = costings.reduce((s, c) => s + c.totalCost, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgMarginPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">
            Total Order Revenue
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              ₹{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">
            Total Production Costs
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 font-mono">
              ₹{totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Net Margin
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{totalProfit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Average Profit Margin
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 font-mono">
              {avgMarginPct.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search order no, buyer, fabric..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Orders Costing Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <th className="py-3 px-4">Order No</th>
                <th className="py-3 px-4">Buyer</th>
                <th className="py-3 px-4">Fabric</th>
                <th className="py-3 px-4 text-right">Revenue (₹)</th>
                <th className="py-3 px-4 text-right">Material Cost</th>
                <th className="py-3 px-4 text-right">Total Cost</th>
                <th className="py-3 px-4 text-right">Margin (₹)</th>
                <th className="py-3 px-4 text-center">Margin %</th>
                <th className="py-3 px-4 text-center">Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    No orders found matching search criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.orderId} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {item.orderNo}
                    </td>

                    <td className="py-3 px-4 text-muted-foreground">
                      {item.buyerName}
                    </td>

                    <td className="py-3 px-4 text-muted-foreground">
                      {item.fabricType} ({item.colour})
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                      ₹{item.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                      ₹{item.materialCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-rose-600 dark:text-rose-400 font-semibold">
                      ₹{item.totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{item.margin.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          item.marginPct >= 30
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : item.marginPct >= 10
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400"
                            : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                        }`}
                      >
                        {item.marginPct.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(item)}
                        className="h-7 text-xs px-2 gap-1"
                      >
                        <ExternalLink className="size-3 text-muted-foreground" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost Breakdown Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Order Cost Breakdown: {selectedOrder.orderNo}</DialogTitle>
              <DialogDescription>
                {selectedOrder.buyerName} · {selectedOrder.fabricType} ({selectedOrder.colour})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border">
                <div>
                  <span className="text-muted-foreground">Order Metres:</span>
                  <p className="font-semibold text-foreground">
                    {selectedOrder.qtyMetres.toLocaleString()} m
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Metres Produced:</span>
                  <p className="font-semibold text-foreground">
                    {selectedOrder.metresProduced.toLocaleString()} m ({selectedOrder.rollsProduced} rolls)
                  </p>
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">1. Raw Yarn Material Cost:</span>
                  <span className="font-mono font-semibold">
                    ₹{selectedOrder.materialCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">2. Machine Overhead (Hourly):</span>
                  <span className="font-mono font-semibold">
                    ₹{selectedOrder.machineOverhead.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">3. Labor / Wages Share:</span>
                  <span className="font-mono font-semibold">
                    ₹{selectedOrder.wageCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-t border-border font-bold text-foreground">
                  <span>Total Manufacturing Cost:</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400">
                    ₹{selectedOrder.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-t border-border font-bold text-foreground">
                  <span>Billed Order Revenue:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    ₹{selectedOrder.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between py-1 font-bold text-foreground bg-muted/30 p-2 rounded-lg">
                  <span>Net Gross Margin:</span>
                  <span className="font-mono text-foreground">
                    ₹{selectedOrder.margin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({selectedOrder.marginPct.toFixed(1)}%)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-muted-foreground">
                <div>
                  Unit Cost/Metre:{" "}
                  <strong className="text-foreground font-mono">
                    ₹{selectedOrder.costPerMetre.toFixed(2)}
                  </strong>
                </div>
                <div>
                  Unit Cost/Roll:{" "}
                  <strong className="text-foreground font-mono">
                    ₹{selectedOrder.costPerRoll.toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
