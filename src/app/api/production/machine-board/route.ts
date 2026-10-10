import { getMachineBoard } from "@/services/production";
import { getSessionUser } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const board = await getMachineBoard();
    return NextResponse.json(board);
  } catch (err: any) {
    console.error("API /api/production/machine-board error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch machine board" },
      { status: 500 }
    );
  }
}
