// Cài đặt › Mạng xã hội (docs/pages/settings.md#mạng-xã-hội): thêm như Đơn vị vận chuyển — nền tảng, tên hiện, link https, bật/tắt, xóa (chế độ lưu trên trình duyệt)
import { expect, test } from "./support/harness.mjs";

const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("bo-settings-v1") ?? "null"));
const row = (page, i) => page.getByRole("group", { name: `Mạng xã hội ${i}` });

test("Mạng xã hội: thêm, kiểm tra link / tên, tắt, xóa, lưu theo thứ tự", async ({ page, t }) => {
  void t;
  await page.goto("/settings");
  const section = page.getByRole("region", { name: "Mạng xã hội" });
  await expect(section.getByText("Chưa có mạng xã hội nào.")).toBeVisible();

  // Dòng 1: Instagram, tên để trống
  await section.getByRole("button", { name: "Thêm mạng xã hội" }).click();
  await row(page, 1).getByLabel("Nền tảng").click();
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: "Instagram" }).click();
  await expect(row(page, 1).getByLabel("Tên hiện")).toHaveAttribute("placeholder", "Instagram");
  await row(page, 1).getByLabel("Link").fill("http://instagram.com/2510");

  // Dòng 2: nền tảng Khác, chưa nhập tên
  await section.getByRole("button", { name: "Thêm mạng xã hội" }).click();
  await row(page, 2).getByLabel("Nền tảng").click();
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: "Khác" }).click();
  await row(page, 2).getByLabel("Link").fill("https://lazada.vn/shop/2510");

  await page.getByRole("button", { name: "Lưu cài đặt" }).click();
  await expect(row(page, 1).getByText("Link bắt đầu bằng https://")).toBeVisible();
  await expect(row(page, 2).getByText("Nhập tên cho nền tảng Khác.")).toBeVisible();

  await row(page, 1).getByLabel("Link").fill("https://instagram.com/2510candle");
  await row(page, 2).getByLabel("Tên hiện").fill("Lazada");
  // Dòng 3: Facebook, tắt
  await section.getByRole("button", { name: "Thêm mạng xã hội" }).click();
  await row(page, 3).getByLabel("Link").fill("https://facebook.com/2510candle");
  await row(page, 3).getByRole("switch", { name: "Đang dùng" }).click();

  await page.getByRole("button", { name: "Lưu cài đặt" }).click();
  await expect(page.getByText("Đã lưu cài đặt").first()).toBeVisible();
  const socials = (await saved(page)).socials;
  expect(socials.map(({ platform, label, url, enabled }) => ({ platform, label, url, enabled }))).toEqual([
    { platform: "instagram", label: "", url: "https://instagram.com/2510candle", enabled: true },
    { platform: "other", label: "Lazada", url: "https://lazada.vn/shop/2510", enabled: true },
    { platform: "facebook", label: "", url: "https://facebook.com/2510candle", enabled: false },
  ]);

  // Xóa dòng giữa, tải lại trang vẫn đúng
  await row(page, 2).getByRole("button", { name: "Xóa mạng xã hội 2" }).click();
  await page.getByRole("button", { name: "Lưu cài đặt" }).click();
  await expect(page.getByText("Đã lưu cài đặt").first()).toBeVisible();
  await page.reload();
  await expect(row(page, 2).getByLabel("Link")).toHaveValue("https://facebook.com/2510candle");
  expect((await saved(page)).socials.map((s) => s.platform)).toEqual(["instagram", "facebook"]);
});
