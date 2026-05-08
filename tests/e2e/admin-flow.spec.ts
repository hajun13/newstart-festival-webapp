import { expect, test } from "@playwright/test";

test("관리자 로그인, 스태프 승인, 감사 로그, CSV 버튼", async ({ page }) => {
  await page.goto("/admin");
  await page.getByRole("textbox").fill("NEWSTART-ADMIN-2026");
  await page.getByRole("button", { name: /관리자 진입/ }).click();
  await expect(page.getByText("운영본부 대시보드")).toBeVisible();

  await page.goto("/admin/staff");
  await page.getByPlaceholder("팀 번호 검색").fill("1");
  await page.getByRole("button", { name: "성공" }).first().click();
  await expect(page.getByText(/approved|승인/).first()).toBeVisible();

  await page.goto("/admin/audit");
  await expect(page.getByText("submission_approved")).toBeVisible();

  await page.goto("/admin/teams");
  await expect(page.getByRole("button", { name: /점수 CSV/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /제출 CSV/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /추첨권 CSV/ })).toBeVisible();
});
