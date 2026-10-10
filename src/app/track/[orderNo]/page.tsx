import { getOrderTracking } from "@/services/tracking";
import { TrackingStepper } from "@/components/shared/tracking-stepper";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Layers,
  AlertTriangle,
  Clock,
  Package,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface TrackDetailPageProps {
  params: Promise<{
    orderNo: string;
  }>;
}

export default async function TrackDetailPage({
  params,
}: TrackDetailPageProps) {
  const { orderNo } = await params;
  const tracking = await getOrderTracking(orderNo);

  if (!tracking) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
        <header className="border-b border-slate-800 bg-slate-900/60 p-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Link
              href="/track"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              <ArrowLeft className="size-4" />
              <span>Back to Tracker</span>
            </Link>
          </div>
        </header>

        <main className="max-w-md w-full mx-auto p-6 text-center space-y-4 my-auto">
          <div className="size-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Package className="size-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Order Not Found</h2>
          <p className="text-xs text-slate-400">
            We could not locate any order with reference{" "}
            <strong className="text-white font-mono">{orderNo}</strong>. Please check the order number and try again.
          </p>
          <div className="pt-2">
            <Link
              href="/track"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Search Another Order
            </Link>
          </div>
        </main>

        <footer className="p-6 border-t border-slate-900 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Everest Textile Mills
        </footer>
      </div>
    );
  }

  const isDone = tracking.status === "DISPATCHED";
  const isReady = tracking.status === "READY";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      <header className="border-b border-slate-800 bg-slate-900/60 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/track"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Search Another Order</span>
          </Link>

          <span className="text-[11px] text-slate-500">
            Last updated: {new Date(tracking.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto p-6 space-y-8 my-6">
        {/* Order Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-400">
                  {tracking.orderNo}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    isDone
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : isReady
                      ? "bg-blue-950 text-blue-400 border border-blue-800"
                      : "bg-amber-950 text-amber-400 border border-amber-800"
                  }`}
                >
                  {tracking.status.replace("_", " ")}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">
                {tracking.fabricType}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Colour: <strong className="text-white">{tracking.colour}</strong> · Total Quantity:{" "}
                <strong className="text-white">{tracking.qtyMetres.toLocaleString()} metres</strong>
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
                <span className="text-xs text-slate-400 block">Progress</span>
                <span className="text-2xl font-bold font-mono text-white">
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

        {/* Status Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 font-medium">Target Completion ETA</span>
            <p className="text-lg font-bold text-white mt-1">
              {new Date(tracking.deadline).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Production schedule deadline
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-emerald-400 font-medium">QC Verified Rolls</span>
            <p className="text-lg font-bold text-emerald-400 mt-1">
              {tracking.rollCounts.passed} of {tracking.rollCounts.produced} rolls
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Inspected and passed standard
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-blue-400 font-medium">Shipment Status</span>
            <p className="text-lg font-bold text-blue-400 mt-1">
              {tracking.rollCounts.dispatched} rolls dispatched
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isDone ? "Order fully dispatched" : "In production / awaiting dispatch"}
            </p>
          </div>
        </div>
      </main>

      <footer className="p-6 border-t border-slate-900 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Everest Textile Mills · Secure Live Production Tracker
      </footer>
    </div>
  );
}
