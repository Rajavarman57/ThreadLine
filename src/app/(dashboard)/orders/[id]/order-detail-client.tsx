"use client";

import React, { useState } from "react";
import { OrderStatus, Role } from "@prisma/client";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  reserveOrderMaterialAction,
  cancelOrderAction,
  createPOForShortfallAction,
} from "../actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Boxes,
  Cpu,
  Layers,
  Truck,
  RotateCcw,
  Ban,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OrderDetailClientProps {
  order: any;
  suppliers: Array<{ id: string; name: string }>;
  userRole: Role;
}

export function OrderDetailClient({
  order,
  suppliers,
  userRole,
}: OrderDetailClientProps) {
  const router = useRouter();
  const isAdminOrAccounts =
    userRole === Role.ADMIN || userRole === Role.ACCOUNTS;

  const [isReserving, setIsReserving] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Shortfall PO Modal
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(
    suppliers[0]?.id || ""
  );
  const [isCreatingPO, setIsCreatingPO] = useState(false);

  const shortfalls = order.materials.filter((m: any) => m.shortfall > 0);

  const handleRetryReservation = async () => {
    setIsReserving(true);
    try {
      const res = await reserveOrderMaterialAction(order.id);
      if (!res.success) throw new Error(res.error);

      if (res.data.ok) {
        toast.success("100% of required materials successfully reserved!");
      } else {
        toast.warning(
          "Stock arrived is insufficient to fully satisfy order requirements."
        );
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Reservation failed");
    } finally {
      setIsReserving(false);
    }
  };

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      const res = await cancelOrderAction(order.id);
      if (!res.success) throw new Error(res.error);
      toast.success("Order cancelled and held reservations released.");
      setCancelOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel order");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCreatePOForShortfall = async () => {
    if (!selectedSupplier) {
      toast.error("Please select a vendor / supplier");
      return;
    }
    setIsCreatingPO(true);
    try {
      const lines = shortfalls.map((s: any) => ({
        yarnTypeId: s.yarnTypeId,
        qty: s.shortfall,
      }));
      const res = await createPOForShortfallAction(selectedSupplier, lines);
      if (!res.success) throw new Error(res.error);
      toast.success(`Purchase Order raised for material shortfalls!`);
      setPoModalOpen(false);
      router.push("/inventory/purchase-orders");
    } catch (err: any) {
      toast.error(err.message || "Failed to create PO");
    } finally {
      setIsCreatingPO(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                Order #{order.orderNo}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Client: <span className="font-semibold text-foreground">{order.buyer.name}</span>
            </p>
          </div>
        </div>

        {isAdminOrAccounts && order.status !== OrderStatus.CANCELLED && (
          <div className="flex items-center gap-2">
            {!order.fullyReserved && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryReservation}
                disabled={isReserving}
                className="gap-1.5 text-xs rounded-xl"
              >
                <RotateCcw className="size-3.5" />
                {isReserving ? "Checking..." : "Retry Material Reservation"}
              </Button>
            )}

            {shortfalls.length > 0 && (
              <Button
                size="sm"
                onClick={() => setPoModalOpen(true)}
                className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              >
                <ShoppingCart className="size-3.5" />
                Raise PO for Shortfall
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelOpen(true)}
              className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-xl"
            >
              <Ban className="size-3.5" />
              Cancel Order
            </Button>
          </div>
        )}
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs text-muted-foreground block">Fabric Specification</span>
          <span className="text-sm font-bold text-foreground mt-1 block truncate">
            {order.fabricType}
          </span>
          <span className="text-xs font-mono text-muted-foreground">{order.colour}</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs text-muted-foreground block">Order Volume</span>
          <span className="text-lg font-bold font-mono text-foreground mt-1 block">
            {order.qtyMetres.toLocaleString()} m
          </span>
          <span className="text-xs text-muted-foreground">
            @ ₹{order.ratePerMetre.toFixed(2)}/m
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs text-muted-foreground block">Contract Value</span>
          <span className="text-lg font-bold font-mono text-primary mt-1 block">
            ₹{(order.qtyMetres * order.ratePerMetre).toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">Excluding GST</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
          <span className="text-xs text-muted-foreground block">Delivery Target</span>
          <span className="text-sm font-bold font-mono text-foreground mt-1 block">
            {new Date(order.deadline).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="text-xs text-muted-foreground">Confirmed with Buyer</span>
        </div>
      </div>

      {/* BOM MATERIAL RESERVATIONS */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2">
            <Boxes className="size-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">
              BOM Material Allocations & Warehouse Reservations
            </h3>
          </div>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              order.fullyReserved
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            }`}
          >
            {order.fullyReserved ? "100% RESERVED" : "MATERIAL SHORTFALL"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {order.materials.map((m: any) => (
            <div
              key={m.yarnTypeId}
              className={`p-4 rounded-xl border text-xs space-y-2 ${
                m.satisfied
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : "border-rose-500/20 bg-rose-500/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground text-sm block">
                    {m.yarnType}
                  </span>
                  <span className="font-mono text-muted-foreground text-xs">
                    Shade: {m.colour}
                  </span>
                </div>
                {m.satisfied ? (
                  <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="size-5 text-rose-600 shrink-0" />
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 font-mono text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Required:</span>
                  <span className="font-bold">{m.required} {m.unit}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Reserved:</span>
                  <span className={m.satisfied ? "text-emerald-600 font-bold" : "text-foreground font-bold"}>
                    {m.reserved} {m.unit}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Shortfall:</span>
                  <span className={m.shortfall > 0 ? "text-rose-600 font-bold" : "text-muted-foreground"}>
                    {m.shortfall > 0 ? `-${m.shortfall} ${m.unit}` : "0"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WORK ORDERS & ROLLS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border/80">
            <Cpu className="size-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">
              Manufacturing Work Orders ({order._count.workOrders})
            </h3>
          </div>
          {order.workOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No floor work orders created yet.
            </p>
          ) : (
            <div className="space-y-2">
              {order.workOrders.map((wo: any) => (
                <div
                  key={wo.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 text-xs"
                >
                  <div>
                    <span className="font-semibold">{wo.stage}</span>
                    <span className="text-muted-foreground ml-2">
                      Machine: {wo.machine?.code || "Unassigned"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                      {wo.producedQty} / {wo.targetQty} m
                    </span>
                    <StatusBadge status={wo.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border/80">
            <Layers className="size-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">
              Produced Rolls ({order._count.rolls})
            </h3>
          </div>
          {order.rolls.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No fabric rolls logged from looms yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {order.rolls.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-muted/40 text-xs"
                >
                  <span className="font-mono font-semibold">{r.rollNo}</span>
                  <span className="font-mono text-muted-foreground">{r.lengthM} m</span>
                  <StatusBadge status={r.qcStatus} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CANCEL ORDER CONFIRMATION */}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={`Cancel Order #${order.orderNo}?`}
        description="Are you sure you want to cancel this order? Held material reservations will be released back to free warehouse stock. Orders with active production output cannot be cancelled."
        confirmLabel="Confirm Cancellation"
        variant="destructive"
        isLoading={isCancelling}
        onConfirm={handleCancelOrder}
      />

      {/* SHORTFALL PURCHASE ORDER DIALOG */}
      <Dialog open={poModalOpen} onOpenChange={setPoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Raise Purchase Order for Shortfall</DialogTitle>
            <DialogDescription>
              Create a purchase order for missing yarn components required by Order #{order.orderNo}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Select Vendor / Supplier *</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl bg-muted/50 p-3 border border-border text-xs space-y-1.5">
              <span className="font-semibold block">PO Line Items to Generate:</span>
              {shortfalls.map((s: any) => (
                <div key={s.yarnTypeId} className="flex justify-between font-mono">
                  <span>{s.yarnType} ({s.colour})</span>
                  <span className="font-bold text-rose-600">
                    +{s.shortfall} {s.unit}
                  </span>
                </div>
              ))}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPoModalOpen(false)}
                disabled={isCreatingPO}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreatePOForShortfall}
                disabled={isCreatingPO}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isCreatingPO ? "Generating PO..." : "Create Purchase Order"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
