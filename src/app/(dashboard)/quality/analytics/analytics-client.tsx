"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DefectAnalyticsReport } from "@/services/analytics";
import { Button } from "@/components/ui/button";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ShieldAlert,
  ShieldCheck,
  RotateCcw,
  AlertOctagon,
  Calendar,
  Layers,
} from "lucide-react";

interface AnalyticsClientProps {
  analytics: DefectAnalyticsReport;
  selectedDays: number;
}

const COLORS = ["#f43f5e", "#f59e0b", "#3b82f6", "#10b981", "#8b5cf6"];

export function AnalyticsClient({
  analytics,
  selectedDays,
}: AnalyticsClientProps) {
  const router = useRouter();
  const [days, setDays] = useState(selectedDays);

  function handleDaysChange(newDays: number) {
    setDays(newDays);
    router.push(`/quality/analytics?days=${newDays}`);
  }

  return (
    <div className="space-y-6">
      {/* Range Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-xs">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Defect Trend & Quality Inspection Analytics
          </h3>
          <p className="text-xs text-muted-foreground">
            Aggregated defect types, machine correlation, shift operators, and weekly pass rate trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <Button
              key={d}
              variant={days === d ? "default" : "outline"}
              size="sm"
              onClick={() => handleDaysChange(d)}
              className="text-xs h-8"
            >
              Last {d} Days
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Overall Pass Rate
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              {analytics.overallPassRate}%
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            {analytics.totalPassed} of {analytics.totalInspections} passed
          </span>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">
            Total Inspected Rolls
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {analytics.totalInspections}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            rolls evaluated
          </span>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
            Reworks Required
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 font-mono">
              {analytics.totalRework}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            returned to mill floor
          </span>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
            Rejected Rolls
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 font-mono">
              {analytics.totalRejected}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1 block">
            scrapped / unrecoverable
          </span>
        </div>
      </div>

      {/* Visual Analytics 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Weekly Pass Rate Trend */}
        <div className="bg-card border border-border p-5 rounded-xl shadow-xs space-y-3">
          <div className="pb-2 border-b border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Weekly Pass Rate Trend (%)
            </h4>
          </div>
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.weeklyPassRates}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="passRate"
                  name="Pass Rate (%)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Defects by Type */}
        <div className="bg-card border border-border p-5 rounded-xl shadow-xs space-y-3">
          <div className="pb-2 border-b border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Defects Categorisation by Type
            </h4>
          </div>
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.defectsByType}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="type" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="Incidents" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Defects by Machine */}
        <div className="bg-card border border-border p-5 rounded-xl shadow-xs space-y-3">
          <div className="pb-2 border-b border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Defect Incidents by Machine
            </h4>
          </div>
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.defectsByMachine}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="machineCode" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="Defects" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Defects by Shift / Operator */}
        <div className="bg-card border border-border p-5 rounded-xl shadow-xs space-y-3">
          <div className="pb-2 border-b border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Defects Distributed by Shift
            </h4>
          </div>
          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.defectsByShift}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="shift" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" name="Defects" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
