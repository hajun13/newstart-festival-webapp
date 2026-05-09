import { expect, test } from "@playwright/test";

test("관리자 로그인, 운영 내비, 팀 관리, 점수 되돌리기", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByText("관리자 로그인")).toBeVisible();
  await page.getByRole("textbox").fill("NEWSTART-ADMIN-2026");
  await page.getByRole("button", { name: /관리자 진입/ }).click();
  await expect(page.getByText("운영본부 대시보드")).toBeVisible();
  await expect(page.getByText("팀별 미션 진행 현황")).toBeVisible();
  await page.getByRole("button", { name: "참가자 홈" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/admin/staff");
  await page.getByPlaceholder("팀 번호 검색").fill("1");
  await page.getByRole("button", { name: "성공" }).first().click();
  await expect(page.getByText(/approved|승인/).first()).toBeVisible();

  await page.goto("/admin/audit");
  await expect(page.getByText("submission_approved")).toBeVisible();

  await page.goto("/admin/teams");
  await expect(page.getByRole("button", { name: /팀 CSV/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /제출 CSV/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /추첨권 CSV/ })).toBeVisible();
  const teamNumber = Number(await page.getByLabel("새 팀 번호").inputValue());
  const teamName = `테스트 운영팀 ${teamNumber}`;
  const editedTeamName = `수정 운영팀 ${teamNumber}`;
  const teamCode = `TEAM-${String(teamNumber).padStart(2, "0")}-KEY`;
  await page.getByLabel("새 팀 이름").fill(teamName);
  await page.getByLabel("새 팀 코드").fill("");
  await page.getByLabel("새 팀 교회").fill("테스트교회");
  await page.getByLabel("새 팀 인원").fill("7");
  await page.getByRole("button", { name: "팀 추가" }).click();
  await expect(page.getByText(`${teamNumber}번 · ${teamName}`)).toBeVisible();

  await page.getByLabel(`${teamName} 팀 이름`).fill(editedTeamName);
  await page.getByRole("button", { name: "팀 정보 저장" }).last().click();
  await expect(page.getByText(`${teamNumber}번 · ${editedTeamName}`)).toBeVisible();

  await page.goto("/login");
  await page.locator("#team-code").fill(teamCode);
  await page.getByRole("button", { name: /게임 시작/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByText(editedTeamName).first()).toBeVisible();

  await page.goto("/admin/teams");
  await page.getByRole("spinbutton", { name: `${editedTeamName} 점수 조정` }).fill("15");
  await page.getByLabel(`${editedTeamName} 점수 조정 사유`).fill("테스트 보정");
  await page.getByRole("button", { name: "점수 조정 저장" }).last().click();
  await expect(page.getByText("+15점")).toBeVisible();
  await page.getByRole("button", { name: /되돌리기/ }).last().click();
  await expect(page.getByRole("button", { name: /되돌림/ })).toBeVisible();

  await page.getByPlaceholder(`삭제하려면 ${editedTeamName} 입력`).fill(editedTeamName);
  await page.getByRole("button", { name: /팀 삭제/ }).last().click();
  await expect(page.getByText(`${teamNumber}번 · ${editedTeamName}`)).not.toBeVisible();

  await page.goto("/admin");
  await page.getByRole("button", { name: /로그아웃/ }).click();
  await expect(page.getByText("관리자 로그인")).toBeVisible();
});
