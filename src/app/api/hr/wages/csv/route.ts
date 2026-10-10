import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMonthlyWages } from "@/services/hr";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "ACCOUNTS") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

    const wagesData = await getMonthlyWages(month);

    // Build CSV
    const headers = [
      "Worker Name",
      "Worker Code",
      "Designation/Role",
      "Daily Rate (INR)",
      "OT Rate/Hour (INR)",
      "Days Present",
      "OT Hours",
      "Gross Wages (INR)",
      "Status",
    ];

    const rows = wagesData.workers.map((w) => [
      `"${w.name.replace(/"/g, '""')}"`,
      `"${(w.code || "").replace(/"/g, '""')}"`,
      `"${(w.role || "").replace(/"/g, '""')}"`,
      w.dailyRate.toFixed(2),
      w.otRatePerHour.toFixed(2),
      w.daysPresent,
      w.otHours,
      w.grossPay.toFixed(2),
      wagesData.isFinalised ? "FINALISED" : "COMPUTED",
    ]);

    // Summary line
    rows.push([
      `"TOTAL"`,
      `""`,
      `""`,
      `""`,
      `""`,
      `""`,
      `""`,
      wagesData.totalGross.toFixed(2),
      wagesData.isFinalised ? `"FINALISED AT ${wagesData.finalisedAt}"` : `"UNFINALISED"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="wage-register-${month}.csv"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Failed to export wage register CSV:", error);
    return new NextResponse(error?.message || "Internal Server Error", {
      status: 500,
    });
  }
}
