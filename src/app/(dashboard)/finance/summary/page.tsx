import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMonthlyPnL } from "@/services/finance";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export const dynamic = "force-dynamic";

interface SummaryPageProps {
  searchParams: Promise<{
    month?: string;
  }>;
}

export default async function SummaryPage({ searchParams }: SummaryPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role !== "ADMIN" && role !== "ACCOUNTS") {
    redirect("/finance");
  }

  const params = await searchParams;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const selectedMonth = params.month || currentMonth;

  const pnl = await getMonthlyPnL(selectedMonth);

  return (
    <div className="min-h-screen bg-white text-slate-900 p-8 font-sans print:p-0">
      {/* Print Trigger Button */}
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-200 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Monthly Management Summary
          </h1>
          <p className="text-xs text-slate-500">
            Report period: {selectedMonth} · Everest Textile Mills
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {}}
          className="gap-1.5 text-xs font-semibold print:hidden"
        >
          <a href="javascript:window.print()" className="flex items-center gap-1.5 text-white">
            <Printer className="size-3.5" />
            Print Report
          </a>
        </Button>
      </div>

      {/* Formal Printable Document Layout */}
      <div className="max-w-3xl mx-auto space-y-8 border border-slate-200 p-8 rounded-xl shadow-xs print:border-none print:shadow-none print:p-0">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Everest Textile Mills
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mill Road, Industrial Area, Sector 4, Surat, Gujarat
            </p>
            <p className="text-xs text-slate-500">
              GSTIN: 24AAACE1234F1Z8 · contact@everestmills.test
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Financial Summary Statement
            </span>
            <span className="text-lg font-bold font-mono text-slate-900 block mt-1">
              {selectedMonth}
            </span>
            <span className="text-[11px] text-slate-400">
              Generated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>

        {/* Executive Highlights Grid */}
        <div className="grid grid-cols-3 gap-4 border border-slate-200 p-4 rounded-lg bg-slate-50">
          <div>
            <span className="text-[11px] text-slate-500 uppercase font-semibold">
              Billed Revenue
            </span>
            <p className="text-lg font-bold font-mono text-slate-900 mt-0.5">
              ₹{pnl.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 uppercase font-semibold">
              Total Manufacturing Costs
            </span>
            <p className="text-lg font-bold font-mono text-rose-700 mt-0.5">
              ₹{pnl.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div>
            <span className="text-[11px] text-slate-500 uppercase font-semibold">
              Net Operating Profit
            </span>
            <p className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
              ₹{pnl.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-slate-500">
              ({pnl.marginPct.toFixed(1)}% operating margin)
            </span>
          </div>
        </div>

        {/* Operating Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
            Cost Allocation & Cash Statement
          </h3>

          <table className="w-full text-left text-xs border-collapse">
            <tbody>
              <tr className="border-b border-slate-100 py-1.5">
                <td className="py-2 text-slate-600">Direct Raw Yarn Material (Stock Ledger Issuances)</td>
                <td className="py-2 text-right font-mono font-semibold text-slate-900">
                  ₹{pnl.materialCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="border-b border-slate-100 py-1.5">
                <td className="py-2 text-slate-600">Factory Labor & Overtime Wages (Attendance Roster)</td>
                <td className="py-2 text-right font-mono font-semibold text-slate-900">
                  ₹{pnl.wages.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="border-b border-slate-100 py-1.5">
                <td className="py-2 text-slate-600">Machine Hourly Operating Overheads</td>
                <td className="py-2 text-right font-mono font-semibold text-slate-900">
                  ₹{pnl.machineOverhead.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="border-b border-slate-100 py-1.5">
                <td className="py-2 text-slate-600">Facility, Utility, Maintenance & Operating Expenses</td>
                <td className="py-2 text-right font-mono font-semibold text-slate-900">
                  ₹{pnl.otherExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="border-b-2 border-slate-900 font-bold bg-slate-50">
                <td className="py-2.5 text-slate-900">Total Operating Expenses (COGM)</td>
                <td className="py-2.5 text-right font-mono text-rose-700">
                  ₹{pnl.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="border-b-2 border-slate-900 font-bold bg-emerald-50">
                <td className="py-3 text-emerald-900 text-sm">NET COMMERCIAL PROFIT</td>
                <td className="py-3 text-right font-mono text-emerald-800 text-sm">
                  ₹{pnl.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 text-slate-600">Outstanding Customer Accounts Receivable</td>
                <td className="py-2 text-right font-mono font-semibold text-slate-900">
                  ₹{pnl.receivables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 text-slate-600">Cash Collected and Reconciled in Month</td>
                <td className="py-2 text-right font-mono font-semibold text-emerald-700">
                  ₹{pnl.cashCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Verification Signatures */}
        <div className="pt-12 grid grid-cols-2 gap-8 text-xs text-slate-500">
          <div className="border-t border-slate-300 pt-2 text-center">
            <span className="font-semibold block text-slate-700">Head of Accounts</span>
            <span>Everest Textile Mills</span>
          </div>

          <div className="border-t border-slate-300 pt-2 text-center">
            <span className="font-semibold block text-slate-700">Managing Director / Owner</span>
            <span>Everest Textile Mills</span>
          </div>
        </div>
      </div>
    </div>
  );
}
