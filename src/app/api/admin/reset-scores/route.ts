import { getMockState, setMockState } from "@/lib/server/mock-db";
import { hasAdminCookie, readAppState } from "@/lib/server/app-state";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { resetOperationProgress } from "@/lib/state";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type ResetPayload = {
  confirmPhrase?: string;
};

const CONFIRM_PHRASE = "초기화";

export async function POST(request: Request) {
  if (!hasAdminCookie(await cookies())) {
    return NextResponse.json({ ok: false, message: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as ResetPayload;
  if (body.confirmPhrase?.trim() !== CONFIRM_PHRASE) {
    return NextResponse.json(
      { ok: false, message: "확인 문구를 정확히 입력해 주세요." },
      { status: 400 }
    );
  }

  try {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") {
      const supabase = createSupabaseServiceClient();
      const results = await Promise.all([
        supabase.from("submissions").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("team_easter_egg_claims").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("admin_awards").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("announcement_submissions").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("team_theme_status").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("final_verifications").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase
          .from("teams")
          .update({
            total_score: 0,
            manual_adjustment: 0,
            final_verified: false,
            final_verified_at: null,
            updated_at: new Date().toISOString()
          })
          .neq("id", "00000000-0000-0000-0000-000000000000")
      ]);
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
      return NextResponse.json({
        ok: true,
        message: "운영 점수와 제출 기록을 초기화했습니다.",
        state: await readAppState({ includeLoginCodes: true })
      });
    }

    const next = resetOperationProgress(getMockState());
    setMockState(next);
    return NextResponse.json({
      ok: true,
      message: "운영 점수와 제출 기록을 초기화했습니다.",
      state: next
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "초기화 실패" },
      { status: 400 }
    );
  }
}
