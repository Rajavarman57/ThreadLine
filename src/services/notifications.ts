import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/auth/session";

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

/**
 * Lazily generate overdue-order and low-stock alerts de-duplicated by type and reference.
 */
async function generateLazyAlerts() {
  const now = new Date();

  // 1. Check for overdue active orders
  const overdueOrders = await prisma.order.findMany({
    where: {
      deadline: { lt: now },
      status: { notIn: ["DISPATCHED", "CANCELLED"] },
    },
    select: { id: true, orderNo: true, deadline: true },
    take: 5,
  });

  for (const order of overdueOrders) {
    const type = "OVERDUE_ORDER";
    const refMessage = `Order ${order.orderNo} is past its delivery deadline`;

    const existing = await prisma.notification.findFirst({
      where: {
        type,
        message: { contains: order.orderNo },
      },
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          role: Role.SUPERVISOR,
          type,
          message: `${refMessage} (${order.deadline.toISOString().slice(0, 10)}).`,
        },
      });
    }
  }

  // 2. Check for low raw yarn stock
  const yarns = await prisma.yarnType.findMany({
    include: {
      stockMovements: {
        select: { reason: true, qty: true },
      },
    },
    take: 10,
  });

  for (const yarn of yarns) {
    const onHand = yarn.stockMovements.reduce((sum, m) => {
      if (m.reason === "RECEIPT") return sum + Number(m.qty);
      if (m.reason === "ISSUE") return sum + Number(m.qty);
      if (m.reason === "ADJUST") return sum + Number(m.qty);
      return sum;
    }, 0);

    if (onHand < Number(yarn.reorderLevel)) {
      const type = "LOW_STOCK";
      const existing = await prisma.notification.findFirst({
        where: {
          type,
          message: { contains: `${yarn.type} (${yarn.colour})` },
        },
      });

      if (!existing) {
        await prisma.notification.create({
          data: {
            role: Role.STORE,
            type,
            message: `Low stock alert: ${yarn.type} (${yarn.colour}) is below reorder level (${onHand.toFixed(1)} / ${Number(yarn.reorderLevel)} KG).`,
          },
        });
      }
    }
  }
}

/**
 * Helper to determine contextual navigation links based on notification type and message
 */
function resolveNotificationLink(type: string, message: string): string {
  if (type === "LOW_STOCK" || message.toLowerCase().includes("stock")) {
    return "/inventory";
  }
  if (type === "REWORK_REQUIRED" || message.toLowerCase().includes("rework") || message.toLowerCase().includes("roll")) {
    return "/quality";
  }
  if (type === "BREAKDOWN" || message.toLowerCase().includes("breakdown") || message.toLowerCase().includes("machine")) {
    return "/production";
  }
  if (type === "ORDER_READY" || message.toLowerCase().includes("ready")) {
    return "/dispatch";
  }
  if (type === "OVERDUE_ORDER" || message.toLowerCase().includes("order")) {
    return "/orders";
  }
  return "/orders";
}

export async function getNotifications(): Promise<{
  notifications: NotificationItem[];
  unreadCount: number;
}> {
  const user = await requireUser();

  // Generate overdue-order and low-stock alerts lazily on read
  try {
    await generateLazyAlerts();
  } catch (err) {
    console.error("Failed to generate lazy notifications:", err);
  }

  // Role-relevant notifications (role = user's role or userId = user)
  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        { userId: user.id },
        { role: user.role },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const unreadCount = await prisma.notification.count({
    where: {
      read: false,
      OR: [
        { userId: user.id },
        { role: user.role },
      ],
    },
  });

  return {
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      link: resolveNotificationLink(n.type, n.message),
    })),
    unreadCount,
  };
}

export async function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  const user = await requireUser();

  await prisma.notification.updateMany({
    where: {
      id,
      OR: [{ userId: user.id }, { role: user.role }],
    },
    data: { read: true },
  });

  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const user = await requireUser();

  await prisma.notification.updateMany({
    where: {
      read: false,
      OR: [{ userId: user.id }, { role: user.role }],
    },
    data: { read: true },
  });

  return { ok: true };
}
