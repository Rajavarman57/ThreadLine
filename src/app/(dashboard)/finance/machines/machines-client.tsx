"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MachineOutputReport } from "@/services/finance";
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
} from "recharts";
import { Cpu, Activity, Clock, Layers } from "lucide-react";

interface MachinesClientProps {
  report: MachineOutputReport;
  fromDate: string;
  toDate: string;
}

export function MachinesClient({
  report,
  fromDate,
  toDate,
}: MachinesClientProps) {
  const router = useRouter();
  const [from, setFrom] = useState(fromDate);
  const [to, setTo] = useState(toDate);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/finance/machines?from=${from}&to=${to}`);
  }

  const chartData = report.machines.map((m) => ({
    name: m.code,
    metres: m.totalMetres,
    hours: m.totalHours,
    utilisation: m.utilisationPct,
  }));

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <form
        onSubmit={handleFilter}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-xs"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              From Date:
            </Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 text-xs w-36"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              To Date:
            </Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 text-xs w-36"
              required
            />
          </div>

          <Button type="submit" size="sm" className="h-8 text-xs font-semibold">
            Apply Date Range
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          Showing metrics for <strong>{report.machines.length} active machines</strong>
        </div>
      </form>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">
            Total Fabric / Yarn Output
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {report.totalMetres.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground ml-1">metres</span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-muted-foreground">
            Total Operating Hours
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {report.totalHours.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground ml-1">hours</span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Average Utilisation
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              {report.avgUtilisation}%
            </span>
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            Floor Productivity
          </span>
          <div className="mt-1">
            <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 font-mono">
              {report.totalHours > 0
                ? (report.totalMetres / report.totalHours).toFixed(1)
                : 0}
            </span>
            <span className="text-xs text-muted-foreground ml-1">m / hr</span>
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart */}
      <div className="bg-card border border-border p-5 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Machine Production Output (Metres)
            </h3>
            <p className="text-xs text-muted-foreground">
              Total metres produced per spinning frame, weaving loom, and dyeing vat
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Bar dataKey="metres" name="Produced (m)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Machine Utilisation Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <th className="py-3 px-4">Machine Code</th>
                <th className="py-3 px-4">Type / Stage</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Rated Capacity</th>
                <th className="py-3 px-4 text-right">Output (m)</th>
                <th className="py-3 px-4 text-right">Run Hours</th>
                <th className="py-3 px-4 text-center">Utilisation %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.machines.map((m) => (
                <tr key={m.machineId} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-foreground">
                    {m.code}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {m.type}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                    {m.capacityPerHour} m/hr
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                    {m.totalMetres.toLocaleString()} m
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-muted-foreground">
                    {m.totalHours} hrs
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {m.utilisationPct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
