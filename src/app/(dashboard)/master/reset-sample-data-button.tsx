"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RotateCcw } from "lucide-react";
import { resetSampleDataAction } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Role } from "@prisma/client";

interface ResetSampleDataButtonProps {
  userRole?: Role;
}

export function ResetSampleDataButton({ userRole }: ResetSampleDataButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (userRole !== Role.ADMIN) {
    return null;
  }

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await resetSampleDataAction();
      if (!res.success) {
        throw new Error(res.error);
      }
      toast.success("Transactional factory data wiped and reset successfully!");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to reset sample data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-destructive hover:border-destructive/40 gap-1.5 ml-auto"
      >
        <RotateCcw className="size-3.5" />
        Reset Transactional Data
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="⚠️ Reset Operational & Transactional Data?"
        description="WARNING: This action immediately wipes all Orders, Work Orders, Production Logs, Rolls, QC Inspections, Dispatches, Invoices, and Stock Movements. Master catalogs (Suppliers, Buyers, Machines, Workers, Yarn Types) remain intact. This action cannot be undone."
        confirmLabel="Wipe & Reset"
        variant="destructive"
        isLoading={loading}
        onConfirm={handleReset}
      />
    </>
  );
}
