import { getMockState, setMockState } from "@/lib/server/mock-db";
import { hasAdminCookie, readAppState, writeAppState } from "@/lib/server/app-state";
import { setSubmissionStatus, staffApproveByTeamMission } from "@/lib/state";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!hasAdminCookie(cookieStore)) {
    return NextResponse.json({ ok: false, message: "관리자 인증이 필요합니다." }, { status: 401 });
  }
  const body = (await request.json()) as {
    submissionId?: string;
    teamId?: string;
    missionCode?: string;
    status?: "approved" | "rejected" | "cancelled";
    success?: boolean;
    reviewedBy?: string;
  };
  try {
    const current = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false" ? await readAppState() : getMockState();
    const state = body.submissionId
      ? setSubmissionStatus({
          state: current,
          submissionId: body.submissionId,
          status: body.status ?? "approved",
          reviewedBy: body.reviewedBy ?? "admin"
        })
      : staffApproveByTeamMission({
          state: current,
          teamId: body.teamId ?? "",
          missionCode: body.missionCode ?? "WTR-80",
          success: body.success ?? true,
          reviewedBy: body.reviewedBy ?? "admin"
        });
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") await writeAppState(state);
    else setMockState(state);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "승인 실패" },
      { status: 400 }
    );
  }
}
