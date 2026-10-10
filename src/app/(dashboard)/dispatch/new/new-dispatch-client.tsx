"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Truck, AlertCircle, FileText, Check, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createDispatchAction } from "../actions";

interface OrderOption {
  id: string;
  orderNo: string;
  buyerName: string;
  fabricType: string;
  colour: string;
  ratePerMetre: number;
  availableRollCount: number;
}

interface NewDispatchClientProps {
  ordersList: OrderOption[];
  selectedOrderData: {
    id: string;
    orderNo: string;
    buyerName: string;
    fabricType: string;
    colour: string;
    ratePerMetre: number;
    orderQtyMetres: number;
    taxPct: number;
    rolls: Array<{
      id: string;
      rollNo: string;
      lengthM: number;
    }>;
  } | null;
  initialOrderId?: string;
}

export function NewDispatchClient({
  ordersList,
  selectedOrderData,
  initialOrderId,
}: NewDispatchClientProps) {
  const router = useRouter();

  const [orderId, setOrderId] = useState<string>(
    initialOrderId || (ordersList.length > 0 ? ordersList[0].id : "")
  );
  const [vehicleNo, setVehicleNo] = useState("");
  const [driver, setDriver] = useState("");
  const [selectedRollIds, setSelectedRollIds] = useState<Set<string>>(
    new Set(selectedOrderData?.rolls.map((r) => r.id) || [])
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOrderChange = (newOrderId: string) => {
    setOrderId(newOrderId);
    router.push(`/dispatch/new?orderId=${newOrderId}`);
  };

  const toggleRoll = (rollId: string) => {
    setSelectedRollIds((prev) => {
      const next = new Set(prev);
      if (next.has(rollId)) {
        next.delete(rollId);
      } else {
        next.add(rollId);
      }
      return next;
    });
  };

  const selectAllRolls = () => {
    if (!selectedOrderData) return;
    if (selectedRollIds.size === selectedOrderData.rolls.length) {
      setSelectedRollIds(new Set());
    } else {
      setSelectedRollIds(new Set(selectedOrderData.rolls.map((r) => r.id)));
    }
  };

  // Calculations
  const activeRolls = selectedOrderData?.rolls.filter((r) =>
    selectedRollIds.has(r.id)
  ) || [];

  const totalMetres = activeRolls.reduce((sum, r) => sum + r.lengthM, 0);
  const rate = selectedOrderData?.ratePerMetre || 0;
  const subtotal = Number((totalMetres * rate).toFixed(2));
  const taxPct = selectedOrderData?.taxPct || 5;
  const taxAmount = Number(((subtotal * taxPct) / 100).toFixed(2));
  const grandTotal = Number((subtotal + taxAmount).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orderId) {
      setError("Please select a sales order.");
      return;
    }
    if (!vehicleNo.trim()) {
      setError("Vehicle registration number is required.");
      return;
    }
    if (!driver.trim()) {
      setError("Driver name is required.");
      return;
    }
    if (selectedRollIds.size === 0) {
      setError("Please tick at least one roll for this dispatch manifest.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createDispatchAction(
        orderId,
        Array.from(selectedRollIds),
        vehicleNo.trim(),
        driver.trim()
      );

      if (!res.success || !res.data) {
        setError(res.error || "Failed to create dispatch.");
        toast.error(res.error || "Failed to create dispatch.");
        setIsSubmitting(false);
        return;
      }

      toast.success(
        `Dispatch ${res.data.dispatchNo} generated with Invoice ${res.data.invoiceNo}!`
      );
      router.push(`/dispatch/${res.data.dispatchId}`);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
      toast.error("Dispatch creation failed.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
          <AlertCircle className="size-5 shrink-0 mt-0.5" />
          <div className="leading-snug">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Roll Selector (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order & Transport Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Truck className="size-4 text-primary" />
              Transport Details & Order Allocation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="orderSelect" className="text-xs font-semibold">
                  Select Sales Order
                </Label>
                <select
                  id="orderSelect"
                  value={orderId}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="" disabled>
                    -- Select an order with ready goods --
                  </option>
                  {ordersList.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNo} — {o.buyerName} ({o.availableRollCount} rolls ready • {o.fabricType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="vehicleNo" className="text-xs font-semibold">
                  Vehicle Number *
                </Label>
                <Input
                  id="vehicleNo"
                  placeholder="e.g. TN 38 BH 4521"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="driver" className="text-xs font-semibold">
                  Driver Name *
                </Label>
                <Input
                  id="driver"
                  placeholder="e.g. Murugan Selvam"
                  value={driver}
                  onChange={(e) => setDriver(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </div>

          {/* Roll Picker Card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Tick Rolls to Dispatch
                </h3>
                <p className="text-xs text-muted-foreground">
                  Only QC-PASSED rolls for order {selectedOrderData?.orderNo || "selected"} are selectable.
                </p>
              </div>

              {selectedOrderData && selectedOrderData.rolls.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllRolls}
                  className="text-xs"
                >
                  {selectedRollIds.size === selectedOrderData.rolls.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              )}
            </div>

            {!selectedOrderData || selectedOrderData.rolls.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No QC-passed rolls ready for this order. Please pick another order or complete quality inspection.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {selectedOrderData.rolls.map((roll) => {
                  const isChecked = selectedRollIds.has(roll.id);
                  return (
                    <div
                      key={roll.id}
                      onClick={() => toggleRoll(roll.id)}
                      className={`cursor-pointer rounded-lg border p-3 flex flex-col justify-between transition-all select-none ${
                        isChecked
                          ? "border-primary bg-primary/5 text-primary shadow-sm"
                          : "border-border bg-card hover:border-border/80 text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold">
                          {roll.rollNo}
                        </span>
                        <div
                          className={`size-4 rounded flex items-center justify-center border transition-colors ${
                            isChecked
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30 bg-background"
                          }`}
                        >
                          {isChecked && <Check className="size-3 stroke-[3]" />}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Length:{" "}
                        <span className="font-semibold text-foreground">
                          {roll.lengthM} m
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invoice Preview & Summary (1 span) */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm sticky top-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <FileText className="size-4 text-emerald-500" />
                Live Invoice Preview
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Auto-Generated
              </span>
            </div>

            {selectedOrderData && (
              <div className="space-y-1 text-xs">
                <div className="text-muted-foreground">Buyer:</div>
                <div className="font-semibold text-foreground text-sm">
                  {selectedOrderData.buyerName}
                </div>
                <div className="text-muted-foreground">
                  {selectedOrderData.fabricType} ({selectedOrderData.colour})
                </div>
              </div>
            )}

            <div className="space-y-2.5 pt-2 text-sm border-t border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Selected Rolls</span>
                <span className="font-semibold text-foreground">
                  {selectedRollIds.size} rolls
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Metres</span>
                <span className="font-mono font-bold text-foreground">
                  {totalMetres.toLocaleString()} m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate per Metre</span>
                <span className="text-foreground">₹{rate.toFixed(2)}</span>
              </div>

              <div className="border-t border-dashed border-border pt-2 flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono text-foreground">
                  ₹{subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">GST Tax ({taxPct}%)</span>
                <span className="font-mono text-muted-foreground">
                  ₹{taxAmount.toLocaleString()}
                </span>
              </div>

              <div className="border-t border-border pt-2 flex justify-between text-base font-bold">
                <span className="text-foreground">Invoice Total</span>
                <span className="font-mono text-primary text-lg">
                  ₹{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Button
                type="submit"
                disabled={isSubmitting || selectedRollIds.size === 0}
                className="w-full gap-2 h-11 text-sm font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Dispatching & Invoicing...
                  </>
                ) : (
                  <>
                    <Truck className="size-4" />
                    Confirm Dispatch ({selectedRollIds.size} Rolls)
                  </>
                )}
              </Button>

              <Link
                href="/dispatch"
                className="inline-flex items-center justify-center w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3.5 mr-1" />
                Cancel & Back to Finished Goods
              </Link>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
