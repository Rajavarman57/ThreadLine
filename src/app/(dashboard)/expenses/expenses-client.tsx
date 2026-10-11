"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaginatedExpenses } from "@/services/expenses";
import { createExpenseAction } from "./actions";
import { ExpenseCategory } from "@/services/schemas/expenses";
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
  CircleDollarSign,
  Plus,
  Loader2,
  Calendar,
  Layers,
  Zap,
  Wrench,
  Truck,
  Building,
  HelpCircle,
} from "lucide-react";

interface ExpensesClientProps {
  initialData: PaginatedExpenses;
  orders: Array<{ id: string; orderNo: string }>;
  canCreate: boolean;
  selectedCategory?: string;
  selectedMonth?: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  ELECTRICITY: Zap,
  MAINTENANCE: Wrench,
  TRANSPORT: Truck,
  RENT: Building,
  OTHER: HelpCircle,
};

export function ExpensesClient({
  initialData,
  orders,
  canCreate,
  selectedCategory = "",
  selectedMonth = "",
}: ExpensesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>("ELECTRICITY");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [orderId, setOrderId] = useState("");
  const [note, setNote] = useState("");

  // Filters
  const [categoryFilter, setCategoryFilter] = useState(selectedCategory);
  const [monthFilter, setMonthFilter] = useState(selectedMonth);

  function handleFilterChange(cat: string, mon: string) {
    setCategoryFilter(cat);
    setMonthFilter(mon);

    const params = new URLSearchParams();
    if (cat) params.set("category", cat);
    if (mon) params.set("month", mon);
    router.push(`/expenses?${params.toString()}`);
  }

  const [expenseErrors, setExpenseErrors] = useState<{ amount?: string; date?: string }>({});

  function handleCreateExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreate) {
      toast.error("You do not have permission to record expenses.");
      return;
    }
    setExpenseErrors({});

    const numAmount = parseFloat(amount);
    const errors: { amount?: string; date?: string } = {};

    if (isNaN(numAmount) || numAmount <= 0) {
      errors.amount = "Amount must be greater than 0";
    } else if (Math.round(numAmount * 100) !== numAmount * 100) {
      errors.amount = "Amount can have at most 2 decimal places";
    }

    const todayKolkata = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    if (!date) {
      errors.date = "Expense date is required";
    } else if (date.slice(0, 10) > todayKolkata) {
      errors.date = "Date cannot be in the future";
    }

    if (Object.keys(errors).length > 0) {
      setExpenseErrors(errors);
      return;
    }

    startTransition(async () => {
      const res = await createExpenseAction({
        category,
        amount: numAmount,
        date,
        orderId: orderId || null,
        note: note.trim() || null,
      });

      if (res.success) {
        toast.success(`Expense of ₹${numAmount.toLocaleString()} recorded.`);
        setIsOpen(false);
        setAmount("");
        setNote("");
        setOrderId("");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Filter and Create Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              Filter Category:
            </Label>
            <select
              value={categoryFilter}
              onChange={(e) => handleFilterChange(e.target.value, monthFilter)}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-medium"
            >
              <option value="">All Categories</option>
              <option value="ELECTRICITY">Electricity & Power</option>
              <option value="MAINTENANCE">Machine Maintenance</option>
              <option value="TRANSPORT">Logistics & Transport</option>
              <option value="RENT">Factory & Facility Rent</option>
              <option value="OTHER">Other Operational</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">
              Month:
            </Label>
            <Input
              type="month"
              value={monthFilter}
              onChange={(e) => handleFilterChange(categoryFilter, e.target.value)}
              className="h-8 text-xs w-36"
            />
          </div>
        </div>

        {canCreate && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger
              render={
                <Button size="sm" className="gap-1.5 text-xs font-semibold">
                  <Plus className="size-3.5" />
                  Log New Expense
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleCreateExpense}>
                <DialogHeader>
                  <DialogTitle>Log Operational Expense</DialogTitle>
                  <DialogDescription>
                    Record overhead, facility, maintenance, or logistics costs.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 text-xs">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Expense Category</Label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                      required
                    >
                      <option value="ELECTRICITY">Electricity & Power</option>
                      <option value="MAINTENANCE">Machine Maintenance</option>
                      <option value="TRANSPORT">Logistics & Transport</option>
                      <option value="RENT">Factory & Facility Rent</option>
                      <option value="OTHER">Other Operational Expense</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Amount (INR)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="e.g. 15000"
                        value={amount}
                        onChange={(e) => {
                          setAmount(e.target.value);
                          if (expenseErrors.amount) setExpenseErrors((prev) => ({ ...prev, amount: undefined }));
                        }}
                        required
                        className="h-9 text-xs"
                      />
                      {expenseErrors.amount && (
                        <p className="text-destructive text-xs">{expenseErrors.amount}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Expense Date</Label>
                      <Input
                        type="date"
                        value={date}
                        onChange={(e) => {
                          setDate(e.target.value);
                          if (expenseErrors.date) setExpenseErrors((prev) => ({ ...prev, date: undefined }));
                        }}
                        required
                        className="h-9 text-xs"
                      />
                      {expenseErrors.date && (
                        <p className="text-destructive text-xs">{expenseErrors.date}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Associated Order (Optional)
                    </Label>
                    <select
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                    >
                      <option value="">General Mill Overhead (None)</option>
                      {orders.map((o) => (
                        <option key={o.id} value={o.id}>
                          Order {o.orderNo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Note / Memo</Label>
                    <Input
                      placeholder="e.g. Generator diesel refill for loom breakdown"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="text-xs font-semibold gap-1.5"
                  >
                    {isPending ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CircleDollarSign className="size-3.5" />
                    )}
                    Save Expense
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Category Totals Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="col-span-2 sm:col-span-1 bg-card border border-border p-3.5 rounded-xl shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground">
            Total Incurred
          </span>
          <div className="mt-1">
            <span className="text-lg font-bold tracking-tight text-foreground">
              ₹{initialData.monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {Object.entries(initialData.categoryTotals).map(([cat, total]) => {
          const Icon = CATEGORY_ICONS[cat] || HelpCircle;
          return (
            <div
              key={cat}
              className="bg-card border border-border p-3 rounded-xl shadow-xs"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Icon className="size-3 text-muted-foreground" />
                <span>{cat}</span>
              </div>
              <div className="mt-1">
                <span className="text-sm font-bold tracking-tight text-foreground">
                  ₹{total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expenses Table */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Associated Order</th>
                <th className="py-3 px-4">Note / Memo</th>
                <th className="py-3 px-4 text-right">Amount (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {initialData.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                initialData.items.map((item) => {
                  const Icon = CATEGORY_ICONS[item.category] || HelpCircle;
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono text-muted-foreground">
                        {item.date}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-foreground border border-border">
                          <Icon className="size-3 text-muted-foreground" />
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-muted-foreground">
                        {item.orderNo ? (
                          <span className="font-semibold text-primary">
                            {item.orderNo}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60 italic">
                            Factory Overhead
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                        {item.note || "—"}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-foreground">
                        ₹{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {initialData.items.length > 0 && (
              <tfoot>
                <tr className="bg-muted/40 font-semibold border-t-2 border-border text-foreground">
                  <td colSpan={4} className="py-3 px-4 text-right">
                    Subtotal:
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ₹{initialData.monthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
