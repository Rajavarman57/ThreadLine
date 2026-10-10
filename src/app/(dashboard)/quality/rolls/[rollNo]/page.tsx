import { getRollTrace } from "@/services/quality";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  QrCode,
  Printer,
  Boxes,
  Cpu,
  Layers,
  Truck,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ rollNo: string }>;
}

export default async function RollTraceabilityPage({ params }: PageProps) {
  const { rollNo } = await params;
  const trace = await getRollTrace(rollNo);

  if (!trace) {
    notFound();
  }

  // Generate QR code data URL pointing to this roll trace page
  const qrDataUrl = await QRCode.toDataURL(
    `https://thread-line-smoky.vercel.app/quality/rolls/${rollNo}`,
    {
      width: 180,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    }
  );

  return (
    <div className="space-y-6 max-w-5xl">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/quality/rolls"
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <PageHeader
            title={`Roll Lineage & Traceability #${trace.roll.rollNo}`}
            description="Complete end-to-end provenance: client order, machines, operators, yarn ledger, and QC inspection timeline."
          />
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/quality/rolls/${rollNo}/label`} target="_blank">
            <Button variant="outline" className="gap-2">
              <Printer className="size-4" />
              Print Barcode Label
            </Button>
          </Link>
        </div>
      </div>

      {/* TOP SUMMARY CARDS & QR CODE */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* ROLL & ORDER SUMMARY */}
        <div className="md:col-span-8 rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-bold text-foreground">
                {trace.roll.rollNo}
              </span>
              <StatusBadge status={trace.roll.qcStatus} />
            </div>
            <span className="font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {trace.roll.lengthM.toLocaleString()} Metres
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block">Client Order</span>
              <span className="font-mono font-semibold text-foreground">
                PO #{trace.order.orderNo}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Apparel Buyer</span>
              <span className="font-semibold text-foreground">
                {trace.order.buyer.name}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Fabric Specification</span>
              <span className="font-medium text-foreground">
                {trace.order.fabricType}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Colour Shade</span>
              <span className="font-mono text-foreground">{trace.order.colour}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Dyeing Vessel</span>
              <span className="font-mono text-foreground">
                {trace.machine?.code || "Direct Finish"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Manufactured On</span>
              <span className="font-mono text-muted-foreground">
                {new Date(trace.roll.createdAt).toLocaleDateString("en-IN", {
                  dateStyle: "medium",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* QR CODE CARD */}
        <div className="md:col-span-4 rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-2 rounded-xl bg-white border border-border shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt={`QR Code for ${rollNo}`} className="size-32" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold text-foreground block">
              {trace.roll.rollNo}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Scan with mobile device to open live digital provenance
            </span>
          </div>
        </div>
      </div>

      {/* STAGE WORK ORDERS & OPERATORS */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Cpu className="size-4 text-primary" />
          Manufacturing Stages & Floor Operations
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trace.workOrders.map((wo) => (
            <div
              key={wo.id}
              className="p-4 rounded-xl border border-border/80 bg-muted/40 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground uppercase tracking-wider">
                  {wo.stage}
                </span>
                <StatusBadge status={wo.status} />
              </div>

              <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
                <div>Machine: {wo.machine?.code || "—"} ({wo.machine?.type || ""})</div>
                <div>Output: {wo.producedQty.toLocaleString()} / {wo.targetQty.toLocaleString()} m</div>
              </div>

              {/* Operator logs */}
              {wo.logs.length > 0 && (
                <div className="pt-2 border-t border-border/60 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Operators & Shifts
                  </span>
                  {wo.logs.slice(0, 3).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between text-[11px] text-muted-foreground"
                    >
                      <span>{log.operatorName} (Shift {log.shift})</span>
                      <span className="font-mono font-semibold text-foreground">
                        +{log.qty}m
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* YARN LEDGER ISSUANCES */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Boxes className="size-4 text-primary" />
          Raw Yarn Components Issued (BOM Lineage)
        </h3>

        {trace.yarnIssued.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            No yarn issuance records logged for this order.
          </p>
        ) : (
          <div className="divide-y divide-border/60">
            {trace.yarnIssued.map((yarn) => (
              <div
                key={yarn.id}
                className="py-2.5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-foreground">
                    {yarn.yarnType}
                  </span>
                  <span className="ml-2 font-mono text-muted-foreground text-[11px]">
                    ({yarn.colour})
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs font-semibold text-foreground">
                    {yarn.qty.toLocaleString()} {yarn.unit}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {new Date(yarn.date).toLocaleDateString("en-IN", {
                      dateStyle: "short",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* INSPECTION HISTORY TIMELINE */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          Quality Control Inspection Timeline
        </h3>

        {trace.inspections.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">
            Pending initial QC inspection.
          </p>
        ) : (
          <div className="space-y-3">
            {trace.inspections.map((insp) => (
              <div
                key={insp.id}
                className="p-4 rounded-xl border border-border/80 bg-muted/40 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={insp.result} />
                    <span className="font-medium text-foreground">
                      Inspector: {insp.inspectorName}
                    </span>
                  </div>
                  <span className="font-mono text-muted-foreground text-[11px]">
                    {new Date(insp.date).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                {insp.defects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {insp.defects.map((d: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-destructive/10 text-destructive text-[11px] border border-destructive/20 font-medium capitalize"
                      >
                        {d.type?.replace("_", " ")} ({d.severity})
                      </span>
                    ))}
                  </div>
                )}

                {insp.notes && (
                  <p className="text-muted-foreground text-xs italic">
                    &ldquo;{insp.notes}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DISPATCH INFORMATION */}
      {trace.dispatch && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Truck className="size-4 text-primary" />
            Dispatch & Logistics Manifest
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-muted-foreground block">Manifest No:</span>
              <span className="font-mono font-semibold text-foreground">
                {trace.dispatch.dispatchNo}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Vehicle No:</span>
              <span className="font-mono text-foreground">
                {trace.dispatch.vehicleNo || "—"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Driver:</span>
              <span className="text-foreground">
                {trace.dispatch.driverName || "—"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block">Dispatch Date:</span>
              <span className="font-mono text-muted-foreground">
                {new Date(trace.dispatch.date).toLocaleDateString("en-IN", {
                  dateStyle: "medium",
                })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
