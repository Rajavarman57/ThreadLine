"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OwnerDashboardSummary } from "@/services/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  Cpu,
  Layers,
  Printer,
  Calendar,
  AlertCircle,
  ExternalLink,
  Package,
} from "lucide-react";
import Link from "next/link";

interface OwnerDashboardClientProps {
  summary: OwnerDashboardSummary;
  selectedMonth: string;
}

export function OwnerDashboardClient({
  summary,
  selectedMonth,
}: OwnerDashboardClientProps) {
  const router = useRouter();
  const [month, setMonth] = useState(selectedMonth);

  function handleMonthChange(newMonth: string) {
    setMonth(newMonth);
    router.push(`/finance?month=${newMonth}`);
  }

  const { pnl } = summary;

  return (
    <div className="space-y-6">
      {/* Month Selector & Printable Link */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">
            Operating Month:
          </Label>
          <Input
            type="month"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="h-8 text-xs w-36"
          />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/finance/summary?month=${month}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Printer className="size-3.5 text-indigo-500" />
            Printable Monthly Summary
          </Link>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Net Profit */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Net Profit (This Month)
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{pnl.profit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {pnl.marginPct.toFixed(1)}% operating margin
          </span>
        </div>

        {/* Revenue */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">
            Billed Revenue
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              ₹{pnl.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            from dispatch invoices
          </span>
        </div>

        {/* Wages Paid */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">
            Wages Paid
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              ₹{pnl.wages.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            floor shift payroll
          </span>
        </div>

        {/* Receivables */}
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Total Receivables
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 font-mono">
              ₹{pnl.receivables.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            outstanding balances
          </span>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Cost (6 months) */}
        <div className="bg-card border border-border p-5 rounded-xl shadow-xs space-y-3">
          <div className="pb-2 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              Revenue vs Operating Cost (Trailing 6 Months)
            </h3>
            <p className="text-xs text-muted-foreground">
              Comparison of invoiced billings against labor & overhead expenditure
            </p>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.revenueVsCost}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar dataKey="revenue" name="Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Cost" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Machine Output this month */}
        <div className="bg-card border border-border p-5 rounded-xl shadow-xs space-y-3">
          <div className="pb-2 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              Floor Machine Output This Month (Metres)
            </h3>
            <p className="text-xs text-muted-foreground">
              Metres produced by active machines during {month}
            </p>
          </div>

          <div className="h-64 w-full pt-4">
            {summary.machineOutputCurrentMonth.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No machine output logged for this month yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.machineOutputCurrentMonth}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      borderColor: "var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="metres" name="Metres" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Operational Watchlists Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Orders Past Deadline or At Risk */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs pb-2 border-b border-border">
            <AlertTriangle className="size-4" />
            <span>Orders Overdue or At Risk ({summary.atRiskOrders.length})</span>
          </div>

          {summary.atRiskOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              All active production orders on schedule.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {summary.atRiskOrders.map((o) => (
                <div
                  key={o.id}
                  className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-foreground">
                      {o.orderNo}
                    </span>
                    <span className="text-muted-foreground block text-[11px]">
                      {o.buyerName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                      Due: {o.deadline}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Yarns Below Reorder Level */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs pb-2 border-b border-border">
            <AlertCircle className="size-4" />
            <span>Yarns Below Reorder Level ({summary.lowStockYarns.length})</span>
          </div>

          {summary.lowStockYarns.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Warehouse raw yarn inventory healthy.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {summary.lowStockYarns.map((y) => (
                <div
                  key={y.id}
                  className="p-2.5 rounded-lg bg-muted/40 border border-border flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-foreground">
                      {y.type}
                    </span>
                    <span className="text-muted-foreground block text-[11px]">
                      {y.colour}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                      {y.onHand} KG
                    </span>
                    <span className="text-[10px] text-muted-foreground block">
                      Min: {y.reorderLevel} KG
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Machines in Breakdown */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs pb-2 border-b border-border">
            <Cpu className="size-4" />
            <span>Machines In Breakdown ({summary.breakdownMachines.length})</span>
          </div>

          {summary.breakdownMachines.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No mill machinery reported under breakdown.
            </p>
          ) : (
            <div className="space-y-2 text-xs">
              {summary.breakdownMachines.map((m) => (
                <div
                  key={m.id}
                  className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-foreground">
                      {m.code}
                    </span>
                    <span className="text-muted-foreground block text-[11px]">
                      {m.type}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white uppercase">
                    Down
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
