import { getMockState, setMockState } from "@/lib/server/mock-db";
import { submitMission } from "@/lib/state";
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
    const result = submitMission({ state: getMockState(), ...body });
    setMockState(result.state);
    return NextResponse.json({ ok: true, submission: result.submission, message: result.message });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "제출 실패" },
      { status: 400 }
    );
  }
}
