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

test("완주 보너스, 올클리어 보너스, 중복 제출 방지, 추첨권 6장", async ({ page }) => {
  await page.request.post("/api/mock/reset");
  await page.goto("/login");
  await page.getByLabel("팀 코드").fill("TEAM-01-KEY");
  await page.getByRole("button", { name: "게임 시작" }).click();
  await expect(page).toHaveURL(/dashboard/);

  await page.goto("/mission/NUT-30");
  for (const [index, answer] of nutritionAnswers.entries()) {
    await page.locator("fieldset").nth(index).getByLabel(answer, { exact: true }).check();
  }
  await page.getByRole("button", { name: /제출하기/ }).click();
  await expect(page.getByText(/30점이 반영/)).toBeVisible();
  await page.getByRole("button", { name: /제출하기/ }).click();
  await expect(page.getByText(/중복 지급되지 않습니다/)).toBeVisible();

  await page.evaluate(() => {
    type StoredMission = { id: string; type: string; points: number };
    const raw = localStorage.getItem("newstart-festival-state-v1");
    if (!raw) throw new Error("state missing");
    const state = JSON.parse(raw);
    const teamId = "team-01";
    state.submissions = (state.missions as StoredMission[]).map((mission) => ({
      id: `all-${mission.id}`,
      teamId,
      missionId: mission.id,
      type: mission.type,
      status: "approved",
      answerText: "all clear",
      answerJson: {},
      filePaths: [],
      awardedPoints: mission.points,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    localStorage.setItem("newstart-festival-state-v1", JSON.stringify(state));
  });

  await page.goto("/dashboard");
  await expect(page.getByText("ㅅㅣㄴㅎㅏㄱ관에서 밥ㅁㅓㄱㅈㅏ")).toBeVisible();
  await expect(page.getByText(/테마 8\/8 · 미션 16\/16/)).toBeVisible();

  await page.goto("/final");
  await page.getByRole("button", { name: /최종 인증 처리/ }).click();
  await page.goto("/dashboard");
  await expect(page.getByText(/6장/).first()).toBeVisible();
});
