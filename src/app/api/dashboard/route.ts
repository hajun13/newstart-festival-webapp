import { getMockState } from "@/lib/server/mock-db";
import { getTeamCookie, readAppState } from "@/lib/server/app-state";
import { getTeamProgress } from "@/lib/state";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const teamId = url.searchParams.get("teamId") ?? "team-01";
  const cookieTeamId = getTeamCookie(await cookies());
  if (cookieTeamId && cookieTeamId !== teamId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const state = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false" ? await readAppState() : getMockState();
  const team = state.teams.find((item) => item.id === teamId);
  if (!team) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, team, progress: getTeamProgress(state, teamId) });
}
