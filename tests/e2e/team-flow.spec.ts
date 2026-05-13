import { expect, test } from "@playwright/test";

const nutritionAnswers = [
  "철분 흡수를 돕고 항산화 작용을 한다",
  "고혈압",
  "빈혈",
  "야맹증",
  "산소 운반",
  "철분",
  "비타민 D",
  "비타민 C",
  "충치와 체중 증가",
  "식이섬유 - 혈액 속 산소 운반",
  "O",
  "O",
  "X",
  "O"
];

test("팀 로그인, 퀴즈 제출, 코드 조각, 최종 인증 성공 흐름", async ({ page }) => {
  await page.request.post("/api/mock/reset");
  await page.goto("/login");
  await page.getByLabel("팀 코드").fill("TEAM-01-KEY");
  await page.getByRole("button", { name: "게임 시작" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText("NEWSTART 1팀", { exact: true })).toBeVisible();
  await expect(page.getByText("0점")).toBeVisible();

  await page.goto("/code");
  await page.getByRole("textbox").fill("NUT-30");
  await page.getByRole("button", { name: /미션 열기/ }).click();
  await expect(page).toHaveURL(/mission\/NUT-30/);
  for (const [index, answer] of nutritionAnswers.entries()) {
    await page.locator("fieldset").nth(index).getByLabel(answer, { exact: true }).check();
  }
  await page.getByRole("button", { name: /제출하기/ }).click();
  await expect(page.getByText(/30점이 반영/)).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("ㅅㅣ", { exact: true })).toBeVisible();

  const seededState = await page.evaluate(() => {
    type StoredMission = { id: string; type: string; points: number };
    type StoredSubmission = { teamId: string; missionId: string };
    const raw = localStorage.getItem("newstart-festival-state-v1");
    if (!raw) throw new Error("state missing");
    const state = JSON.parse(raw);
    const teamId = "team-01";
    for (const mission of state.missions as StoredMission[]) {
      if (!state.submissions.some((item: StoredSubmission) => item.teamId === teamId && item.missionId === mission.id)) {
        state.submissions.push({
          id: `e2e-${mission.id}`,
          teamId,
          missionId: mission.id,
          type: mission.type,
          status: "approved",
          answerText: "e2e",
          answerJson: {},
          filePaths: [],
          awardedPoints: mission.points,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        state.submissions = state.submissions.map((item: StoredSubmission) =>
          item.teamId === teamId && item.missionId === mission.id
            ? { ...item, status: "approved", awardedPoints: mission.points }
            : item
        );
      }
    }
    localStorage.setItem("newstart-festival-state-v1", JSON.stringify(state));
    return state;
  });
  await page.request.post("/api/state", { data: seededState });

  await page.goto("/dashboard");
  await expect(page.getByText("ㅅㅣㄴㅎㅏㄱ관에서 밥ㅁㅓㄱㅈㅏ")).toBeVisible();
  await page.goto("/final");
  await page.getByRole("button", { name: /최종 인증 처리/ }).click();
  await expect(page.getByText(/최종 인증이 완료/)).toBeVisible();
  await expect(page.getByText(/현재 추첨권 6장|추첨권 6장/)).toBeVisible();
});
