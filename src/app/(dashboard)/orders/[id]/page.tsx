import { getOrderDetail } from "@/services/orders";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { OrderDetailClient } from "./order-detail-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getSessionUser();
  if (user?.role === Role.BUYER) {
    redirect("/portal");
  }
  const userRole = user?.role || Role.BUYER;

  const [order, suppliers] = await Promise.all([
    getOrderDetail(id),
    prisma.supplier.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <OrderDetailClient
      order={order}
      suppliers={suppliers}
      userRole={userRole}
    />
  );
}
