// Phần chung: số đỏ trên menu, thông báo, tìm kiếm Ctrl K, thu gọn menu, menu điện thoại (docs/pages/common.md)
import { expect, test } from "./support/harness.mjs";

const menuItem = (page, label) => page.locator(".app-sider .ant-menu-item").filter({ hasText: label });
const badge = async (page, label) => Number((await menuItem(page, label).locator(".ant-badge sup, .ant-scroll-number").first().getAttribute("title")) ?? "0");
const rowCount = async (page, url) => {
  await page.goto(url);
  // Có đơn thì hiện bảng, không có thì hiện ô trống
  await page.locator("main .ant-table, main .ant-empty").first().waitFor();
  return page.locator("main tr.ant-table-row").count();
};

test.beforeEach(async ({ page, t }) => {
  void t;
  await page.goto("/");
  await expect(page.locator(".app-sider")).toBeVisible();
});

test("Số đỏ menu Đơn hàng = đơn chờ thanh toán, đã thanh toán, giao không thành, đã hoàn về", async ({ page }) => {
  await expect(menuItem(page, "Đơn hàng").locator(".ant-badge")).toBeVisible();
  const shown = await badge(page, "Đơn hàng");
  let sum = 0;
  for (const status of ["pending", "paid", "delivery_failed", "returned"]) sum += await rowCount(page, `/orders?status=${status}`);
  expect(shown).toBe(sum);
  expect(shown).toBeGreaterThan(0);
});

test("Số đỏ menu Kho = nguyên liệu đã hết hàng, nhập thêm thì giảm", async ({ page }) => {
  const shown = await badge(page, "Kho nguyên liệu");
  expect(shown).toBe(await rowCount(page, "/inventory?status=out"));
  // Nhập thêm cho một nguyên liệu hết hàng bằng nút + trên bảng
  const row = page.locator("main tr.ant-table-row").first();
  await row.getByRole("button", { name: /^Nhập thêm/ }).click();
  const modal = page.locator(".ant-modal-wrap:not([style*='none']) .ant-modal");
  await modal.locator("input.ant-input-number-input").first().fill("10");
  await modal.getByLabel("Tổng tiền lô").fill("100000");
  await modal.locator(".ant-modal-footer .ant-btn-primary").click();
  await expect.poll(() => badge(page, "Kho nguyên liệu")).toBe(shown - 1);
});

test("Thông báo: nhóm Cần xử lý, bấm mở đúng chỗ, đánh dấu đã đọc", async ({ page }) => {
  const bell = page.getByRole("button", { name: /^Thông báo/ });
  await expect(bell).toHaveAccessibleName(/chưa đọc/);
  await bell.click();
  const panel = page.getByRole("dialog", { name: "Thông báo" });
  await expect(panel).toContainText("Cần xử lý");
  // Nguyên liệu hết hàng có thông báo, bấm mở Kho
  const stock = panel.locator(".notif-row").filter({ hasText: /hết hàng/i }).first();
  await stock.click();
  await expect(page).toHaveURL(/\/inventory/);
  await bell.click();
  await panel.getByRole("button", { name: "Đánh dấu đã đọc hết" }).click();
  await expect(bell).toHaveAccessibleName("Thông báo");
});

test("Tìm kiếm: Ctrl K mở, tìm không dấu, Enter mở kết quả, lưu mở gần đây", async ({ page }) => {
  await page.keyboard.press("Control+k");
  const input = page.getByRole("combobox", { name: "Tìm kiếm" });
  await expect(input).toBeFocused();
  await input.fill("wing sun");
  const list = page.getByRole("listbox", { name: "Kết quả" });
  await expect(list.getByRole("option").first()).toContainText("Wing Sun");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/customer=|order=/);
  // Mở lại: kết quả vừa mở nằm ở Mở gần đây
  await page.keyboard.press("Escape");
  await page.keyboard.press("Control+k");
  // Ô tìm vẫn giữ chữ lần trước; xóa đi thì thấy Mở gần đây
  await input.fill("");
  await expect(list).toContainText("Mở gần đây");
  await expect(list).toContainText("Wing Sun");
});

test("Tìm kiếm: sản phẩm, nguyên liệu, không có kết quả, phím /", async ({ page }) => {
  await page.locator("main").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("/");
  const input = page.getByRole("combobox", { name: "Tìm kiếm" });
  await expect(input).toBeFocused();
  await input.fill("moon morning");
  await expect(page.getByRole("listbox", { name: "Kết quả" })).toContainText("Moon Morning");
  await input.fill("sap dau nanh");
  await expect(page.getByRole("listbox", { name: "Kết quả" })).toContainText("Sáp đậu nành");
  await input.fill("khong co gi het");
  await expect(page.getByText("Không tìm thấy kết quả cho “khong co gi het”.")).toBeVisible();
});

test("Thu gọn menu trên máy tính", async ({ page }) => {
  await page.getByRole("button", { name: "Thu gọn menu" }).click();
  await expect(page.locator(".app-sider")).toHaveCSS("width", "80px");
  await page.getByRole("button", { name: "Mở menu" }).click();
  await expect(page.locator(".app-sider")).toHaveCSS("width", "256px");
});

test("Menu trên điện thoại: ẩn, mở ra đè nội dung, chọn trang thì đóng", async ({ page, t }) => {
  await t.viewport(390, 844, true);
  await page.goto("/");
  await expect(page.locator(".app-sider")).toBeHidden();
  await page.getByRole("button", { name: "Mở menu" }).click();
  await expect(page.locator(".app-sider")).toBeVisible();
  await menuItem(page, "Khách hàng").click();
  await expect(page).toHaveURL(/\/customers/);
  await expect(page.locator(".app-sider")).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
