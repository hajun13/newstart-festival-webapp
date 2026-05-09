import { hasAdminCookie } from "@/lib/server/app-state";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: hasAdminCookie(await cookies()) });
}
