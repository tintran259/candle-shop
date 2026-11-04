// Đăng nhập: hết 30 giây khóa thì tự mở lại, đăng xuất ở tab khác thì tab này cũng thoát (docs/pages/login.md)
import { expect, test } from "./support/harness.mjs";

test.use({ autoLogin: false });

const fill = async (page, email: string, password: string) => {
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
};

test("Sai 5 lần thì khóa, đếm ngược, hết 30 giây tự mở lại và đăng nhập được", async ({ page, t }) => {
  void t;
  await page.clock.install();
  await page.goto("/login");
  for (let i = 0; i < 5; i++) {
    await fill(page, "admin@2510.vn", "sai-" + i);
    await expect(page.getByRole("alert")).toBeVisible();
  }
  await expect(page.getByRole("alert")).toContainText("Thử lại sau 30 giây");
  await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeDisabled();
  await page.clock.runFor(10_000);
  await expect(page.getByRole("alert")).toContainText("Thử lại sau 20 giây");
  await page.clock.runFor(21_000);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeEnabled();
  await fill(page, "admin@2510.vn", "2510candle");
  await expect(page).toHaveURL(/\/$/);
});

test("Đăng xuất ở tab khác thì tab đang mở cũng về trang đăng nhập", async ({ page, context, t }) => {
  void t;
  await page.goto("/login");
  await fill(page, "admin@2510.vn", "2510candle");
  await expect(page.locator(".app-sider")).toBeVisible();
  await page.goto("/orders");
  const other = await context.newPage();
  await other.goto("/customers");
  await expect(other.locator(".app-sider")).toBeVisible();
  await other.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(other).toHaveURL(/\/login/);
  await expect(page).toHaveURL(/\/login\?next=%2Forders/);
});
