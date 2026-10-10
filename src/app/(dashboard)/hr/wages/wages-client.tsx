"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MonthlyWagesResult } from "@/services/hr";
import { finaliseMonthWagesAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Download,
  Lock,
  Loader2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Search,
} from "lucide-react";

interface WagesClientProps {
  initialData: MonthlyWagesResult;
  selectedMonth: string;
  canFinalise: boolean;
}

export function WagesClient({
  initialData,
  selectedMonth,
  canFinalise,
}: WagesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [month, setMonth] = useState(selectedMonth);
  const [search, setSearch] = useState("");

  function handleMonthChange(newMonth: string) {
    setMonth(newMonth);
    router.push(`/hr/wages?month=${newMonth}`);
  }

  function handleFinalise() {
    if (!canFinalise) {
      toast.error("You do not have permission to finalise wages.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to finalise and lock wage records for ${month}? This operation writes immutable records and cannot be undone.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await finaliseMonthWagesAction(month);
      if (res.success) {
        toast.success(
          `Successfully finalised wages for ${res.data?.count} workers (Total: ₹${res.data?.totalGross.toLocaleString()}).`
        );
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const filteredWorkers = initialData.workers.filter((w) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      w.name.toLowerCase().includes(q) ||
      (w.code && w.code.toLowerCase().includes(q)) ||
      (w.role && w.role.toLowerCase().includes(q))
    );
  });

  const totalWorkers = initialData.workers.length;
  const totalDays = initialData.workers.reduce((s, w) => s + w.daysPresent, 0);
  const totalOt = initialData.workers.reduce((s, w) => s + w.otHours, 0);

  return (
    <div className="space-y-6">
      {/* Top Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground whitespace-nowrap">
            Payroll Month:
          </Label>
          <Input
            type="month"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="h-8 text-xs w-36"
          />

          {initialData.isFinalised ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Lock className="size-3" />
              Locked & Finalised
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="size-3" />
              Provisional / Unfinalised
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Export CSV */}
          <a
            href={`/api/hr/wages/csv?month=${month}`}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Download className="size-3.5 text-emerald-500" />
            Export CSV Register
          </a>

          {/* Finalise Button */}
          {canFinalise && !initialData.isFinalised && (
            <Button
              size="sm"
              onClick={handleFinalise}
              disabled={isPending}
              className="text-xs font-semibold gap-1.5"
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Lock className="size-3.5" />
              )}
              Finalise Month Wages
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">
            Total Gross Payroll
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              ₹{initialData.totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">
            Active Workers
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold tracking-tight">
              {totalWorkers}
            </span>
            <span className="text-xs text-muted-foreground">on payroll</span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Total Man-Days
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {totalDays}
            </span>
            <span className="text-xs text-muted-foreground">days worked</span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Total Overtime
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
              {totalOt}
            </span>
            <span className="text-xs text-muted-foreground">OT hours</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search worker by name, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Wages Breakdown Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <th className="py-3 px-4">Worker Name</th>
                <th className="py-3 px-4">Code / Role</th>
                <th className="py-3 px-4 text-right">Daily Rate</th>
                <th className="py-3 px-4 text-right">OT Rate / Hr</th>
                <th className="py-3 px-4 text-center">Days Worked</th>
                <th className="py-3 px-4 text-center">OT Hours</th>
                <th className="py-3 px-4 text-right">Gross Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No worker records found for {month}.
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((w) => (
                  <tr key={w.workerId} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {w.name}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <span>{w.code || "—"}</span>
                      {w.role && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-muted font-medium">
                          {w.role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      ₹{w.dailyRate.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      ₹{w.otRatePerHour.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        {w.daysPresent} days
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {w.otHours} hrs
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                      ₹{w.grossPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredWorkers.length > 0 && (
              <tfoot>
                <tr className="bg-muted/40 font-semibold border-t-2 border-border text-foreground">
                  <td colSpan={4} className="py-3 px-4 text-right">
                    Total Payroll:
                  </td>
                  <td className="py-3 px-4 text-center">
                    {totalDays} days
                  </td>
                  <td className="py-3 px-4 text-center">
                    {totalOt} hrs
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ₹{initialData.totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
