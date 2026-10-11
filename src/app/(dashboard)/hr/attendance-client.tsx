"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Shift } from "@prisma/client";
import {
  DayAttendanceData,
  WorkerMonthlyAttendance,
} from "@/services/hr";
import { saveBulkAttendanceAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CalendarCheck,
  Check,
  Clock,
  Loader2,
  Users,
  Search,
  Sparkles,
  BarChart3,
  Calendar,
} from "lucide-react";

interface AttendanceClientProps {
  initialData: DayAttendanceData;
  initialSummary: WorkerMonthlyAttendance[];
  canEdit: boolean;
  selectedDate: string;
  selectedShift: Shift;
  selectedMonth: string;
}

export function AttendanceClient({
  initialData,
  initialSummary,
  canEdit,
  selectedDate,
  selectedShift,
  selectedMonth,
}: AttendanceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Tabs: daily attendance grid vs monthly summary
  const [activeTab, setActiveTab] = useState<"daily" | "summary">("daily");

  // Filters
  const [date, setDate] = useState(selectedDate);
  const [shift, setShift] = useState<Shift>(selectedShift);
  const [month, setMonth] = useState(selectedMonth);
  const [search, setSearch] = useState("");

  // Grid state for daily workers
  const [records, setRecords] = useState(
    initialData.workers.map((w) => ({
      workerId: w.workerId,
      name: w.name,
      code: w.code,
      role: w.role,
      dailyRate: w.dailyRate,
      otRatePerHour: w.otRatePerHour,
      present: w.present,
      hours: w.hours,
      overtimeHours: w.overtimeHours,
    }))
  );

  // When date or shift changes, push to router
  function handleFilterChange(newDate: string, newShift: Shift) {
    setDate(newDate);
    setShift(newShift);
    router.push(`/hr?date=${newDate}&shift=${newShift}&month=${month}`);
  }

  function handleMonthChange(newMonth: string) {
    setMonth(newMonth);
    router.push(`/hr?date=${date}&shift=${shift}&month=${newMonth}`);
  }

  // Toggle present
  function togglePresent(workerId: string) {
    if (!canEdit) return;
    setRecords((prev) =>
      prev.map((r) => {
        if (r.workerId !== workerId) return r;
        const nextPresent = !r.present;
        return {
          ...r,
          present: nextPresent,
          hours: nextPresent ? (r.hours > 0 ? r.hours : 8) : 0,
          overtimeHours: nextPresent ? r.overtimeHours : 0,
        };
      })
    );
  }

  // Update hours
  function updateHours(workerId: string, hours: number) {
    if (!canEdit) return;
    setRecords((prev) =>
      prev.map((r) =>
        r.workerId === workerId
          ? { ...r, hours: Math.max(0, Math.min(12, hours)) }
          : r
      )
    );
  }

  // Update OT hours
  function updateOvertimeHours(workerId: string, otHours: number) {
    if (!canEdit) return;
    setRecords((prev) =>
      prev.map((r) =>
        r.workerId === workerId
          ? { ...r, overtimeHours: Math.max(0, Math.min(6, otHours)) }
          : r
      )
    );
  }

  // Mark all present
  function markAllPresent() {
    if (!canEdit) return;
    setRecords((prev) =>
      prev.map((r) => ({
        ...r,
        present: true,
        hours: r.hours > 0 ? r.hours : 8,
      }))
    );
    toast.success("Marked all active workers as present");
  }

  // Save bulk attendance
  function handleSave() {
    if (!canEdit) {
      toast.error("You do not have permission to record attendance.");
      return;
    }

    const todayKolkata = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    if (date.slice(0, 10) > todayKolkata) {
      toast.error("Attendance date cannot be in the future");
      return;
    }

    startTransition(async () => {
      const payload = {
        date,
        shift,
        records: records.map((r) => ({
          workerId: r.workerId,
          present: r.present,
          hours: r.present ? Number(r.hours) : 0,
          overtimeHours: r.present ? Number(r.overtimeHours) : 0,
        })),
      };

      const res = await saveBulkAttendanceAction(payload);
      if (res.success) {
        toast.success(`Saved attendance for ${res.data?.count} workers.`);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  const filteredRecords = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.code && r.code.toLowerCase().includes(q)) ||
      (r.role && r.role.toLowerCase().includes(q))
    );
  });

  const presentCount = records.filter((r) => r.present).length;
  const absentCount = records.length - presentCount;
  const totalOtHours = records.reduce((s, r) => s + (r.present ? r.overtimeHours : 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Controls & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "daily" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("daily")}
            className="text-xs font-semibold gap-1.5"
          >
            <CalendarCheck className="size-3.5" />
            Daily Shift Attendance
          </Button>
          <Button
            variant={activeTab === "summary" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("summary")}
            className="text-xs font-semibold gap-1.5"
          >
            <BarChart3 className="size-3.5" />
            Monthly Attendance Summary
          </Button>
        </div>

        {activeTab === "daily" ? (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                Shift Date:
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => handleFilterChange(e.target.value, shift)}
                className="h-8 text-xs w-36"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">
                Shift:
              </Label>
              <select
                value={shift}
                onChange={(e) => handleFilterChange(date, e.target.value as Shift)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium"
              >
                <option value="A">Shift A (Morning)</option>
                <option value="B">Shift B (Evening)</option>
                <option value="C">Shift C (Night)</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              Summary Month:
            </Label>
            <Input
              type="month"
              value={month}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="h-8 text-xs w-36"
            />
          </div>
        )}
      </div>

      {activeTab === "daily" ? (
        <>
          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
              <span className="text-xs font-medium text-muted-foreground">
                Total Roster
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold tracking-tight">
                  {records.length}
                </span>
                <span className="text-xs text-muted-foreground">workers</span>
              </div>
            </div>

            <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Present
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
                  {presentCount}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0}%)
                </span>
              </div>
            </div>

            <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                Absent / Off
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                  {absentCount}
                </span>
                <span className="text-xs text-muted-foreground">workers</span>
              </div>
            </div>

            <div className="bg-card border border-border p-4 rounded-xl shadow-xs">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Logged Overtime
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
                  {totalOtHours}
                </span>
                <span className="text-xs text-muted-foreground">hours</span>
              </div>
            </div>
          </div>

          {/* Action Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search worker by name, code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {canEdit && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllPresent}
                  className="text-xs font-semibold gap-1.5"
                >
                  <Sparkles className="size-3.5 text-amber-500" />
                  Mark All Present
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isPending}
                  className="text-xs font-semibold gap-1.5"
                >
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  Save Shift Attendance
                </Button>
              </div>
            )}
          </div>

          {/* Workers Table */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Worker Name</th>
                    <th className="py-3 px-4">Code / Role</th>
                    <th className="py-3 px-4 text-right">Daily Rate</th>
                    <th className="py-3 px-4 text-center">Regular Hours</th>
                    <th className="py-3 px-4 text-center">Overtime (hrs)</th>
                    <th className="py-3 px-4 text-right">Est. Day Wage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No active workers found matching search.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((worker) => {
                      const estWage = worker.present
                        ? worker.dailyRate + worker.otRatePerHour * worker.overtimeHours
                        : 0;

                      return (
                        <tr
                          key={worker.workerId}
                          className={
                            worker.present
                              ? "hover:bg-muted/30 transition-colors"
                              : "bg-muted/20 opacity-70 hover:opacity-100 transition-opacity"
                          }
                        >
                          <td className="py-3 px-4">
                            <button
                              type="button"
                              onClick={() => togglePresent(worker.workerId)}
                              disabled={!canEdit}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                                worker.present
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                              }`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${
                                  worker.present ? "bg-emerald-500" : "bg-rose-500"
                                }`}
                              />
                              {worker.present ? "Present" : "Absent"}
                            </button>
                          </td>

                          <td className="py-3 px-4 font-semibold text-foreground">
                            {worker.name}
                          </td>

                          <td className="py-3 px-4 text-muted-foreground">
                            <span>{worker.code || "—"}</span>
                            {worker.role && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-muted font-medium">
                                {worker.role}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right font-mono">
                            ₹{worker.dailyRate.toFixed(2)}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <Input
                              type="number"
                              min={0}
                              max={24}
                              step={0.5}
                              value={worker.hours}
                              disabled={!canEdit || !worker.present}
                              onChange={(e) =>
                                updateHours(
                                  worker.workerId,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="h-7 w-16 text-center text-xs mx-auto"
                            />
                          </td>

                          <td className="py-3 px-4 text-center">
                            <Input
                              type="number"
                              min={0}
                              max={24}
                              step={0.5}
                              value={worker.overtimeHours}
                              disabled={!canEdit || !worker.present}
                              onChange={(e) =>
                                updateOvertimeHours(
                                  worker.workerId,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="h-7 w-16 text-center text-xs mx-auto"
                            />
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                            ₹{estWage.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Monthly Summary Tab */
        <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
          <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Monthly Attendance & Overtime Rollup
              </h3>
              <p className="text-xs text-muted-foreground">
                Showing aggregate working days and cumulative overtime hours for {month}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Worker Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Designation</th>
                  <th className="py-3 px-4 text-center">Days Present</th>
                  <th className="py-3 px-4 text-center">Total Working Hours</th>
                  <th className="py-3 px-4 text-center">Overtime Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {initialSummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No attendance data logged for month {month}.
                    </td>
                  </tr>
                ) : (
                  initialSummary.map((w) => (
                    <tr key={w.workerId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">
                        {w.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {w.code || "—"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {w.role || "General Mill Worker"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                          {w.daysPresent} days
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {w.totalHours} hrs
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {w.overtimeHours} hrs
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
