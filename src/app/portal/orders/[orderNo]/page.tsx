import { auth, signOut } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { getBuyerOrderDetail } from "@/services/tracking";
import { TrackingStepper } from "@/components/shared/tracking-stepper";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Layers,
  Truck,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface BuyerOrderDetailPageProps {
  params: Promise<{
    orderNo: string;
  }>;
}

export default async function BuyerOrderDetailPage({
  params,
}: BuyerOrderDetailPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "BUYER" || !session.user.buyerId) {
    notFound();
  }

  const { orderNo } = await params;
  const orderData = await getBuyerOrderDetail(orderNo, session.user.buyerId);

  // Strict ownership check: return 404 if not found or belongs to another buyer
  if (!orderData) {
    notFound();
  }

  const { tracking, dispatches } = orderData;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <span className="font-bold text-white text-base">
                Order {tracking.orderNo}
              </span>
              <span className="text-xs text-slate-400 block font-normal -mt-0.5">
                {tracking.fabricType} ({tracking.colour})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button
                variant="outline"
                size="sm"
                className="border-slate-800 text-slate-300 hover:text-white bg-slate-900 text-xs h-8"
              >
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-8">
        {/* Top Summary Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                Order Tracking & Fulfillment
              </span>
              <h2 className="text-2xl font-bold text-white mt-0.5">
                {tracking.fabricType}
              </h2>
              <p className="text-xs text-slate-400">
                Quantity: <strong className="text-white">{tracking.qtyMetres.toLocaleString()} metres</strong> | Deadline:{" "}
                <strong className="text-white">
                  {new Date(tracking.deadline).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              {tracking.isAtRisk && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800 text-xs font-medium">
                  <AlertTriangle className="size-3.5" />
                  <span>Timeline At Risk</span>
                </div>
              )}
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Overall Completion</span>
                <span className="text-xl font-bold font-mono text-white">
                  {tracking.percentComplete}%
                </span>
              </div>
            </div>
          </div>

          {/* Stepper */}
          <div className="pt-4 border-t border-slate-800">
            <TrackingStepper stages={tracking.stages} />
          </div>
        </div>

        {/* Roll Counts Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Total Rolls Woven</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">
                {tracking.rollCounts.produced}
              </span>
              <span className="text-xs text-slate-500">rolls</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-emerald-400 font-medium">QC Passed Rolls</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400">
                {tracking.rollCounts.passed}
              </span>
              <span className="text-xs text-slate-500">rolls</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-amber-400 font-medium">In QC / Rework</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-400">
                {tracking.rollCounts.inQC}
              </span>
              <span className="text-xs text-slate-500">rolls</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-blue-400 font-medium">Dispatched Rolls</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-400">
                {tracking.rollCounts.dispatched}
              </span>
              <span className="text-xs text-slate-500">rolls</span>
            </div>
          </div>
        </div>

        {/* Dispatches & Invoices Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">
                Shipment Dispatches & Invoices
              </h3>
              <p className="text-xs text-slate-400">
                Official delivery manifests, carrier vehicle numbers, and downloadable tax invoices.
              </p>
            </div>
          </div>

          {dispatches.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No shipment dispatches generated for this order yet.
            </div>
          ) : (
            <div className="space-y-4">
              {dispatches.map((disp) => (
                <div
                  key={disp.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Truck className="size-4 text-indigo-400" />
                      <span className="font-mono font-bold text-white text-xs">
                        {disp.dispatchNo}
                      </span>
                      <span className="text-slate-500 text-xs">·</span>
                      <span className="text-slate-300 text-xs font-semibold">
                        Vehicle: {disp.vehicleNo}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Driver: {disp.driver} | Dispatched on:{" "}
                      {new Date(disp.dispatchedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      ({disp.rollCount} rolls · {disp.totalMetres.toLocaleString()} m)
                    </p>
                  </div>

                  {disp.invoice && (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono font-bold text-white text-xs block">
                          ₹{disp.invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold uppercase">
                          {disp.invoice.status}
                        </span>
                      </div>
                      <a
                        href={`/api/invoices/${disp.invoice.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                      >
                        <Download className="size-3.5" />
                        Download PDF
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
