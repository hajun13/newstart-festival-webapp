import { getMockState, setMockState } from "@/lib/server/mock-db";
import { setSubmissionStatus, staffApproveByTeamMission } from "@/lib/state";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    submissionId?: string;
    teamId?: string;
    missionCode?: string;
    status?: "approved" | "rejected" | "cancelled";
    success?: boolean;
    reviewedBy?: string;
  };
  try {
    const state = body.submissionId
      ? setSubmissionStatus({
          state: getMockState(),
          submissionId: body.submissionId,
          status: body.status ?? "approved",
          reviewedBy: body.reviewedBy ?? "admin"
        })
      : staffApproveByTeamMission({
          state: getMockState(),
          teamId: body.teamId ?? "team-01",
          missionCode: body.missionCode ?? "WTR-80",
          success: body.success ?? true,
          reviewedBy: body.reviewedBy ?? "admin"
        });
    setMockState(state);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "승인 실패" },
      { status: 400 }
    );
  }
}
