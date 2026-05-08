import { expect, test } from "@playwright/test";

test("팀 로그인, 퀴즈 제출, 코드 조각, 최종 인증 성공 흐름", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("팀 코드").fill("TEAM-01-KEY");
  await page.getByRole("button", { name: /로그인/ }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(page.getByText("NEWSTART 1팀", { exact: true })).toBeVisible();
  await expect(page.getByText("0점")).toBeVisible();

  await page.goto("/code");
  await page.getByRole("textbox").fill("NUT-30");
  await page.getByRole("button", { name: /미션 열기/ }).click();
  await expect(page).toHaveURL(/mission\/NUT-30/);
  await page.getByLabel("균형").check();
  await page.getByLabel("물").check();
  await page.getByLabel("비타민").check();
  await page.getByRole("button", { name: /제출하기/ }).click();
  await expect(page.getByText(/30점이 반영/)).toBeVisible();

  await page.goto("/dashboard");
  await expect(page.getByText("홍", { exact: true })).toBeVisible();

  await page.evaluate(() => {
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
  });

  await page.goto("/dashboard");
  await expect(page.getByText("홍명기홀로 오라!")).toBeVisible();
  await page.goto("/final");
  await page.getByRole("button", { name: /최종 인증 처리/ }).click();
  await expect(page.getByText(/최종 인증이 완료/)).toBeVisible();
  await expect(page.getByText(/현재 추첨권 6장|추첨권 6장/)).toBeVisible();
});
