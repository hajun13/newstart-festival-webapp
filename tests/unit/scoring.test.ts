import { describe, expect, it } from "vitest";
import { ALL_CLEAR_BONUS, NEWSTART_COMPLETION_BONUS } from "@/lib/scoring/calculate-score";
import { createDefaultState, getTeamProgress, setSubmissionStatus, submitMission } from "@/lib/state";

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
});
