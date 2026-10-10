"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  planProductionSchema,
  PlanProductionInput,
} from "@/services/schemas/production";
import { planProductionAction } from "../actions";
import { PageHeader } from "@/components/shared/page-header";
import { ProductionTabs } from "../production-tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  Cpu,
  Layers,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface PlanProductionClientProps {
  orders: Array<{
    id: string;
    orderNo: string;
    fabricType: string;
    colour: string;
    qtyMetres: number;
    deadline: string;
    buyerName: string;
  }>;
  idleMachines: {
    spinning: Array<{ id: string; code: string; name: string | null }>;
    weaving: Array<{ id: string; code: string; name: string | null }>;
    dyeing: Array<{ id: string; code: string; name: string | null }>;
  };
}

export function PlanProductionClient({
  orders,
  idleMachines,
}: PlanProductionClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(
    orders[0]?.id || ""
  );

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PlanProductionInput>({
    resolver: zodResolver(planProductionSchema) as any,
    defaultValues: {
      orderId: orders[0]?.id || "",
      spinningMachineId: idleMachines.spinning[0]?.id || "",
      weavingMachineId: idleMachines.weaving[0]?.id || "",
      dyeingMachineId: idleMachines.dyeing[0]?.id || "",
    },
  });

  const onSubmit = async (data: PlanProductionInput) => {
    setIsSubmitting(true);
    try {
      const res = await planProductionAction(data);
      if (!res.success) throw new Error(res.error);

      toast.success(
        `Production scheduled! 3 work orders created for Order #${selectedOrder?.orderNo}`
      );
      router.push("/production/work-orders");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule production");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasNoMachines =
    idleMachines.spinning.length === 0 ||
    idleMachines.weaving.length === 0 ||
    idleMachines.dyeing.length === 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Production Scheduling & Planning"
        description="Allocate confirmed manufacturing orders across available idle spinning, weaving, and dyeing machines."
      />

      <ProductionTabs />

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-3">
          <CalendarCheck className="size-10 text-muted-foreground mx-auto" />
          <h3 className="font-semibold text-base">No Orders Awaiting Planning</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            All confirmed customer orders have either already been scheduled into work orders, or are waiting for yarn procurement.
          </p>
          <div className="pt-2">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
            >
              View Orders
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* PLANNING FORM */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="orderId">Select Confirmed Order *</Label>
              <select
                id="orderId"
                {...register("orderId")}
                value={selectedOrderId}
                onChange={(e) => {
                  setSelectedOrderId(e.target.value);
                  setValue("orderId", e.target.value);
                }}
                className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    Order #{o.orderNo} — {o.fabricType} ({o.qtyMetres.toLocaleString()} m)
                  </option>
                ))}
              </select>
              {errors.orderId && (
                <p className="text-destructive text-xs">{errors.orderId.message}</p>
              )}
            </div>

            {hasNoMachines && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400 flex items-start gap-2.5">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>
                  One or more stages currently have no IDLE machines available. Complete or resume current work orders before planning.
                </span>
              </div>
            )}

            {/* STAGE MACHINE SELECTIONS */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Machine Floor Allocation
              </h4>

              {/* Stage 1: Spinning */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label htmlFor="spinningMachineId">Stage 1: Spinning Machine *</Label>
                  <span className="text-muted-foreground font-mono">
                    {idleMachines.spinning.length} Idle
                  </span>
                </div>
                <select
                  id="spinningMachineId"
                  {...register("spinningMachineId")}
                  disabled={idleMachines.spinning.length === 0}
                  className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  {idleMachines.spinning.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} {m.name ? `(${m.name})` : ""}
                    </option>
                  ))}
                </select>
                {errors.spinningMachineId && (
                  <p className="text-destructive text-xs">
                    {errors.spinningMachineId.message}
                  </p>
                )}
              </div>

              {/* Stage 2: Weaving */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label htmlFor="weavingMachineId">Stage 2: Weaving Loom *</Label>
                  <span className="text-muted-foreground font-mono">
                    {idleMachines.weaving.length} Idle
                  </span>
                </div>
                <select
                  id="weavingMachineId"
                  {...register("weavingMachineId")}
                  disabled={idleMachines.weaving.length === 0}
                  className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  {idleMachines.weaving.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} {m.name ? `(${m.name})` : ""}
                    </option>
                  ))}
                </select>
                {errors.weavingMachineId && (
                  <p className="text-destructive text-xs">
                    {errors.weavingMachineId.message}
                  </p>
                )}
              </div>

              {/* Stage 3: Dyeing */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <Label htmlFor="dyeingMachineId">Stage 3: Dyeing Vessel *</Label>
                  <span className="text-muted-foreground font-mono">
                    {idleMachines.dyeing.length} Idle
                  </span>
                </div>
                <select
                  id="dyeingMachineId"
                  {...register("dyeingMachineId")}
                  disabled={idleMachines.dyeing.length === 0}
                  className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                >
                  {idleMachines.dyeing.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} {m.name ? `(${m.name})` : ""}
                    </option>
                  ))}
                </select>
                {errors.dyeingMachineId && (
                  <p className="text-destructive text-xs">
                    {errors.dyeingMachineId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-3 border-t border-border">
              <Button
                type="submit"
                disabled={isSubmitting || hasNoMachines}
                className="gap-2"
              >
                <ArrowRight className="size-4" />
                {isSubmitting ? "Generating Work Orders..." : "Confirm Production Plan"}
              </Button>
            </div>
          </form>

          {/* ORDER SPECIFICATION SIDEBAR */}
          <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              Order Parameters
            </h3>

            {selectedOrder ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-muted/50 border border-border/80 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Ref:</span>
                    <span className="font-mono font-bold text-foreground">
                      #{selectedOrder.orderNo}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Client:</span>
                    <span className="font-semibold text-foreground">
                      {selectedOrder.buyerName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Target Fabric:</span>
                    <span className="font-medium text-foreground">
                      {selectedOrder.fabricType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Colour Shade:</span>
                    <span className="font-mono text-foreground">
                      {selectedOrder.colour}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Production Target:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedOrder.qtyMetres.toLocaleString()} metres
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Deadline:</span>
                    <span className="font-mono text-muted-foreground">
                      {new Date(selectedOrder.deadline).toLocaleDateString("en-IN", {
                        dateStyle: "medium",
                      })}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs">
                  Scheduling creates 3 sequential WorkOrders for this order. Starting the first stage will transition the order to <strong>IN_PRODUCTION</strong>.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
