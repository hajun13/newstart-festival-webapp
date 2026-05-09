import { getMockState, setMockState } from "@/lib/server/mock-db";
import { hasAdminCookie, readAppState, writeAppState } from "@/lib/server/app-state";
import { adjustManualScore } from "@/lib/state";
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
  const body = (await request.json()) as { delta?: number; note?: string };
  const delta = Number(body.delta);
  const note = body.note?.trim() ?? "";
  if (!Number.isFinite(delta) || delta === 0) {
    return NextResponse.json({ ok: false, message: "조정할 점수를 입력해 주세요." }, { status: 400 });
  }
  if (!note) {
    return NextResponse.json({ ok: false, message: "조정 사유를 입력해 주세요." }, { status: 400 });
  }

  try {
    const current = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false"
      ? await readAppState({ includeLoginCodes: true })
      : getMockState();
    const next = adjustManualScore({
      state: current,
      teamId: id,
      delta,
      actor: "admin",
      note
    });
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") await writeAppState(next);
    else setMockState(next);
    return NextResponse.json({ ok: true, state: next });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "점수 조정 실패" },
      { status: 400 }
    );
  }
}
