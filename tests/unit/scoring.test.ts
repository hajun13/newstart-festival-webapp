import { describe, expect, it } from "vitest";
import { ALL_CLEAR_BONUS, NEWSTART_COMPLETION_BONUS } from "@/lib/scoring/calculate-score";
import { normalizeTeamLoginCode, teamLoginCodeMatches } from "@/lib/auth/team-code";
import {
  adjustManualScore,
  createDefaultState,
  getTeamProgress,
  grantAdminAward,
  setSubmissionStatus,
  submitMission,
  resetOperationProgress,
  undoAdminAward,
  undoManualScoreAdjustment,
  verifyFinal
} from "@/lib/state";

function quizAnswers(state: ReturnType<typeof createDefaultState>, missionCode: string) {
  const mission = state.missions.find((item) => item.code === missionCode)!;
  return {
    answers: Object.fromEntries(mission.quiz!.questions.map((question) => [question.id, question.answer]))
  };
}

function approveAllMissions() {
  let state = createDefaultState();
  for (const mission of state.missions) {
    state = submitMission({
      state,
      teamId: "team-01",
      missionCode: mission.code,
      answerText: "요한복음 8:12 나는 세상의 빛 현미 채소 과일 견과류 물 절제 인증 기도 제목",
      answerJson: mission.quiz
        ? {
            answers: Object.fromEntries(
              mission.quiz.questions.map((question) => [question.id, question.answer])
            )
          }
        : undefined,
      filePaths: ["image.jpg"]
    }).state;
    const submission = state.submissions.find((item) => item.missionId === mission.id)!;
    if (submission.status !== "approved") {
      state = setSubmissionStatus({
        state,
        submissionId: submission.id,
        status: "approved",
        reviewedBy: "test"
      });
    }
  }
  return state;
}

describe("scoring", () => {
  it("팀 코드는 공백, 대소문자, 하이픈 형태 차이를 흡수한다", () => {
    expect(normalizeTeamLoginCode(" team–01 key ")).toBe("TEAM-01KEY");
    expect(teamLoginCodeMatches("team01key", "TEAM-01-KEY")).toBe(true);
    expect(teamLoginCodeMatches("TEAM－01－KEY", "TEAM-01-KEY")).toBe(true);
  });

  it("단일 미션 승인과 중복 제출은 점수를 한 번만 반영한다", () => {
    let state = createDefaultState();
    state = submitMission({
      state,
      teamId: "team-01",
      missionCode: "NUT-30",
      answerJson: quizAnswers(state, "NUT-30")
    }).state;
    state = submitMission({
      state,
      teamId: "team-01",
      missionCode: "NUT-30",
      answerJson: quizAnswers(state, "NUT-30")
    }).state;
    expect(getTeamProgress(state, "team-01").score).toBe(30);
  });

  it("8개 테마와 16개 미션 보너스를 각각 한 번 반영한다", () => {
    const state = approveAllMissions();
    const missionScore = state.missions.reduce((sum, mission) => sum + mission.points, 0);
    const progress = getTeamProgress(state, "team-01");
    expect(progress.isNewstartComplete).toBe(true);
    expect(progress.isAllClear).toBe(true);
    expect(progress.score).toBe(missionScore + NEWSTART_COMPLETION_BONUS + ALL_CLEAR_BONUS);
  });

  it("제출 취소 시 점수를 회수한다", () => {
    let state = createDefaultState();
    state = submitMission({
      state,
      teamId: "team-01",
      missionCode: "NUT-30",
      answerJson: quizAnswers(state, "NUT-30")
    }).state;
    const submission = state.submissions[0];
    state = setSubmissionStatus({
      state,
      submissionId: submission.id,
      status: "cancelled",
      reviewedBy: "test"
    });
    expect(getTeamProgress(state, "team-01").score).toBe(0);
  });

  it("사진 미션은 이미지 첨부 없이 점수를 지급하지 않는다", () => {
    const state = createDefaultState();
    expect(() =>
      submitMission({
        state,
        teamId: "team-01",
        missionCode: "EXE-50"
      })
    ).toThrow("이미지 파일을 첨부해야 제출할 수 있습니다.");
  });

  it("수동 점수 조정과 되돌리기를 반영한다", () => {
    let state = createDefaultState();
    state = adjustManualScore({
      state,
      teamId: "team-01",
      delta: 25,
      actor: "test",
      note: "현장 보정"
    });
    expect(getTeamProgress(state, "team-01").score).toBe(25);
    const log = state.auditLogs.find((item) => item.action === "manual_score_adjust")!;
    state = undoManualScoreAdjustment({
      state,
      auditLogId: log.id,
      actor: "test"
    });
    expect(getTeamProgress(state, "team-01").score).toBe(0);
    expect(state.auditLogs[0].action).toBe("manual_score_undo");
  });

  it("숨은 운영진 보너스 지급, 중복 제한, 되돌리기 후 재지급을 지원한다", () => {
    let state = createDefaultState();
    const first = grantAdminAward({
      state,
      teamId: "team-01",
      awardType: "hidden_staff",
      title: "숨은 운영진",
      points: 50,
      awardedBy: "test"
    });
    expect(first.ok).toBe(true);
    state = first.state;
    expect(getTeamProgress(state, "team-01").score).toBe(50);

    const duplicate = grantAdminAward({
      state,
      teamId: "team-01",
      awardType: "hidden_staff",
      title: "숨은 운영진",
      points: 50,
      awardedBy: "test"
    });
    expect(duplicate.ok).toBe(false);

    state = undoAdminAward({
      state,
      awardId: state.adminAwards[0].id,
      actor: "test"
    });
    expect(getTeamProgress(state, "team-01").score).toBe(0);

    const second = grantAdminAward({
      state,
      teamId: "team-01",
      awardType: "hidden_staff",
      title: "숨은 운영진",
      points: 50,
      awardedBy: "test"
    });
    expect(second.ok).toBe(true);
  });

  it("운영 점수 초기화는 팀과 코드는 유지하고 점수 근거를 비운다", () => {
    let state = approveAllMissions();
    state = adjustManualScore({
      state,
      teamId: "team-01",
      delta: 25,
      actor: "test",
      note: "현장 보정"
    });
    state = grantAdminAward({
      state,
      teamId: "team-01",
      awardType: "hidden_staff",
      title: "숨은 운영진",
      points: 50,
      awardedBy: "test"
    }).state;
    state = verifyFinal(state, "team-01").state;

    const reset = resetOperationProgress(state);
    expect(reset.teams).toHaveLength(state.teams.length);
    expect(reset.teams[0].loginCode).toBe(state.teams[0].loginCode);
    expect(reset.submissions).toHaveLength(0);
    expect(reset.easterEggClaims).toHaveLength(0);
    expect(reset.adminAwards).toHaveLength(0);
    expect(reset.auditLogs).toHaveLength(0);
    expect(reset.teams[0].manualAdjustment).toBe(0);
    expect(reset.teams[0].finalVerified).toBe(false);
    expect(getTeamProgress(reset, "team-01").score).toBe(0);
  });
});
