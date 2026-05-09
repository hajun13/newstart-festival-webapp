import { getMockState, setMockState } from "@/lib/server/mock-db";
import { hasAdminCookie, readAppState, writeAppState } from "@/lib/server/app-state";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { undoAdminAward, undoManualScoreAdjustment } from "@/lib/state";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasAdminCookie(await cookies())) {
    return NextResponse.json({ ok: false, message: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    kind?: "manual_score" | "admin_award";
    auditLogId?: string;
    awardId?: string;
  };

  try {
    const current = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false"
      ? await readAppState({ includeLoginCodes: true })
      : getMockState();
    if (body.kind === "manual_score") {
      const next = undoManualScoreAdjustment({
        state: current,
        auditLogId: body.auditLogId ?? "",
        actor: "admin"
      });
      if (!next.auditLogs[0]?.entityId || next.auditLogs[0].entityId !== id) {
        return NextResponse.json({ ok: false, message: "팀 조정 기록이 일치하지 않습니다." }, { status: 400 });
      }
      if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") await writeAppState(next);
      else setMockState(next);
      return NextResponse.json({ ok: true, state: next });
    }

    if (body.kind === "admin_award") {
      const award = current.adminAwards.find((item) => item.id === body.awardId && item.teamId === id);
      if (!award) throw new Error("되돌릴 보너스를 찾을 수 없습니다.");

      if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") {
        const supabase = createSupabaseServiceClient();
        const { error } = await supabase.from("admin_awards").delete().eq("id", award.id);
        if (error) throw error;
        await supabase.from("audit_logs").insert({
          actor_type: "admin",
          actor_id: "admin",
          action: "admin_award_undo",
          entity_type: "admin_award",
          entity_id: award.id,
          before_data: award,
          after_data: { removed: true }
        });
        return NextResponse.json({ ok: true, state: await readAppState({ includeLoginCodes: true }) });
      }

      const next = undoAdminAward({ state: current, awardId: award.id, actor: "admin" });
      setMockState(next);
      return NextResponse.json({ ok: true, state: next });
    }

    return NextResponse.json({ ok: false, message: "되돌릴 항목을 선택해 주세요." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "되돌리기 실패" },
      { status: 400 }
    );
  }
}
