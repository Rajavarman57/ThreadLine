import { prisma } from "@/lib/db";
import { Prisma, Role, InvoiceStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { logAction } from "@/lib/audit";
import {
  recordPaymentSchema,
  RecordPaymentInput,
  invoiceListFilterSchema,
  InvoiceListFilterInput,
} from "./schemas/payments";

// ----------------------------------------------------------------------------
// 1. INVOICE LIST & AGING
// ----------------------------------------------------------------------------

export interface InvoiceListItem {
  id: string;
  invoiceNo: string;
  dispatchId: string;
  dispatchNo: string;
  orderId: string;
  orderNo: string;
  buyerId: string;
  buyerName: string;
  subtotal: number;
  taxPct: number;
  total: number;
  paidAmount: number;
  outstanding: number;
  status: InvoiceStatus;
  createdAt: string;
  ageDays: number;
  isOverdue30: boolean; // Overdue if unpaid/partial for > 30 days
}

export interface PaginatedInvoices {
  items: InvoiceListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  buyers: Array<{ id: string; name: string }>;
}

export async function getInvoicesList(
  input: InvoiceListFilterInput
): Promise<PaginatedInvoices> {
  // ACCOUNTS, ADMIN, STORE, SUPERVISOR can read
  await requireRole([
    Role.ADMIN,
    Role.ACCOUNTS,
    Role.STORE,
    Role.SUPERVISOR,
  ]);

  const validated = invoiceListFilterSchema.parse(input);
  const { page, pageSize, status, buyerId, search } = validated;

  const whereClause: Prisma.InvoiceWhereInput = {};

  if (status) {
    whereClause.status = status;
  }

  if (buyerId) {
    whereClause.dispatch = {
      order: {
        buyerId,
      },
    };
  }

  if (search && search.trim().length > 0) {
    const s = search.trim();
    whereClause.OR = [
      { invoiceNo: { contains: s, mode: "insensitive" } },
      { dispatch: { dispatchNo: { contains: s, mode: "insensitive" } } },
      { dispatch: { order: { orderNo: { contains: s, mode: "insensitive" } } } },
      { dispatch: { order: { buyer: { name: { contains: s, mode: "insensitive" } } } } },
    ];
  }

  const now = Date.now();

  const [total, invoices, buyers] = await Promise.all([
    prisma.invoice.count({ where: whereClause }),
    prisma.invoice.findMany({
      where: whereClause,
      include: {
        dispatch: {
          include: {
            order: {
              include: {
                buyer: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        payments: {
          select: { amount: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.buyer.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const items: InvoiceListItem[] = invoices.map((inv) => {
    const total = Number(inv.total);
    const paidAmount = inv.payments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const outstanding = Math.max(0, Number((total - paidAmount).toFixed(2)));
    const ageDays = Math.floor(
      (now - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const isOverdue30 = inv.status !== InvoiceStatus.PAID && ageDays > 30;

    return {
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      dispatchId: inv.dispatchId,
      dispatchNo: inv.dispatch.dispatchNo,
      orderId: inv.dispatch.orderId,
      orderNo: inv.dispatch.order.orderNo,
      buyerId: inv.dispatch.order.buyer.id,
      buyerName: inv.dispatch.order.buyer.name,
      subtotal: Number(inv.subtotal),
      taxPct: Number(inv.taxPct),
      total,
      paidAmount: Number(paidAmount.toFixed(2)),
      outstanding,
      status: inv.status,
      createdAt: inv.createdAt.toISOString(),
      ageDays,
      isOverdue30,
    };
  });

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    buyers,
  };
}

// ----------------------------------------------------------------------------
// 2. INVOICE DETAIL & PAYMENT RECORDING
// ----------------------------------------------------------------------------

export interface InvoiceDetail {
  id: string;
  invoiceNo: string;
  dispatchId: string;
  dispatchNo: string;
  dispatchedAt: string;
  vehicleNo: string;
  driver: string;
  order: {
    id: string;
    orderNo: string;
    fabricType: string;
    colour: string;
    ratePerMetre: number;
    buyer: {
      id: string;
      name: string;
      email: string;
      phone: string;
      address: string;
    };
  };
  rolls: Array<{
    id: string;
    rollNo: string;
    lengthM: number;
  }>;
  totalMetres: number;
  subtotal: number;
  taxPct: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  outstanding: number;
  status: InvoiceStatus;
  createdAt: string;
  ageDays: number;
  isOverdue30: boolean;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    paidAt: string;
  }>;
}

export async function getInvoiceDetail(id: string): Promise<InvoiceDetail | null> {
  // Internal roles or buyer scoped
  const user = await requireRole([
    Role.ADMIN,
    Role.ACCOUNTS,
    Role.STORE,
    Role.SUPERVISOR,
    Role.BUYER,
  ]);

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      dispatch: {
        include: {
          order: {
            include: {
              buyer: true,
            },
          },
          rolls: {
            select: { id: true, rollNo: true, lengthM: true },
            orderBy: { rollNo: "asc" },
          },
        },
      },
      payments: {
        orderBy: { paidAt: "desc" },
      },
    },
  });

  if (!invoice) return null;

  // Buyer security check: Buyers may only access their own invoices
  if (user.role === Role.BUYER) {
    if (!user.buyerId || user.buyerId !== invoice.dispatch.order.buyerId) {
      throw new Error("Forbidden: You do not have permission to view this invoice.");
    }
  }

  const total = Number(invoice.total);
  const subtotal = Number(invoice.subtotal);
  const taxPct = Number(invoice.taxPct);
  const taxAmount = Number(((subtotal * taxPct) / 100).toFixed(2));

  const paidAmount = invoice.payments.reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );
  const outstanding = Math.max(0, Number((total - paidAmount).toFixed(2)));

  const now = Date.now();
  const ageDays = Math.floor(
    (now - new Date(invoice.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue30 = invoice.status !== InvoiceStatus.PAID && ageDays > 30;

  const totalMetres = invoice.dispatch.rolls.reduce(
    (acc, r) => acc + Number(r.lengthM),
    0
  );

  return {
    id: invoice.id,
    invoiceNo: invoice.invoiceNo,
    dispatchId: invoice.dispatchId,
    dispatchNo: invoice.dispatch.dispatchNo,
    dispatchedAt: invoice.dispatch.dispatchedAt.toISOString(),
    vehicleNo: invoice.dispatch.vehicleNo,
    driver: invoice.dispatch.driver,
    order: {
      id: invoice.dispatch.order.id,
      orderNo: invoice.dispatch.order.orderNo,
      fabricType: invoice.dispatch.order.fabricType,
      colour: invoice.dispatch.order.colour,
      ratePerMetre: Number(invoice.dispatch.order.ratePerMetre),
      buyer: {
        id: invoice.dispatch.order.buyer.id,
        name: invoice.dispatch.order.buyer.name,
        email: invoice.dispatch.order.buyer.email ?? "",
        phone: invoice.dispatch.order.buyer.phone ?? "",
        address: invoice.dispatch.order.buyer.address ?? "",
      },
    },
    rolls: invoice.dispatch.rolls.map((r) => ({
      id: r.id,
      rollNo: r.rollNo,
      lengthM: Number(r.lengthM),
    })),
    totalMetres: Number(totalMetres.toFixed(2)),
    subtotal,
    taxPct,
    taxAmount,
    total,
    paidAmount: Number(paidAmount.toFixed(2)),
    outstanding,
    status: invoice.status,
    createdAt: invoice.createdAt.toISOString(),
    ageDays,
    isOverdue30,
    payments: invoice.payments.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      method: p.method,
      paidAt: p.paidAt.toISOString(),
    })),
  };
}

/**
 * Records a customer payment in ONE transaction, updates Invoice.status, and logs AuditLog.
 * Roles: ACCOUNTS, ADMIN
 */
export async function recordPayment(input: RecordPaymentInput) {
  const user = await requireRole([Role.ADMIN, Role.ACCOUNTS]);
  const validated = recordPaymentSchema.parse(input);

  const paymentResult = await prisma.$transaction(
    async (tx) => {
      // 1. Fetch current Invoice and its total
      const invoice = await tx.invoice.findUnique({
        where: { id: validated.invoiceId },
        include: {
          payments: {
            select: { amount: true },
          },
        },
      });

      if (!invoice) {
        throw new Error(`Invoice ${validated.invoiceId} not found.`);
      }

      const total = Number(invoice.total);
      const currentlyPaid = invoice.payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      const outstanding = Math.max(0, Number((total - currentlyPaid).toFixed(2)));

      if (validated.amount > outstanding + 0.01) {
        throw new Error(
          `Payment amount (₹${validated.amount}) cannot exceed current outstanding balance (₹${outstanding}).`
        );
      }

      // 2. Insert Payment record
      const payment = await tx.payment.create({
        data: {
          invoiceId: validated.invoiceId,
          amount: new Prisma.Decimal(validated.amount),
          method: validated.method,
          paidAt: validated.paidAt ? new Date(validated.paidAt) : new Date(),
        },
      });

      // 3. Recalculate status
      const newTotalPaid = Number((currentlyPaid + validated.amount).toFixed(2));
      let newStatus: InvoiceStatus = invoice.status;

      if (newTotalPaid >= total - 0.01) {
        newStatus = InvoiceStatus.PAID;
      } else if (newTotalPaid > 0) {
        newStatus = InvoiceStatus.PARTIAL;
      } else {
        newStatus = InvoiceStatus.UNPAID;
      }

      const updatedInvoice = await tx.invoice.update({
        where: { id: validated.invoiceId },
        data: { status: newStatus },
      });

      return {
        payment,
        invoice: updatedInvoice,
        invoiceNo: invoice.invoiceNo,
        newTotalPaid,
        outstanding: Math.max(0, Number((total - newTotalPaid).toFixed(2))),
      };
    },
    { maxWait: 5000, timeout: 10000 }
  );

  // 4. Log audit outside interactive transaction
  await logAction({
    userId: user.id,
    action: "PAYMENT_RECORDED",
    entity: "Payment",
    entityId: paymentResult.payment.id,
    meta: {
      invoiceId: validated.invoiceId,
      invoiceNo: paymentResult.invoiceNo,
      amount: validated.amount,
      method: validated.method,
      newStatus: paymentResult.invoice.status,
      remainingOutstanding: paymentResult.outstanding,
    },
  });

  return paymentResult;
}

// ----------------------------------------------------------------------------
// 3. EXPORTS FOR FINANCE MODULE
// ----------------------------------------------------------------------------

/**
 * Returns total receivables (all unpaid/partial balances across mill operations).
 */
export async function getReceivablesTotal(): Promise<{
  totalReceivables: number;
  unpaidCount: number;
  partialCount: number;
  overdue30Amount: number;
}> {
  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: [InvoiceStatus.UNPAID, InvoiceStatus.PARTIAL] },
    },
    include: {
      payments: { select: { amount: true } },
    },
  });

  const now = Date.now();
  let totalReceivables = 0;
  let unpaidCount = 0;
  let partialCount = 0;
  let overdue30Amount = 0;

  for (const inv of invoices) {
    if (inv.status === InvoiceStatus.UNPAID) unpaidCount++;
    if (inv.status === InvoiceStatus.PARTIAL) partialCount++;

    const total = Number(inv.total);
    const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balance = Math.max(0, total - paid);
    totalReceivables += balance;

    const ageDays = Math.floor(
      (now - new Date(inv.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (ageDays > 30) {
      overdue30Amount += balance;
    }
  }

  return {
    totalReceivables: Number(totalReceivables.toFixed(2)),
    unpaidCount,
    partialCount,
    overdue30Amount: Number(overdue30Amount.toFixed(2)),
  };
}

/**
 * Returns monthly summary for invoice sales and cash collection.
 * @param month format "YYYY-MM" e.g. "2026-10"
 */
export async function getInvoiceSummary(month?: string) {
  let startDate: Date;
  let endDate: Date;

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, m] = month.split("-").map(Number);
    startDate = new Date(year, m - 1, 1);
    endDate = new Date(year, m, 1);
  } else {
    const d = new Date();
    startDate = new Date(d.getFullYear(), d.getMonth(), 1);
    endDate = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }

  const [invoices, payments] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        createdAt: { gte: startDate, lt: endDate },
      },
      select: { total: true, subtotal: true, status: true },
    }),
    prisma.payment.findMany({
      where: {
        paidAt: { gte: startDate, lt: endDate },
      },
      select: { amount: true, method: true },
    }),
  ]);

  const billedTotal = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const collectedTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    month: month || new Date().toISOString().substring(0, 7),
    invoiceCount: invoices.length,
    billedTotal: Number(billedTotal.toFixed(2)),
    collectedTotal: Number(collectedTotal.toFixed(2)),
    paymentCount: payments.length,
  };
}
