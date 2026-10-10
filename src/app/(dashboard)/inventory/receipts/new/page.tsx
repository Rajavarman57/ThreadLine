import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { Role, POStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { NewReceiptClient } from "./new-receipt-client";

export const dynamic = "force-dynamic";

export default async function NewGoodsReceiptPage() {
  const user = await getSessionUser();
  if (!user || (user.role !== Role.ADMIN && user.role !== Role.STORE)) {
    redirect("/inventory");
  }

  const [yarnTypes, suppliers, openPOLines, orders] = await Promise.all([
    prisma.yarnType.findMany({
      select: { id: true, type: true, colour: true, unit: true },
      orderBy: [{ type: "asc" }, { colour: "asc" }],
    }),
    prisma.supplier.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.purchaseLine.findMany({
      where: {
        purchaseOrder: {
          status: { in: [POStatus.DRAFT, POStatus.SENT, POStatus.PARTIAL] },
        },
      },
      include: {
        purchaseOrder: { select: { poNo: true } },
        yarnType: { select: { type: true, colour: true, unit: true } },
      },
    }),
    prisma.order.findMany({
      select: { id: true, orderNo: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const formattedPOLines = openPOLines.map((line) => ({
    id: line.id,
    poNo: line.purchaseOrder.poNo,
    yarnType: `${line.yarnType.type} (${line.yarnType.colour})`,
    remainingQty: Math.max(0, Number(line.qty) - Number(line.receivedQty)),
    unit: line.yarnType.unit,
  }));

  return (
    <NewReceiptClient
      yarnTypes={yarnTypes}
      suppliers={suppliers}
      openPOLines={formattedPOLines}
      orders={orders}
    />
  );
}
