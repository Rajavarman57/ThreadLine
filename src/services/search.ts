import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";

export interface SearchResultItem {
  type: "order" | "roll" | "buyer";
  title: string;
  subtitle: string;
  href: string;
}

export interface GlobalSearchResponse {
  results: SearchResultItem[];
}

export async function searchGlobal(query: string): Promise<GlobalSearchResponse> {
  const user = await requireUser();
  const q = query.trim();

  if (!q) {
    return { results: [] };
  }

  const results: SearchResultItem[] = [];

  // 1. Orders by number (role-aware: if BUYER, only their own orders)
  const orderWhere: any = {
    orderNo: { contains: q, mode: "insensitive" },
  };
  if (user.role === "BUYER" && user.buyerId) {
    orderWhere.buyerId = user.buyerId;
  }

  const orders = await prisma.order.findMany({
    where: orderWhere,
    take: 5,
    include: { buyer: true },
    orderBy: { createdAt: "desc" },
  });

  for (const o of orders) {
    results.push({
      type: "order",
      title: o.orderNo,
      subtitle: `${o.fabricType} (${o.colour}) · ${o.buyer.name}`,
      href: user.role === "BUYER" ? `/portal/orders/${o.orderNo}` : `/orders/${o.id}`,
    });
  }

  // 2. Rolls by number (accessible to internal staff)
  if (user.role !== "BUYER") {
    const rolls = await prisma.roll.findMany({
      where: {
        rollNo: { contains: q, mode: "insensitive" },
      },
      take: 5,
      include: { order: true },
      orderBy: { createdAt: "desc" },
    });

    for (const r of rolls) {
      results.push({
        type: "roll",
        title: r.rollNo,
        subtitle: `${r.lengthM}m · Order ${r.order.orderNo} · Status: ${r.qcStatus}`,
        href: `/quality/rolls/${r.rollNo}`,
      });
    }
  }

  // 3. Buyers by name (accessible to ADMIN, ACCOUNTS, STORE, SUPERVISOR)
  if (user.role !== "BUYER") {
    const buyers = await prisma.buyer.findMany({
      where: {
        name: { contains: q, mode: "insensitive" },
      },
      take: 5,
      orderBy: { name: "asc" },
    });

    for (const b of buyers) {
      results.push({
        type: "buyer",
        title: b.name,
        subtitle: `${b.contactPerson || "Contact"} · ${b.email || b.phone || "Active"}`,
        href: `/master/buyers`,
      });
    }
  }

  return { results: results.slice(0, 15) };
}
