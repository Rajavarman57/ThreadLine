import { NextRequest, NextResponse } from "next/server";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/services/notifications";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getNotifications();
    return NextResponse.json(data);
  } catch (error: any) {
    return new NextResponse(error?.message || "Failed to fetch notifications", {
      status: error?.status || 500,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.all) {
      await markAllNotificationsRead();
      return NextResponse.json({ ok: true });
    }
    if (body.id) {
      await markNotificationRead(body.id);
      return NextResponse.json({ ok: true });
    }
    return new NextResponse("Missing id or all flag", { status: 400 });
  } catch (error: any) {
    return new NextResponse(error?.message || "Failed to update notifications", {
      status: 500,
    });
  }
}
