import { getMockState, setMockState } from "@/lib/server/mock-db";
import { getTeamCookie, readAppState, writeAppState } from "@/lib/server/app-state";
import { claimEasterEgg } from "@/lib/state";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const { teamId } = (await request.json()) as { teamId: string };
  try {
    const cookieTeamId = getTeamCookie(await cookies());
    if (cookieTeamId !== teamId) {
      return NextResponse.json({ ok: false, message: "팀 인증이 필요합니다." }, { status: 401 });
    }
    const state = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false" ? await readAppState() : getMockState();
    const result = claimEasterEgg(state, teamId, code);
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") await writeAppState(result.state);
    else setMockState(result.state);
    return NextResponse.json({ ok: true, claim: result.claim, message: result.message });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "히든 코드 처리 실패" },
      { status: 400 }
    );
  }
}
