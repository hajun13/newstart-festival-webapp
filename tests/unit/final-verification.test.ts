import { describe, expect, it } from "vitest";
import { createDefaultState, getTeamProgress, setSubmissionStatus, submitMission, verifyFinal } from "@/lib/state";
import { THEMES } from "@/lib/types";

function clearAllThemes() {
  let state = createDefaultState();
  for (const theme of THEMES) {
    const mission = state.missions.find((item) => item.theme === theme)!;
    state = submitMission({
      state,
      teamId: "team-01",
      missionCode: mission.code,
      answerText: "요한복음 8:12 나는 세상의 빛 현미 채소 과일 견과류 물 인증",
      answerJson: mission.quiz
        ? { answers: Object.fromEntries(mission.quiz.questions.map((q) => [q.id, q.answer])) }
        : undefined,
      filePaths: ["image.jpg"]
    }).state;
    const submission = state.submissions.find((item) => item.missionId === mission.id)!;
    if (submission.status !== "approved") {
      state = setSubmissionStatus({ state, submissionId: submission.id, status: "approved", reviewedBy: "test" });
    }
  }
  return state;
}

describe("final verification", () => {
  it("8개 테마 미완료 팀은 최종 인증에 실패한다", () => {
    const result = verifyFinal(createDefaultState(), "team-01");
    expect(result.ok).toBe(false);
    expect(result.missingThemes).toHaveLength(8);
  });

  it("8개 테마 완료 팀은 최종 인증에 성공하고 중복 추첨권은 없다", () => {
    let state = clearAllThemes();
    const before = getTeamProgress(state, "team-01").tickets;
    const first = verifyFinal(state, "team-01");
    expect(first.ok).toBe(true);
    state = first.state;
    const after = getTeamProgress(state, "team-01").tickets;
    expect(after).toBe(Math.min(6, before + 2));
    const second = verifyFinal(state, "team-01");
    expect(getTeamProgress(second.state, "team-01").tickets).toBe(after);
  });
});
