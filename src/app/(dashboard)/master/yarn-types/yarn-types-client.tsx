"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Role } from "@prisma/client";
import {
  yarnTypeSchema,
  bomSchema,
  YarnTypeInput,
  BomInput,
} from "@/services/schemas/master";
import {
  createYarnTypeAction,
  updateYarnTypeAction,
  upsertBOMAction,
  deleteBOMAction,
} from "../actions";
import { DataTable } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ColumnDef, PaginationState } from "@tanstack/react-table";
import { Plus, Edit2, Trash2, Layers, Binary } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface YarnTypeRow {
  id: string;
  type: string;
  colour: string;
  unit: string;
  reorderLevel: number;
  ratePerUnit: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  _count?: {
    boms: number;
    stockMovements: number;
  };
}

export interface BomRow {
  id: string;
  fabricType: string;
  yarnTypeId: string;
  yarnPerMetre: number;
  createdAt: Date | string;
  yarnType: {
    id: string;
    type: string;
    colour: string;
    unit: string;
  };
}

interface YarnTypesClientProps {
  yarnData: YarnTypeRow[];
  yarnTotal: number;
  bomData: BomRow[];
  bomTotal: number;
  currentPage: number;
  pageSize: number;
  search: string;
  activeTab: string;
  userRole: Role;
}

