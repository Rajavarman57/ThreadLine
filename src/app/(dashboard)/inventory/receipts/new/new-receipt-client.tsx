"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  goodsReceiptSchema,
  GoodsReceiptInput,
} from "@/services/schemas/inventory";
import { createGoodsReceiptAction } from "../../actions";
import { PageHeader } from "@/components/shared/page-header";
import { InventoryTabs } from "../../inventory-tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface NewReceiptClientProps {
  yarnTypes: Array<{
    id: string;
    type: string;
    colour: string;
    unit: string;
  }>;
  suppliers: Array<{
    id: string;
    name: string;
  }>;
  openPOLines: Array<{
    id: string;
    poNo: string;
    yarnType: string;
    remainingQty: number;
    unit: string;
  }>;
  orders: Array<{
    id: string;
    orderNo: string;
  }>;
}

export function NewReceiptClient({
  yarnTypes,
  suppliers,
  openPOLines,
  orders,
}: NewReceiptClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GoodsReceiptInput>({
    resolver: zodResolver(goodsReceiptSchema) as any,
    defaultValues: {
      yarnTypeId: yarnTypes[0]?.id || "",
      qty: 500,
      vehicleNo: "",
      supplierId: "",
      poLineId: "",
      orderId: "",
    },
  });

  const selectedYarnId = watch("yarnTypeId");
  const selectedYarn = yarnTypes.find((y) => y.id === selectedYarnId);

  const onSubmit = async (data: GoodsReceiptInput) => {
    setIsSubmitting(true);
    try {
      const res = await createGoodsReceiptAction(data);
      if (!res.success) throw new Error(res.error);
      toast.success(
        `Goods Receipt recorded: ${data.qty} ${selectedYarn?.unit || "KG"} received into warehouse stock`
      );
      router.push("/inventory");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to record goods receipt");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/inventory"
          className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <PageHeader
          title="Receive Goods (Inwards GRN)"
          description="Log yarn delivery from vendor, append signed receipt movement, and satisfy open PO lines."
        />
      </div>

      <InventoryTabs />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5"
      >
        {/* Yarn Type */}
        <div className="space-y-1.5">
          <Label htmlFor="yarnTypeId">Yarn Specification *</Label>
          <select
            id="yarnTypeId"
            {...register("yarnTypeId")}
            className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {yarnTypes.map((y) => (
              <option key={y.id} value={y.id}>
                {y.type} ({y.colour})
              </option>
            ))}
          </select>
          {errors.yarnTypeId && (
            <p className="text-destructive text-xs">{errors.yarnTypeId.message}</p>
          )}
        </div>

        {/* Quantity & Unit */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="qty">
              Delivered Quantity ({selectedYarn?.unit || "KG"}) *
            </Label>
            <Input
              id="qty"
              type="number"
              step="0.01"
              placeholder="e.g. 500.00"
              {...register("qty", { valueAsNumber: true })}
            />
            {errors.qty && (
              <p className="text-destructive text-xs">{errors.qty.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="vehicleNo">Transport Vehicle Number</Label>
            <Input
              id="vehicleNo"
              placeholder="e.g. TN 38 BH 4521"
              {...register("vehicleNo")}
            />
          </div>
        </div>

        {/* Supplier */}
        <div className="space-y-1.5">
          <Label htmlFor="supplierId">Delivering Supplier (Optional)</Label>
          <select
            id="supplierId"
            {...register("supplierId")}
            className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select vendor / supplier (optional)</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Optional Linked PO Line */}
        {openPOLines.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="poLineId">Linked Purchase Order Line (Optional)</Label>
            <select
              id="poLineId"
              {...register("poLineId")}
              className="w-full h-10 rounded-xl border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Direct delivery (not against open PO line)</option>
              {openPOLines.map((po) => (
                <option key={po.id} value={po.id}>
                  PO #{po.poNo} - {po.yarnType} (Remaining: {po.remainingQty}{" "}
                  {po.unit})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              Linking a PO line automatically updates its received quantity and order status.
            </p>
          </div>
        )}

        <div className="pt-2 flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/inventory")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="size-4" />
            {isSubmitting ? "Receiving..." : "Post Goods Receipt"}
          </Button>
        </div>
      </form>
    </div>
  );
}
