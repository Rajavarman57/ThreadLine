import { prisma } from "@/lib/db";
import { Role, Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import {
  createExpenseSchema,
  CreateExpenseInput,
  expenseListFilterSchema,
  ExpenseListFilterInput,
  ExpenseCategory,
} from "./schemas/expenses";

// ----------------------------------------------------------------------------
// 1. EXPENSES CRUD & LISTING
// ----------------------------------------------------------------------------

export interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  date: string;
  orderId: string | null;
  orderNo: string | null;
  note: string | null;
  createdAt: string;
}

export interface PaginatedExpenses {
  items: ExpenseItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categoryTotals: Record<string, number>;
  monthlyTotal: number;
}

export async function getExpensesList(
  input: ExpenseListFilterInput
): Promise<PaginatedExpenses> {
  await requireRole([
    Role.ADMIN,
    Role.ACCOUNTS,
    Role.STORE,
    Role.SUPERVISOR,
  ]);

  const validated = expenseListFilterSchema.parse(input);
  const { page, pageSize, category, month } = validated;

  const whereClause: Prisma.ExpenseWhereInput = {};

  if (category) {
    whereClause.category = category;
  }

  if (month) {
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
    const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

    whereClause.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  const [expenses, total, allMonthExpenses] = await Promise.all([
    prisma.expense.findMany({
      where: whereClause,
      include: {
        order: {
          select: { id: true, orderNo: true },
        },
      },
      orderBy: { date: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.expense.count({ where: whereClause }),
    prisma.expense.findMany({
      where: whereClause,
      select: { category: true, amount: true },
    }),
  ]);

  const categoryTotals: Record<string, number> = {
    ELECTRICITY: 0,
    MAINTENANCE: 0,
    TRANSPORT: 0,
    RENT: 0,
    OTHER: 0,
  };

  let monthlyTotal = 0;
  for (const exp of allMonthExpenses) {
    const amt = Number(exp.amount);
    monthlyTotal += amt;
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amt;
  }

  const items: ExpenseItem[] = expenses.map((e) => ({
    id: e.id,
    category: e.category,
    amount: Number(e.amount),
    date: e.date.toISOString().split("T")[0],
    orderId: e.orderId,
    orderNo: e.order?.orderNo || null,
    note: e.note,
    createdAt: e.createdAt.toISOString(),
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    categoryTotals,
    monthlyTotal: Number(monthlyTotal.toFixed(2)),
  };
}

export async function createExpense(
  input: CreateExpenseInput
): Promise<ExpenseItem> {
  const user = await requireRole([Role.ADMIN, Role.ACCOUNTS]);
  const validated = createExpenseSchema.parse(input);

  const expense = await prisma.expense.create({
    data: {
      category: validated.category,
      amount: validated.amount,
      date: new Date(validated.date),
      orderId: validated.orderId || null,
      note: validated.note || null,
    },
    include: {
      order: {
        select: { id: true, orderNo: true },
      },
    },
  });

  await logAction({
    userId: user.id,
    action: "EXPENSE_CREATED",
    entity: "Expense",
    entityId: expense.id,
    meta: {
      category: expense.category,
      amount: Number(expense.amount),
      date: expense.date.toISOString(),
      orderId: expense.orderId,
    },
  });

  return {
    id: expense.id,
    category: expense.category,
    amount: Number(expense.amount),
    date: expense.date.toISOString().split("T")[0],
    orderId: expense.orderId,
    orderNo: expense.order?.orderNo || null,
    note: expense.note,
    createdAt: expense.createdAt.toISOString(),
  };
}

/**
 * Export getMonthlyExpensesTotal(month) for finance module.
 */
export async function getMonthlyExpensesTotal(month?: string): Promise<number> {
  const whereClause: Prisma.ExpenseWhereInput = {};

  if (month) {
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10);
    const startDate = new Date(Date.UTC(year, monthNum - 1, 1));
    const endDate = new Date(Date.UTC(year, monthNum, 0, 23, 59, 59, 999));

    whereClause.date = {
      gte: startDate,
      lte: endDate,
    };
  }

  const expenses = await prisma.expense.findMany({
    where: whereClause,
    select: { amount: true },
  });

  const total = expenses.reduce((acc, e) => acc + Number(e.amount), 0);
  return Number(total.toFixed(2));
}
