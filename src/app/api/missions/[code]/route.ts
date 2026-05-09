import { getMockState } from "@/lib/server/mock-db";
import { readAppState } from "@/lib/server/app-state";
import { findMissionByCode } from "@/lib/state";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const state = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false" ? await readAppState() : getMockState();
  const mission = findMissionByCode(state, code);
  if (!mission) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, mission });
}
