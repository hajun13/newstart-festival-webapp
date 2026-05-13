import { describe, expect, it } from "vitest";
import { createDefaultState, getTeamProgress, submitMission } from "@/lib/state";
import { THEMES } from "@/lib/types";

function quizAnswers(state: ReturnType<typeof createDefaultState>, missionCode: string) {
  const mission = state.missions.find((item) => item.code === missionCode)!;
  return {
    answers: Object.fromEntries(mission.quiz!.questions.map((question) => [question.id, question.answer]))
  };
}

describe("theme status", () => {
  it("같은 테마에서 1개 미션 성공 시 테마가 클리어된다", () => {
    const initial = createDefaultState();
    const result = submitMission({
      state: initial,
      teamId: "team-01",
      missionCode: "NUT-30",
      answerJson: quizAnswers(initial, "NUT-30")
    });
    const progress = getTeamProgress(result.state, "team-01");
    expect(progress.clearedThemes).toEqual(["nutrition"]);
    expect(progress.codePieces[0]).toBe("ㅅ");
  });

  it("8개 테마 클리어 시 문구가 완성된다", () => {
    let state = createDefaultState();
    for (const theme of THEMES) {
      const mission = state.missions.find((item) => item.theme === theme)!;
      state = submitMission({
        state,
        teamId: "team-01",
        missionCode: mission.code,
        answerText: "요한복음 8:12 나는 세상의 빛 현미 채소 과일 견과류 물 인증 완료",
        answerJson: mission.quiz
          ? {
              answers: Object.fromEntries(
                mission.quiz.questions.map((question) => [question.id, question.answer])
              )
            }
          : undefined,
        filePaths: ["photo.jpg"]
      }).state;
      if (mission.type === "staff" || mission.type === "screenshot") {
        const submission = state.submissions.find((item) => item.missionId === mission.id)!;
        state = {
          ...state,
          submissions: state.submissions.map((item) =>
            item.id === submission.id
              ? { ...item, status: "approved", awardedPoints: mission.points }
              : item
          )
        };
      }
    }
    const progress = getTeamProgress(state, "team-01");
    expect(progress.clearedThemes).toHaveLength(8);
    expect(progress.lifeKey).toBe("ㅅ ㅣ ㄴ ㅎ ㅏ ㄱ ㄱ ㅘㄴ");
  });
});
