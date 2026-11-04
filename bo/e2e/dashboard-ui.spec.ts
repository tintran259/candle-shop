// Dashboard: đơn gần đây, so với kỳ trước, biểu đồ theo danh mục đổi theo trang Danh mục (docs/pages/dashboard.md)
import { expect, test } from "./support/harness.mjs";

test.beforeEach(async ({ page, t }) => {
  void t;
  await page.goto("/");
  await expect(page.locator("main").getByText("Đơn hàng gần đây")).toBeVisible();
});

test("Bấm một đơn gần đây mở đúng đơn", async ({ page }) => {
  const row = page.locator("main .ant-card").filter({ hasText: "Đơn hàng gần đây" }).locator("tr.ant-table-row").first();
  const code = (await row.locator("a").innerText()).trim();
  await row.click();
  await expect(page).toHaveURL(/\/orders\?order=/);
  await expect(page.locator(".ant-drawer-open")).toContainText(code);
});

test("Thẻ chỉ số so với kỳ trước hoặc báo chưa có số", async ({ page }) => {
  for (const label of ["Doanh thu", "Đơn hàng", "Giá trị đơn TB", "Khách hàng mới"]) {
    const card = page.locator("main .ant-card").filter({ hasText: label }).first();
    await expect(card).toBeVisible();
    // Mỗi thẻ có mũi tên Tăng/Giảm kèm % hoặc dòng "chưa có số để so sánh"
    await expect(card.getByLabel(/Tăng|Giảm/).or(card.getByText(/chưa có số để so sánh|so với/))).not.toHaveCount(0);
  }
});

test("Biểu đồ theo danh mục dùng tên mới sau khi đổi tên danh mục", async ({ page }) => {
  await page.goto("/?days=90");
  const card = page.locator("main .ant-card").filter({ hasText: "Theo danh mục" });
  await expect(card).toContainText("Tự phối");
  await expect(card).toContainText("Nước hoa");
  await page.goto("/categories");
  await page.getByRole("button", { name: "Sửa Nước hoa" }).click();
  await page.locator(".ant-modal input#vi").fill("Hương nước hoa");
  await page.locator(".ant-modal-footer").getByRole("button", { name: "Lưu" }).click();
  await page.goto("/?days=90");
  await expect(card).toContainText("Hương nước hoa");
});

test("Thẻ việc cần xử lý mở đúng danh sách", async ({ page }) => {
  const card = page.locator("main .ant-card").filter({ hasText: "Nguyên liệu đang giữ" }).first();
  await expect(card).toBeVisible();
  await card.getByRole("link").first().click();
  await expect(page).toHaveURL(/\/inventory/);
});
