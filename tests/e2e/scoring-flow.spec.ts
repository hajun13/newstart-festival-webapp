import { expect, test } from "@playwright/test";

test("완주 보너스, 올클리어 보너스, 중복 제출 방지, 추첨권 6장", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /초기화/ }).click();
  await page.getByLabel("팀 코드").fill("TEAM-01-KEY");
  await page.getByRole("button", { name: "게임 시작" }).click();

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
  await expect(page.getByText("홍명기홀로 오라!")).toBeVisible();
  await expect(page.getByText(/테마 8\/8 · 미션 16\/16/)).toBeVisible();

  await page.goto("/mission/NUT-30");
  await page.getByRole("button", { name: /제출하기/ }).click();
  await expect(page.getByText(/중복 지급되지 않습니다/)).toBeVisible();

  await page.goto("/final");
  await page.getByRole("button", { name: /최종 인증 처리/ }).click();
  await page.goto("/dashboard");
  await expect(page.getByText(/6장/).first()).toBeVisible();
});