export function YarnTypesClient({
  yarnData,
  yarnTotal,
  bomData,
  bomTotal,
  currentPage,
  pageSize,
  search,
  activeTab,
  userRole,
}: YarnTypesClientProps) {
  const router = useRouter();
  const isAdmin = userRole === Role.ADMIN;

  const [currentTab, setCurrentTab] = useState(activeTab || "yarn");

  // Yarn Type Modal
  const [yarnDialogOpen, setYarnDialogOpen] = useState(false);
  const [editingYarn, setEditingYarn] = useState<YarnTypeRow | null>(null);

  // BOM Modal
  const [bomDialogOpen, setBomDialogOpen] = useState(false);
  const [editingBom, setEditingBom] = useState<BomRow | null>(null);
  const [deleteBomItem, setDeleteBomItem] = useState<BomRow | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Yarn Form
  const yarnForm = useForm<YarnTypeInput>({
    resolver: zodResolver(yarnTypeSchema) as any,
    defaultValues: {
      type: "",
      colour: "Raw White",
      unit: "KG",
      reorderLevel: 500,
      ratePerUnit: 280,
    },
  });

  // BOM Form
  const bomForm = useForm<BomInput>({
    resolver: zodResolver(bomSchema) as any,
    defaultValues: {
      fabricType: "",
      yarnTypeId: yarnData[0]?.id || "",
      yarnPerMetre: 0.25,
    },
  });

  const openCreateYarnDialog = () => {
    setEditingYarn(null);
    yarnForm.reset({
      type: "",
      colour: "Raw White",
      unit: "KG",
      reorderLevel: 500,
      ratePerUnit: 280,
    });
    setYarnDialogOpen(true);
  };

  const openEditYarnDialog = (yarn: YarnTypeRow) => {
    setEditingYarn(yarn);
    yarnForm.reset({
      type: yarn.type,
      colour: yarn.colour,
      unit: yarn.unit,
      reorderLevel: yarn.reorderLevel,
      ratePerUnit: yarn.ratePerUnit,
    });
    setYarnDialogOpen(true);
  };

  const openCreateBomDialog = () => {
    setEditingBom(null);
    bomForm.reset({
      fabricType: "",
      yarnTypeId: yarnData[0]?.id || "",
      yarnPerMetre: 0.25,
    });
    setBomDialogOpen(true);
  };

  const openEditBomDialog = (bom: BomRow) => {
    setEditingBom(bom);
    bomForm.reset({
      fabricType: bom.fabricType,
      yarnTypeId: bom.yarnTypeId,
      yarnPerMetre: bom.yarnPerMetre,
    });
    setBomDialogOpen(true);
  };

  const onYarnSubmit = async (data: YarnTypeInput) => {
    setIsSubmitting(true);
    try {
      if (editingYarn) {
        const res = await updateYarnTypeAction(editingYarn.id, data);
        if (!res.success) throw new Error(res.error);
        toast.success(`Yarn specification updated successfully`);
      } else {
        const res = await createYarnTypeAction(data);
        if (!res.success) throw new Error(res.error);
        toast.success(`Yarn specification registered successfully`);
      }
      setYarnDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save yarn type");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onBomSubmit = async (data: BomInput) => {
    setIsSubmitting(true);
    try {
      const res = await upsertBOMAction(data);
      if (!res.success) throw new Error(res.error);
      toast.success(`BOM ratio configured for ${data.fabricType}`);
      setBomDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to save BOM ratio");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBom = async () => {
    if (!deleteBomItem) return;
    setIsSubmitting(true);
    try {
      const res = await deleteBOMAction(deleteBomItem.id);
      if (!res.success) throw new Error(res.error);
      toast.success(`BOM specification removed`);
      setDeleteBomItem(null);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to remove BOM");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = (term: string) => {
    const params = new URLSearchParams();
    if (term) params.set("search", term);
    params.set("tab", currentTab);
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    router.push(`/master/yarn-types?${params.toString()}`);
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    const params = new URLSearchParams();
    params.set("tab", tab);
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    router.push(`/master/yarn-types?${params.toString()}`);
  };

  const onPaginationChange = (nextPagination: PaginationState) => {
    const params = new URLSearchParams();
    params.set("tab", currentTab);
    params.set("page", String(nextPagination.pageIndex + 1));
    params.set("pageSize", String(nextPagination.pageSize));
    if (search) params.set("search", search);
    router.push(`/master/yarn-types?${params.toString()}`);
  };

  const yarnColumns: ColumnDef<YarnTypeRow>[] = [
    {
      accessorKey: "type",
      header: "Yarn Count / Composition",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-primary shrink-0" />
          <span className="font-medium text-foreground">{row.original.type}</span>
        </div>
      ),
    },
    {
      accessorKey: "colour",
      header: "Colour / Shade",
      cell: ({ row }) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-muted border border-border">
          {row.original.colour}
        </span>
      ),
    },
    {
      accessorKey: "ratePerUnit",
      header: "Standard Rate",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">
          ₹{row.original.ratePerUnit.toFixed(2)} / {row.original.unit}
        </span>
      ),
    },
    {
      accessorKey: "reorderLevel",
      header: "Min Reorder Level",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.reorderLevel.toLocaleString()} {row.original.unit}
        </span>
      ),
    },
    ...(isAdmin
      ? [
          {
            id: "actions",
            header: () => <span className="text-right block">Actions</span>,
            cell: ({ row }: { row: { original: YarnTypeRow } }) => {
              const yarn = row.original;
              return (
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEditYarnDialog(yarn)}
                    title="Edit yarn specification"
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                </div>
              );
            },
          },
        ]
      : []),
  ];

  const bomColumns: ColumnDef<BomRow>[] = [
    {
      accessorKey: "fabricType",
      header: "Fabric Quality / Type",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Binary className="size-4 text-emerald-600 shrink-0" />
          <span className="font-medium text-foreground">
            {row.original.fabricType}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "yarnType",
      header: "Required Yarn Component",
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-sm text-foreground">
            {row.original.yarnType.type}
          </span>
          <span className="ml-2 font-mono text-xs text-muted-foreground">
            ({row.original.yarnType.colour})
          </span>
        </div>
      ),
    },
    {
      accessorKey: "yarnPerMetre",
      header: "BOM Ratio (kg / metre)",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-semibold text-primary">
          {row.original.yarnPerMetre.toFixed(4)} {row.original.yarnType.unit}/m
        </span>
      ),
    },
    ...(isAdmin
      ? [
          {
            id: "actions",
            header: () => <span className="text-right block">Actions</span>,
            cell: ({ row }: { row: { original: BomRow } }) => {
              const bom = row.original;
              return (
                <div className="flex items-center justify-end gap-1.5">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openEditBomDialog(bom)}
                    title="Edit BOM ratio"
                  >
                    <Edit2 className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setDeleteBomItem(bom)}
                    className="text-destructive hover:bg-destructive/10"
                    title="Delete BOM ratio"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <TabsList className="bg-muted/70 p-1 rounded-xl">
            <TabsTrigger value="yarn" className="gap-2 text-sm px-4 py-1.5 rounded-lg">
              <Layers className="size-4" />
              Yarn Specifications ({yarnTotal})
            </TabsTrigger>
            <TabsTrigger value="bom" className="gap-2 text-sm px-4 py-1.5 rounded-lg">
              <Binary className="size-4" />
              BOM Formula Ratios ({bomTotal})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Input
              placeholder={
                currentTab === "yarn"
                  ? "Search yarn count, shade..."
                  : "Search fabric type or yarn..."
              }
              defaultValue={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full sm:w-64 h-9 text-sm rounded-xl"
            />

            {isAdmin && (
              <Button
                onClick={currentTab === "yarn" ? openCreateYarnDialog : openCreateBomDialog}
                size="sm"
                className="gap-2 rounded-xl shrink-0"
              >
                <Plus className="size-4" />
                {currentTab === "yarn" ? "Add Yarn Type" : "Add BOM Ratio"}
              </Button>
            )}
          </div>
        </div>

        <TabsContent value="yarn" className="m-0">
          <DataTable
            columns={yarnColumns}
            data={yarnData}
            emptyTitle="No Yarn Types Configured"
            emptyDescription="Create standard cotton, polyester, viscose, or blend yarn types."
            serverPagination={{
              pageIndex: currentPage - 1,
              pageSize,
              pageCount: Math.ceil(yarnTotal / pageSize) || 1,
              totalCount: yarnTotal,
              onPaginationChange,
            }}
          />
        </TabsContent>

        <TabsContent value="bom" className="m-0">
          <DataTable
            columns={bomColumns}
            data={bomData}
            emptyTitle="No BOM Ratios Configured"
            emptyDescription="Configure Bill of Materials (BOM) linking fabric types to required yarn weights per metre."
            serverPagination={{
              pageIndex: currentPage - 1,
              pageSize,
              pageCount: Math.ceil(bomTotal / pageSize) || 1,
              totalCount: bomTotal,
              onPaginationChange,
            }}
          />
        </TabsContent>
      </Tabs>

      {/* CREATE / EDIT YARN DIALOG */}
      <Dialog open={yarnDialogOpen} onOpenChange={setYarnDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingYarn ? "Edit Yarn Type" : "Add New Yarn Specification"}
            </DialogTitle>
            <DialogDescription>
              Specify count, composition, standard cost, and warehouse reorder levels.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={yarnForm.handleSubmit(onYarnSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="yarn-type">Count / Composition *</Label>
              <Input
                id="yarn-type"
                placeholder="e.g., 40s Combed Compact Cotton"
                {...yarnForm.register("type")}
              />
              {yarnForm.formState.errors.type && (
                <p className="text-destructive text-xs">
                  {yarnForm.formState.errors.type.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="yarn-colour">Colour / Shade *</Label>
                <Input
                  id="yarn-colour"
                  placeholder="e.g., Bleached White / Melange"
                  {...yarnForm.register("colour")}
                />
                {yarnForm.formState.errors.colour && (
                  <p className="text-destructive text-xs">
                    {yarnForm.formState.errors.colour.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="yarn-unit">Unit *</Label>
                <Input
                  id="yarn-unit"
                  placeholder="KG"
                  {...yarnForm.register("unit")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ratePerUnit">Standard Rate (₹/unit) *</Label>
                <Input
                  id="ratePerUnit"
                  type="number"
                  step="0.01"
                  placeholder="280.00"
                  {...yarnForm.register("ratePerUnit", { valueAsNumber: true })}
                />
                {yarnForm.formState.errors.ratePerUnit && (
                  <p className="text-destructive text-xs">
                    {yarnForm.formState.errors.ratePerUnit.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reorderLevel">Min Reorder Level *</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  step="0.01"
                  placeholder="500.00"
                  {...yarnForm.register("reorderLevel", { valueAsNumber: true })}
                />
                {yarnForm.formState.errors.reorderLevel && (
                  <p className="text-destructive text-xs">
                    {yarnForm.formState.errors.reorderLevel.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setYarnDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingYarn ? "Save Changes" : "Create Yarn Type"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE / EDIT BOM DIALOG */}
      <Dialog open={bomDialogOpen} onOpenChange={setBomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBom ? "Edit BOM Ratio" : "Define BOM Consumption"}
            </DialogTitle>
            <DialogDescription>
              Link a finished fabric grade to the specific quantity of yarn required per linear metre.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={bomForm.handleSubmit(onBomSubmit)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="bom-fabric">Fabric Quality / Grade *</Label>
              <Input
                id="bom-fabric"
                placeholder="e.g., 100% Cotton Poplin 40s x 40s"
                {...bomForm.register("fabricType")}
              />
              {bomForm.formState.errors.fabricType && (
                <p className="text-destructive text-xs">
                  {bomForm.formState.errors.fabricType.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bom-yarn">Yarn Type Component *</Label>
              <select
                id="bom-yarn"
                {...bomForm.register("yarnTypeId")}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {yarnData.length === 0 && (
                  <option value="">No yarn types available</option>
                )}
                {yarnData.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.type} ({y.colour})
                  </option>
                ))}
              </select>
              {bomForm.formState.errors.yarnTypeId && (
                <p className="text-destructive text-xs">
                  {bomForm.formState.errors.yarnTypeId.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bom-ratio">Yarn Required per Metre (KG) *</Label>
              <Input
                id="bom-ratio"
                type="number"
                step="0.0001"
                placeholder="0.2250"
                {...bomForm.register("yarnPerMetre", { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Example: 0.225 kg of yarn yields 1 linear metre of fabric.
              </p>
              {bomForm.formState.errors.yarnPerMetre && (
                <p className="text-destructive text-xs">
                  {bomForm.formState.errors.yarnPerMetre.message}
                </p>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBomDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save BOM Formula"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE BOM CONFIRMATION */}
      <ConfirmDialog
        open={!!deleteBomItem}
        onOpenChange={(open) => !open && setDeleteBomItem(null)}
        title="Delete BOM Ratio?"
        description={`Are you sure you want to remove the consumption formula for "${deleteBomItem?.fabricType}"? Automated yarn reservations for this fabric will fail until a new formula is created.`}
        confirmLabel="Delete BOM"
        variant="destructive"
        isLoading={isSubmitting}
        onConfirm={handleDeleteBom}
      />
    </div>
  );
}
