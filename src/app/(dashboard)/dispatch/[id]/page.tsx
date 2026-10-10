import { notFound } from "next/navigation";
import Link from "next/link";
import { getDispatchDetail } from "@/services/dispatch";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Truck,
  ArrowLeft,
  FileText,
  User,
  Calendar,
  Layers,
  Building2,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface DispatchDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DispatchDetailPage({
  params,
}: DispatchDetailPageProps) {
  const { id } = await params;
  const dispatch = await getDispatchDetail(id);

  if (!dispatch) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/dispatch/history"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-fit"
        >
          <ArrowLeft className="size-3.5" />
          Back to Dispatch History
        </Link>

        <div className="flex items-center gap-2">
          {dispatch.invoice && (
            <Link
              href={`/orders/${dispatch.order.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              <FileText className="size-3.5 text-emerald-500" />
              View Sales Order
            </Link>
          )}
        </div>
      </div>

      <PageHeader
        title={`Dispatch Manifest • ${dispatch.dispatchNo}`}
        description={`Shipment manifested on ${new Date(
          dispatch.dispatchedAt
        ).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}`}
      />

      {/* Top 3 Metric Strips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Vehicle & Logistics */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Truck className="size-4 text-primary" />
            Logistics & Transport
          </div>
          <div>
            <div className="text-xl font-bold font-mono text-foreground">
              {dispatch.vehicleNo}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <User className="size-3.5" />
              Driver: <span className="font-medium text-foreground">{dispatch.driver}</span>
            </div>
          </div>
        </div>

        {/* Sales Order & Buyer */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Building2 className="size-4 text-blue-500" />
            Customer & Fabric
          </div>
          <div>
            <div className="text-base font-bold text-foreground">
              {dispatch.order.buyerName}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Order: <span className="font-mono font-medium text-foreground">{dispatch.order.orderNo}</span> • {dispatch.order.fabricType} ({dispatch.order.colour})
            </div>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <FileText className="size-4 text-emerald-500" />
            Billed Invoice
          </div>
          {dispatch.invoice ? (
            <div>
              <div className="flex items-center justify-between">
                <span className="text-base font-mono font-bold text-foreground">
                  {dispatch.invoice.invoiceNo}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {dispatch.invoice.status}
                </span>
              </div>
              <div className="text-sm font-semibold text-primary mt-1">
                ₹{dispatch.invoice.total.toLocaleString()}
                <span className="text-xs font-normal text-muted-foreground ml-1.5">
                  ({dispatch.invoice.taxPct}% tax incl.)
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">No invoice linked</div>
          )}
        </div>
      </div>

      {/* Manifested Rolls List */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              Manifested Fabric Rolls ({dispatch.rolls.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              All rolls are verified QC-PASSED. Click any roll to inspect its full trace and provenance tree.
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold font-mono text-foreground">
              {dispatch.totalMetres.toLocaleString()} m
            </div>
            <div className="text-xs text-muted-foreground">Total Dispatched Length</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {dispatch.rolls.map((roll) => (
            <Link
              key={roll.id}
              href={`/quality/rolls/${roll.rollNo}`}
              className="p-3.5 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-muted/30 transition-all flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-primary group-hover:underline flex items-center gap-1">
                  {roll.rollNo}
                  <ExternalLink className="size-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
                </span>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3 text-emerald-500" />
                  PASSED
                </span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                <span>Length:</span>
                <span className="font-mono font-semibold text-foreground">
                  {roll.lengthM} m
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
