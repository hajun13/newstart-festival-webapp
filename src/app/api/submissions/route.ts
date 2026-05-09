import { getMockState, setMockState } from "@/lib/server/mock-db";
import { getTeamCookie, readAppState, writeAppState } from "@/lib/server/app-state";
import { submitMission } from "@/lib/state";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    teamId: string;
    missionCode: string;
    answerText?: string;
    answerJson?: Record<string, unknown>;
    filePaths?: string[];
  };
  try {
    const cookieTeamId = getTeamCookie(await cookies());
    if (cookieTeamId !== body.teamId) {
      return NextResponse.json({ ok: false, message: "팀 인증이 필요합니다." }, { status: 401 });
    }
    const state = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false" ? await readAppState() : getMockState();
    const result = submitMission({ state, ...body });
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") await writeAppState(result.state);
    else setMockState(result.state);
    return NextResponse.json({ ok: true, submission: result.submission, message: result.message });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "제출 실패" },
      { status: 400 }
    );
  }
}
