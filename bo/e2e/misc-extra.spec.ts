// Bổ sung: màu tag và tên tiếng Anh của danh mục (docs/pages/categories.md), giới hạn mức cọc (docs/pages/settings.md)
import { expect, test } from "./support/harness.mjs";

test("Danh mục: chọn màu tag, để trống tên tiếng Anh thì dùng tên tiếng Việt", async ({ page, t }) => {
  void t;
  await page.goto("/categories");
  await page.getByRole("button", { name: "Thêm danh mục" }).click();
  const modal = page.locator(".ant-modal-wrap:not([style*='none']) .ant-modal");
  await modal.locator("input#vi").fill("Hương gỗ");
  await modal.locator(".ant-form-item").filter({ hasText: "Màu tag" }).locator(".ant-select").click();
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: /^Vàng$/ }).click();
  // Xem trước đổi theo màu và tên
  await expect(modal.locator(".ant-tag").filter({ hasText: "Hương gỗ" })).toHaveClass(/ant-tag-gold/);
  await modal.locator(".ant-modal-footer").getByRole("button", { name: "Thêm danh mục" }).click();
  await expect(modal).toBeHidden();
  const list = await page.evaluate(() => JSON.parse(localStorage.getItem("bo-categories-v1") ?? "[]"));
  expect(list.find((c) => c.id === "huong-go")).toMatchObject({ name: { vi: "Hương gỗ", en: "Hương gỗ" }, color: "gold", hidden: false });
  await expect(page.locator("main tr.ant-table-row").filter({ hasText: "Hương gỗ" })).toContainText("EN: Hương gỗ");
});

test("Cài đặt: mức cọc ngoài 1–99% không lưu được", async ({ page, t }) => {
  void t;
  await page.goto("/settings");
  const deposit = page.locator("main #depositPercent");
  await deposit.fill("0");
  await deposit.blur();
  await page.getByRole("button", { name: "Lưu cài đặt" }).click();
  // InputNumber tự kẹp về khoảng cho phép hoặc báo lỗi; cả hai trường hợp đều không lưu được 0%
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("bo-settings-v1") ?? "null"));
  const value = await deposit.inputValue();
  expect(saved?.depositPercent ?? 50).toBeGreaterThanOrEqual(1);
  expect(Number(value) >= 1 || (await page.getByText("Nhập từ 1 đến 99%.").isVisible())).toBe(true);
  await deposit.fill("150");
  await deposit.blur();
  expect(Number(await deposit.inputValue()) <= 99 || (await page.getByText("Nhập từ 1 đến 99%.").isVisible())).toBe(true);
});
