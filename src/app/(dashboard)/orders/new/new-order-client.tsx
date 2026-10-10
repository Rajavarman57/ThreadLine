"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createOrderSchema,
  CreateOrderInput,
} from "@/services/schemas/orders";
import { createOrderAction, checkFeasibilityAction } from "../actions";
import { FeasibilityResult } from "@/services/feasibility";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  ShoppingCart,
} from "lucide-react";

interface NewOrderClientProps {
  buyers: Array<{ id: string; name: string }>;
  fabricTypes: string[];
}

export function NewOrderClient({ buyers, fabricTypes }: NewOrderClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feasibility, setFeasibility] = useState<FeasibilityResult | null>(null);

  const defaultDeadline = new Date(Date.now() + 14 * 86400000)
    .toISOString()
    .split("T")[0];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema) as any,
    defaultValues: {
      buyerId: buyers[0]?.id || "",
      fabricType: fabricTypes[0] || "",
      colour: "Optic White",
      qtyMetres: 2000,
      ratePerMetre: 185,
      deadline: defaultDeadline,
    },
  });

  const watchedFabric = watch("fabricType");
  const watchedQty = watch("qtyMetres");

  // Debounced Feasibility Check while typing
  useEffect(() => {
    if (!watchedFabric || !watchedQty || watchedQty <= 0) return;

    const timer = setTimeout(() => {
      startTransition(async () => {
        const res = await checkFeasibilityAction({
          fabricType: watchedFabric,
          qtyMetres: watchedQty,
        });
        if (res.success) {
          setFeasibility(res.data);
        }
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [watchedFabric, watchedQty]);

  const onSubmit = async (data: CreateOrderInput) => {
    setIsSubmitting(true);
    try {
      const res = await createOrderAction(data);
      if (!res.success) throw new Error(res.error);

      if (res.data.reservationResult?.ok) {
        toast.success(
          `Order #${res.data.orderNo} confirmed with 100% material reserved!`
        );
      } else {
        toast.warning(
          `Order #${res.data.orderNo} created, but yarn shortfalls require procurement.`
        );
      }

      router.push(`/orders/${res.data.id}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/orders"
          className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <PageHeader
          title="Book Customer Order"
          description="Enter commercial contract parameters, inspect live yarn feasibility, and auto-reserve stock."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FORM */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="lg:col-span-7 rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="buyerId">Client / Apparel Brand *</Label>
            <select
              id="buyerId"
              {...register("buyerId")}
              className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {buyers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            {errors.buyerId && (
              <p className="text-destructive text-xs">{errors.buyerId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fabricType">Fabric Quality (BOM Grade) *</Label>
            <select
              id="fabricType"
              {...register("fabricType")}
              className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {fabricTypes.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            {errors.fabricType && (
              <p className="text-destructive text-xs">
                {errors.fabricType.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="colour">Colour / Shade *</Label>
              <Input
                id="colour"
                placeholder="e.g. Navy Melange, Raw White"
                {...register("colour")}
              />
              {errors.colour && (
                <p className="text-destructive text-xs">{errors.colour.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qtyMetres">Quantity (Linear Metres) *</Label>
              <Input
                id="qtyMetres"
                type="number"
                step="1"
                placeholder="2000"
                {...register("qtyMetres", { valueAsNumber: true })}
              />
              {errors.qtyMetres && (
                <p className="text-destructive text-xs">
                  {errors.qtyMetres.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ratePerMetre">Agreed Rate (₹/metre) *</Label>
              <Input
                id="ratePerMetre"
                type="number"
                step="0.01"
                placeholder="185.00"
                {...register("ratePerMetre", { valueAsNumber: true })}
              />
              {errors.ratePerMetre && (
                <p className="text-destructive text-xs">
                  {errors.ratePerMetre.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deadline">Target Delivery Deadline *</Label>
              <Input id="deadline" type="date" {...register("deadline")} />
              {errors.deadline && (
                <p className="text-destructive text-xs">
                  {errors.deadline.message}
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-3 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/orders")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Confirming..." : "Confirm & Save Order"}
            </Button>
          </div>
        </form>

        {/* LIVE FEASIBILITY PANEL */}
        <div className="lg:col-span-5 rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                <Boxes className="size-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">
                  Live Material Feasibility
                </h3>
              </div>
              {feasibility && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    feasibility.feasible
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {feasibility.feasible ? "100% FEASIBLE" : "SHORTFALL DETECTED"}
                </span>
              )}
            </div>

            <div className="mt-4 space-y-3">
              {!feasibility ? (
                <p className="text-xs text-muted-foreground">
                  Select fabric and quantity to compute required yarn components.
                </p>
              ) : feasibility.lines.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No BOM ratio configured for {feasibility.fabricType}.
                </p>
              ) : (
                feasibility.lines.map((line) => (
                  <div
                    key={line.yarnTypeId}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                      line.feasible
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-rose-500/20 bg-rose-500/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">
                        {line.yarnType}
                      </span>
                      <span className="font-mono text-muted-foreground text-[11px]">
                        ({line.colour})
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/40 font-mono text-[11px]">
                      <div>
                        <span className="text-muted-foreground block">Req:</span>
                        <span className="font-bold">{line.required} {line.unit}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Avail:</span>
                        <span className={line.feasible ? "text-emerald-600 font-bold" : "text-foreground font-bold"}>
                          {line.available} {line.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Shortfall:</span>
                        <span className={line.shortfall > 0 ? "text-rose-600 font-bold" : "text-muted-foreground"}>
                          {line.shortfall > 0 ? `-${line.shortfall} ${line.unit}` : "0"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {feasibility && !feasibility.feasible && (
            <div className="mt-4 pt-3 border-t border-border/80">
              <div className="flex items-center gap-2 text-rose-600 text-xs font-medium mb-2">
                <AlertTriangle className="size-4 shrink-0" />
                <span>Shortfall detected. An automatic purchase order can be raised upon saving.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
