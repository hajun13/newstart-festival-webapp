import { expect, test } from "@playwright/test";

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

test("사진 미션 제출 후 관리자 제출 검토에서 이미지와 처리 버튼을 확인한다", async ({ page }) => {
  await page.request.post("/api/mock/reset");
  await page.goto("/login");
  await page.getByLabel("팀 코드").fill("TEAM-01-KEY");
  await page.getByRole("button", { name: "게임 시작" }).click();
  await expect(page).toHaveURL(/dashboard/);

  await page.goto("/mission/EXE-50");
  await page.getByRole("button", { name: /제출하기/ }).click();
  await expect(page.getByText("이미지를 선택한 뒤 제출해 주세요.")).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: "mission-photo.png",
    mimeType: "image/png",
    buffer: tinyPng
  });
  await page.getByRole("button", { name: /제출하기/ }).click();
  await expect(page.getByText(/50점이 반영/)).toBeVisible();

  await page.goto("/admin");
  await page.locator("#admin-password").fill("NEWSTART-ADMIN-2026");
  await page.getByRole("button", { name: /관리자 진입/ }).click();
  await expect(page.getByText("진행 상황 한눈에 보기")).toBeVisible();

  await page.goto("/admin/submissions");
  const row = page.locator("tr").filter({ hasText: "EXE-50" }).first();
  await expect(row).toBeVisible();
  await expect(row.locator("img")).toBeVisible();

  await row.getByRole("button", { name: "취소" }).click();
  await expect(page.getByText("취소 처리했습니다.")).toBeVisible();
  await row.getByRole("button", { name: "승인" }).click();
  await expect(page.getByText("승인 처리했습니다.")).toBeVisible();
});
