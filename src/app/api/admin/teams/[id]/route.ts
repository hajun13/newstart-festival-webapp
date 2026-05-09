import { getMockState, setMockState } from "@/lib/server/mock-db";
import { hasAdminCookie, readAppState } from "@/lib/server/app-state";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { deleteTeam, updateTeam } from "@/lib/state";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type TeamPayload = {
  teamNumber?: number;
  name?: string;
  loginCode?: string;
  churchName?: string;
  memberCount?: number;
  confirmName?: string;
};

function normalizePayload(body: TeamPayload) {
  return {
    teamNumber: Number(body.teamNumber),
    name: body.name?.trim() ?? "",
    loginCode: body.loginCode?.trim().toUpperCase() ?? "",
    churchName: body.churchName?.trim() ?? "",
    memberCount: Number(body.memberCount ?? 0)
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasAdminCookie(await cookies())) {
    return NextResponse.json({ ok: false, message: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  try {
    const payload = normalizePayload((await request.json()) as TeamPayload);
    if (!payload.teamNumber || payload.teamNumber < 1 || !payload.name || !payload.loginCode) {
      return NextResponse.json({ ok: false, message: "팀 번호, 이름, 코드를 확인해 주세요." }, { status: 400 });
    }

    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") {
      const current = await readAppState({ includeLoginCodes: true });
      const before = current.teams.find((team) => team.id === id);
      if (!before) throw new Error("팀을 찾을 수 없습니다.");
      const supabase = createSupabaseServiceClient();
      const { data: team, error } = await supabase
        .from("teams")
        .update({
          team_number: payload.teamNumber,
          name: payload.name,
          login_code: payload.loginCode,
          church_name: payload.churchName,
          member_count: payload.memberCount,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      await supabase.from("audit_logs").insert({
        actor_type: "admin",
        actor_id: "admin",
        action: "team_update",
        entity_type: "team",
        entity_id: id,
        before_data: before,
        after_data: team
      });
      return NextResponse.json({ ok: true, state: await readAppState({ includeLoginCodes: true }) });
    }

    const next = updateTeam({ state: getMockState(), teamId: id, ...payload, actor: "admin" });
    setMockState(next);
    return NextResponse.json({ ok: true, state: next });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "팀 수정 실패" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasAdminCookie(await cookies())) {
    return NextResponse.json({ ok: false, message: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  try {
    const { confirmName } = (await request.json()) as TeamPayload;
    const current = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false"
      ? await readAppState({ includeLoginCodes: true })
      : getMockState();
    const team = current.teams.find((item) => item.id === id);
    if (!team) throw new Error("팀을 찾을 수 없습니다.");
    if (confirmName !== team.name) throw new Error("삭제 확인용 팀 이름이 일치하지 않습니다.");

    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") {
      const supabase = createSupabaseServiceClient();
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
      await supabase.from("audit_logs").insert({
        actor_type: "admin",
        actor_id: "admin",
        action: "team_delete",
        entity_type: "team",
        entity_id: id,
        before_data: team,
        after_data: { deleted: true }
      });
      return NextResponse.json({ ok: true, state: await readAppState({ includeLoginCodes: true }) });
    }

    const next = deleteTeam({ state: current, teamId: id, actor: "admin" });
    setMockState(next);
    return NextResponse.json({ ok: true, state: next });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "팀 삭제 실패" },
      { status: 400 }
    );
  }
}
