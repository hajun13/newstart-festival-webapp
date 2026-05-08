import { getMockState } from "@/lib/server/mock-db";
import { getTeamProgress } from "@/lib/state";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const teamId = url.searchParams.get("teamId") ?? "team-01";
  const state = getMockState();
  const team = state.teams.find((item) => item.id === teamId);
  if (!team) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, team, progress: getTeamProgress(state, teamId) });
}
