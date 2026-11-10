// Cài đặt › Đăng xuất mọi thiết bị: BE thu hồi mọi token đã cấp — máy này về trang đăng nhập, token cũ gọi API bị 401
import { expect, test } from "./support/fixtures";

test("Đăng xuất mọi thiết bị: về trang đăng nhập, token cũ không dùng được nữa", async ({ page, api }) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: /Đăng xuất mọi thiết bị/ }).click();
  await page.getByRole("button", { name: "Đăng xuất tất cả" }).click();
  await expect(page).toHaveURL(/\/login/);
  // Token của phiên vừa dùng (như ở máy khác) bị từ chối
  await expect(api.get("/auth/me")).rejects.toThrow(/401/);
  // Đăng nhập lại bằng PIN thì dùng được
  await page.locator("#pin").fill("739214");
  await expect(page).not.toHaveURL(/\/login/);
});
