import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getExpensesList } from "@/services/expenses";
import { ExpenseCategory } from "@/services/schemas/expenses";
import { ExpensesClient } from "./expenses-client";
import { PageHeader } from "@/components/shared/page-header";

export const dynamic = "force-dynamic";

interface ExpensesPageProps {
  searchParams: Promise<{
    category?: string;
    month?: string;
    page?: string;
  }>;
}

export default async function ExpensesPage({ searchParams }: ExpensesPageProps) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;
  const canCreate = role === "ADMIN" || role === "ACCOUNTS";

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const category = (params.category as ExpenseCategory) || undefined;
  const month = params.month || undefined;

  const [expensesData, orders] = await Promise.all([
    getExpensesList({
      page,
      pageSize: 50,
      category,
      month,
    }),
    prisma.order.findMany({
      select: { id: true, orderNo: true },
      orderBy: { orderNo: "desc" },
    }),
  ]);

  return (
    <div className="flex-1 space-y-6 p-6">
      <PageHeader
        title="Operational & Facility Expenses"
        description="Log operational costs across utility, dyes/chemicals, machine maintenance, and overhead allocations. Tie expenses to customer orders for gross margin reporting."
      />

      <ExpensesClient
        initialData={expensesData}
        orders={orders}
        canCreate={canCreate}
        selectedCategory={params.category}
        selectedMonth={params.month}
      />
    </div>
  );
}
