import { NextRequest, NextResponse } from "next/server";
import { searchGlobal } from "@/services/search";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const data = await searchGlobal(q);
    return NextResponse.json(data);
  } catch (error: any) {
    return new NextResponse(error?.message || "Search failed", {
      status: 500,
    });
  }
}
