import { getMockState, setMockState } from "@/lib/server/mock-db";
import { hasAdminCookie, readAppState } from "@/lib/server/app-state";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { createTeam } from "@/lib/state";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type TeamPayload = {
  teamNumber?: number;
  name?: string;
  loginCode?: string;
  churchName?: string;
  memberCount?: number;
};

function normalizePayload(body: TeamPayload) {
  const teamNumber = Number(body.teamNumber);
  return {
    teamNumber,
    name: body.name?.trim() ?? "",
    loginCode: (body.loginCode?.trim() || `TEAM-${String(teamNumber).padStart(2, "0")}-KEY`).toUpperCase(),
    churchName: body.churchName?.trim() ?? "",
    memberCount: Number(body.memberCount ?? 0)
  };
}

export async function POST(request: Request) {
  if (!hasAdminCookie(await cookies())) {
    return NextResponse.json({ ok: false, message: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  try {
    const payload = normalizePayload((await request.json()) as TeamPayload);
    if (!payload.teamNumber || payload.teamNumber < 1 || !payload.name || !payload.loginCode) {
      return NextResponse.json({ ok: false, message: "팀 번호, 이름, 코드를 확인해 주세요." }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") {
      const supabase = createSupabaseServiceClient();
      const { data: team, error } = await supabase
        .from("teams")
        .insert({
          team_number: payload.teamNumber,
          name: payload.name,
          login_code: payload.loginCode,
          church_name: payload.churchName,
          member_count: payload.memberCount,
          manual_adjustment: 0,
          final_verified: false
        })
        .select("*")
        .single();
      if (error) throw error;
      await supabase.from("audit_logs").insert({
        actor_type: "admin",
        actor_id: "admin",
        action: "team_create",
        entity_type: "team",
        entity_id: team.id,
        after_data: team
      });
      return NextResponse.json({ ok: true, state: await readAppState({ includeLoginCodes: true }) });
    }

    const next = createTeam({ state: getMockState(), ...payload, actor: "admin" });
    setMockState(next);
    return NextResponse.json({ ok: true, state: next });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "팀 추가 실패" },
      { status: 400 }
    );
  }
}
