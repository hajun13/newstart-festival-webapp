import { getMockState, setMockState } from "@/lib/server/mock-db";
import { getTeamCookie, readAppState, writeAppState } from "@/lib/server/app-state";
import { verifyFinal } from "@/lib/state";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { teamId } = (await request.json()) as { teamId: string };
  try {
    const cookieTeamId = getTeamCookie(await cookies());
    if (cookieTeamId !== teamId) {
      return NextResponse.json({ ok: false, message: "팀 인증이 필요합니다." }, { status: 401 });
    }
    const state = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false" ? await readAppState() : getMockState();
    const result = verifyFinal(state, teamId);
    if (result.ok) {
      if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") await writeAppState(result.state);
      else setMockState(result.state);
    }
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "최종 인증 실패" },
      { status: 400 }
    );
  }
}
