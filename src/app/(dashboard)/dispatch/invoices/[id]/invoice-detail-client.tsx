"use client";

import { useState } from "react";
import { InvoiceDetail } from "@/services/payments";
import { recordPaymentAction } from "../actions";
import { PaymentMethod } from "@/services/schemas/payments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CreditCard,
  Download,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Calendar,
  Layers,
  Building2,
  Truck,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface InvoiceDetailClientProps {
  invoice: InvoiceDetail;
  canRecordPayment: boolean;
}

export function InvoiceDetailClient({
  invoice,
  canRecordPayment,
}: InvoiceDetailClientProps) {
  const router = useRouter();

  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<string>(
    invoice.outstanding > 0 ? String(invoice.outstanding) : ""
  );
  const [method, setMethod] = useState<PaymentMethod>("BANK");
  const [paidAt, setPaidAt] = useState<string>(
    new Date().toISOString().substring(0, 10)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setDialogError(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setDialogError("Please enter a valid payment amount greater than zero.");
      return;
    }

    if (numericAmount > invoice.outstanding + 0.01) {
      setDialogError(
        `Payment cannot exceed outstanding balance of ₹${invoice.outstanding.toLocaleString()}.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await recordPaymentAction(
        invoice.id,
        numericAmount,
        method,
        new Date(paidAt).toISOString()
      );

      if (!res.success) {
        setDialogError(res.error || "Payment recording failed.");
        toast.error(res.error || "Payment recording failed.");
        setIsSubmitting(false);
        return;
      }

      toast.success(
        `Payment of ₹${numericAmount.toLocaleString()} recorded successfully!`
      );
      setIsOpen(false);
      setIsSubmitting(false);
      router.refresh();
    } catch (err: any) {
      setDialogError(err?.message || "An unexpected error occurred.");
      toast.error("Failed to record payment.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header Strip */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              invoice.status === "PAID"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : invoice.status === "PARTIAL"
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
            }`}
          >
            {invoice.status}
          </span>
          <span className="text-xs text-muted-foreground">
            Billed on{" "}
            {new Date(invoice.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            ({invoice.ageDays} days ago)
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Download className="size-3.5 text-emerald-500" />
            Download Official PDF
          </a>

          {canRecordPayment && invoice.outstanding > 0 && (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger
                render={
                  <Button size="sm" className="gap-1.5 text-xs font-semibold">
                    <CreditCard className="size-3.5" />
                    Record Payment
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <form onSubmit={handleRecordPayment}>
                  <DialogHeader>
                    <DialogTitle>Record Payment for {invoice.invoiceNo}</DialogTitle>
                    <DialogDescription>
                      Outstanding Balance:{" "}
                      <span className="font-bold text-foreground font-mono">
                        ₹{invoice.outstanding.toLocaleString()}
                      </span>
                    </DialogDescription>
                  </DialogHeader>

                  {dialogError && (
                    <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{dialogError}</span>
                    </div>
                  )}

                  <div className="space-y-4 py-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="payAmount" className="text-xs font-semibold">
                        Payment Amount (₹) *
                      </Label>
                      <Input
                        id="payAmount"
                        type="number"
                        step="0.01"
                        max={invoice.outstanding}
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="payMethod" className="text-xs font-semibold">
                        Payment Channel / Method *
                      </Label>
                      <select
                        id="payMethod"
                        value={method}
                        onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                        className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="BANK">Bank Transfer (NEFT / RTGS)</option>
                        <option value="UPI">UPI Payment</option>
                        <option value="CHEQUE">Cheque / Demand Draft</option>
                        <option value="CASH">Cash Settlement</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="payDate" className="text-xs font-semibold">
                        Payment Date *
                      </Label>
                      <Input
                        id="payDate"
                        type="date"
                        value={paidAt}
                        onChange={(e) => setPaidAt(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                      disabled={isSubmitting}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="text-xs font-semibold"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin mr-1.5" />
                          Processing...
                        </>
                      ) : (
                        "Confirm Payment"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Financial Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Billed
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-foreground">
            ₹{invoice.total.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Subtotal ₹{invoice.subtotal.toLocaleString()} + {invoice.taxPct}% GST (₹
            {invoice.taxAmount.toLocaleString()})
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Total Amount Paid
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ₹{invoice.paidAmount.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {invoice.payments.length} payment transaction(s) recorded
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Outstanding Balance
          </div>
          <div
            className={`mt-2 text-2xl font-bold font-mono ${
              invoice.outstanding <= 0
                ? "text-muted-foreground"
                : invoice.isOverdue30
                ? "text-red-500 font-extrabold"
                : "text-amber-500"
            }`}
          >
            ₹{invoice.outstanding.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {invoice.outstanding <= 0
              ? "Account fully settled"
              : invoice.isOverdue30
              ? "Attention: >30 Days Overdue"
              : "Payment pending"}
          </p>
        </div>
      </div>

      {/* Invoice Meta Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buyer & Order Details */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Building2 className="size-4 text-blue-500" />
            Buyer / Billed Entity
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="text-sm font-bold text-foreground">
              {invoice.order.buyer.name}
            </div>
            {invoice.order.buyer.address && (
              <div className="text-muted-foreground">
                {invoice.order.buyer.address}
              </div>
            )}
            <div className="text-muted-foreground">
              Contact: {invoice.order.buyer.email} • {invoice.order.buyer.phone}
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between text-muted-foreground">
              <span>Sales Order:</span>
              <Link
                href={`/orders/${invoice.order.id}`}
                className="font-mono font-semibold text-primary hover:underline flex items-center gap-1"
              >
                {invoice.order.orderNo}
                <ExternalLink className="size-3" />
              </Link>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Fabric Type:</span>
              <span className="font-medium text-foreground">
                {invoice.order.fabricType} ({invoice.order.colour})
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Agreed Rate:</span>
              <span className="font-mono font-medium text-foreground">
                ₹{invoice.order.ratePerMetre}/m
              </span>
            </div>
          </div>
        </div>

        {/* Dispatch Manifest Info */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Truck className="size-4 text-primary" />
            Logistics & Shipment
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Dispatch Manifest:</span>
              <Link
                href={`/dispatch/${invoice.dispatchId}`}
                className="font-mono font-semibold text-primary hover:underline flex items-center gap-1"
              >
                {invoice.dispatchNo}
                <ExternalLink className="size-3" />
              </Link>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Dispatched At:</span>
              <span className="text-foreground">
                {new Date(invoice.dispatchedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Carrier Vehicle:</span>
              <span className="font-mono font-semibold text-foreground">
                {invoice.vehicleNo}
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Driver:</span>
              <span className="font-medium text-foreground">{invoice.driver}</span>
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between text-muted-foreground">
              <span>Total Dispatched Length:</span>
              <span className="font-mono font-bold text-foreground">
                {invoice.totalMetres.toLocaleString()} m ({invoice.rolls.length} rolls)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dispatched Rolls Breakdown */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Layers className="size-4 text-primary" />
          Billed Rolls ({invoice.rolls.length})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {invoice.rolls.map((roll) => (
            <Link
              key={roll.id}
              href={`/quality/rolls/${roll.rollNo}`}
              className="p-2.5 rounded-lg border border-border bg-muted/20 hover:border-primary/50 transition-colors flex flex-col justify-between"
            >
              <span className="font-mono text-xs font-semibold text-primary hover:underline">
                {roll.rollNo}
              </span>
              <span className="text-xs text-muted-foreground font-mono mt-1">
                {roll.lengthM} m
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Payment History Table */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-500" />
          Recorded Payment History ({invoice.payments.length})
        </h3>

        {invoice.payments.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No payments have been recorded for this invoice yet.
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 border-b border-border text-left">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-muted-foreground">
                    Date
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-muted-foreground">
                    Method
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-muted-foreground text-right">
                    Amount Paid
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoice.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-3 text-foreground">
                      {new Date(p.paidAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-foreground">
                      {p.method}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right">
                      ₹{p.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
