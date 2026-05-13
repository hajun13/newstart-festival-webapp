import { loginTeam } from "@/lib/state";
import { getMockState } from "@/lib/server/mock-db";
import { TEAM_SESSION_COOKIE } from "@/lib/server/app-state";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { teamLoginCodeMatches } from "@/lib/auth/team-code";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { code } = (await request.json()) as { code?: string };
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("teams")
      .select("id, team_number, name, login_code, church_name, member_count, final_verified, final_verified_at, manual_adjustment")
      .order("team_number");
    const team = data?.find((item) => teamLoginCodeMatches(code ?? "", item.login_code ?? ""));
    if (error || !team) {
      return NextResponse.json({ ok: false, message: "팀 코드를 확인해 주세요." }, { status: 401 });
    }
    const response = NextResponse.json({
      ok: true,
      team: {
        id: team.id,
        teamNumber: team.team_number,
        name: team.name,
        loginCode: "",
        churchName: team.church_name ?? "",
        memberCount: team.member_count ?? 0,
        finalVerified: team.final_verified,
        finalVerifiedAt: team.final_verified_at ?? undefined,
        manualAdjustment: team.manual_adjustment ?? 0
      }
    });
    response.cookies.set(TEAM_SESSION_COOKIE, team.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8
    });
    return response;
  }
  const team = loginTeam(getMockState(), code ?? "");
  if (!team) {
    return NextResponse.json({ ok: false, message: "팀 코드를 확인해 주세요." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true, team });
  response.cookies.set(TEAM_SESSION_COOKIE, team.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
