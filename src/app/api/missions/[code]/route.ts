import { getMockState } from "@/lib/server/mock-db";
import { findMissionByCode } from "@/lib/state";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const mission = findMissionByCode(getMockState(), code);
  if (!mission) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, mission });
}
