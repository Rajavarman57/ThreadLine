import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Shift } from "@prisma/client";
import {
  getAttendanceForShift,
  getMonthlyAttendanceSummary,
} from "@/services/hr";
import { AttendanceClient } from "./attendance-client";
import { HRTabs } from "./hr-tabs";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

interface HRPageProps {
  searchParams: Promise<{
    date?: string;
    shift?: string;
    month?: string;
  }>;
}

export default async function HRPage({ searchParams }: HRPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const canEdit = role === "SUPERVISOR" || role === "ADMIN";

  const params = await searchParams;
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7);

  const selectedDate = params.date || todayStr;
  const selectedShift = (params.shift as Shift) || "A";
  const selectedMonth = params.month || currentMonthStr;

  const [dailyData, monthlySummary] = await Promise.all([
    getAttendanceForShift(selectedDate, selectedShift),
    getMonthlyAttendanceSummary(selectedMonth),
  ]);

  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="Human Resources & Shift Attendance"
        description="Record factory worker presence, regular hours, and overtime across Shift A, B, and C."
      />

      <HRTabs />

      <AttendanceClient
        initialData={dailyData}
        initialSummary={monthlySummary}
        canEdit={canEdit}
        selectedDate={selectedDate}
        selectedShift={selectedShift}
        selectedMonth={selectedMonth}
      />
    </div>
  );
}
