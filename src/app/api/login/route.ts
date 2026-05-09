import { loginTeam } from "@/lib/state";
import { getMockState } from "@/lib/server/mock-db";
import { TEAM_SESSION_COOKIE } from "@/lib/server/app-state";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { code } = (await request.json()) as { code?: string };
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("teams")
      .select("id, team_number, name, church_name, member_count, final_verified, final_verified_at, manual_adjustment")
      .eq("login_code", code?.trim().toUpperCase() ?? "")
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ ok: false, message: "팀 코드를 확인해 주세요." }, { status: 401 });
    }
    const response = NextResponse.json({
      ok: true,
      team: {
        id: data.id,
        teamNumber: data.team_number,
        name: data.name,
        loginCode: "",
        churchName: data.church_name ?? "",
        memberCount: data.member_count ?? 0,
        finalVerified: data.final_verified,
        finalVerifiedAt: data.final_verified_at ?? undefined,
        manualAdjustment: data.manual_adjustment ?? 0
      }
    });
    response.cookies.set(TEAM_SESSION_COOKIE, data.id, {
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
