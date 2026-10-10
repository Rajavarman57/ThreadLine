"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MonthlyPnLStatement } from "@/services/finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";

interface PnLClientProps {
  pnl: MonthlyPnLStatement;
  selectedMonth: string;
}

export function PnLClient({ pnl, selectedMonth }: PnLClientProps) {
  const router = useRouter();
  const [month, setMonth] = useState(selectedMonth);

  function handleMonthChange(newMonth: string) {
    setMonth(newMonth);
    router.push(`/finance/pnl?month=${newMonth}`);
  }

  const prevRev = pnl.prevMonth?.revenue || 0;
  const revDiff = pnl.revenue - prevRev;
  const revGrowth = prevRev > 0 ? (revDiff / prevRev) * 100 : 0;

  const prevProfit = pnl.prevMonth?.profit || 0;
  const profitDiff = pnl.profit - prevProfit;

  return (
    <div className="space-y-6">
      {/* Month Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">
            Statement Period:
          </Label>
          <Input
            type="month"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="h-8 text-xs w-36"
          />
        </div>

        {pnl.prevMonth && (
          <div className="text-xs text-muted-foreground">
            Comparing against prior month (<strong>{pnl.prevMonth.month}</strong>)
          </div>
        )}
      </div>

      {/* Primary KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">
            Net Monthly Revenue
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              ₹{pnl.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            {revDiff !== 0 && (
              <span
                className={`text-xs font-semibold flex items-center ${
                  revDiff >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {revDiff >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {Math.abs(revGrowth).toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">
            Total Operational Costs
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 font-mono">
              ₹{pnl.totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Net Operating Profit
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{pnl.profit.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
            <span className="text-xs font-semibold text-muted-foreground font-mono">
              {pnl.marginPct.toFixed(1)}% margin
            </span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Cash Collected (Month)
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 font-mono">
              ₹{pnl.cashCollected.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* Formal P&L Statement Layout */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">
            Income Statement for the Period Ended {month}
          </h3>
          <p className="text-xs text-muted-foreground">
            Everest Textile Mills · Prepared under accrual manufacturing accounting
          </p>
        </div>

        <div className="p-6 space-y-6 text-xs">
          {/* Revenue Section */}
          <div className="space-y-2">
            <div className="flex justify-between font-bold text-foreground text-sm border-b border-border pb-1">
              <span>REVENUE & BILLING</span>
              <span className="font-mono">
                ₹{pnl.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground pl-4">
              <span>Gross Billed Buyer Invoices (Dispatch Deliveries)</span>
              <span className="font-mono">
                ₹{pnl.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Cost of Goods Manufactured (COGM) */}
          <div className="space-y-2">
            <div className="flex justify-between font-bold text-foreground text-sm border-b border-border pb-1">
              <span>COST OF GOODS MANUFACTURED & OVERHEADS</span>
              <span className="font-mono text-rose-600 dark:text-rose-400">
                ₹{pnl.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground pl-4 py-0.5">
              <span>Raw Material (Yarn Issued to Floor Work Orders)</span>
              <span className="font-mono">
                ₹{pnl.materialCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground pl-4 py-0.5">
              <span>Factory Labor & Overtime Wages (Attendance Roster)</span>
              <span className="font-mono">
                ₹{pnl.wages.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground pl-4 py-0.5">
              <span>Machine Operating Overheads (Power, Looms, Spindles)</span>
              <span className="font-mono">
                ₹{pnl.machineOverhead.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-muted-foreground pl-4 py-0.5">
              <span>General Operational Expenses (Rent, Dyes, Logistics, Misc)</span>
              <span className="font-mono">
                ₹{pnl.otherExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Net Profit */}
          <div className="pt-2 border-t-2 border-border">
            <div className="flex justify-between items-center bg-muted/40 p-4 rounded-xl font-bold text-base">
              <span className="text-foreground">NET OPERATING PROFIT:</span>
              <div className="text-right">
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-lg">
                  ₹{pnl.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="block text-xs font-normal text-muted-foreground">
                  Profit Margin: {pnl.marginPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Receivables & Cash Flow Footnotes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                Outstanding Accounts Receivable
              </span>
              <span className="font-mono font-bold text-foreground text-sm mt-0.5 block">
                ₹{pnl.receivables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Total unpaid customer invoice balances
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <span className="text-[11px] font-semibold text-muted-foreground block">
                Cash Reconciled In Month
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                ₹{pnl.cashCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-muted-foreground">
                Inflow received via Bank, UPI, RTGS and Cash
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
