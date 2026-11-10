// Máy chủ chậm trả lời (BE gói Free ngủ, khởi động lại ~30–60 giây): quá 5 giây thì báo đang khởi động, trả lời xong thì ẩn
import { expect, test } from "./support/fixtures";

test("Request quá 5 giây: hiện thông báo máy chủ đang khởi động, có trả lời thì ẩn", async ({ page, api }) => {
  void api;
  // Giữ request danh sách đơn 8 giây như lúc BE đang khởi động
  await page.route("**/api/admin/orders", async (route) => {
    await new Promise((r) => setTimeout(r, 8000));
    await route.continue();
  });
  await page.goto("/orders");
  const notice = page.getByText("Máy chủ đang khởi động");
  await expect(notice).toBeHidden();
  await expect(notice).toBeVisible({ timeout: 7000 });
  await expect(notice).toBeHidden({ timeout: 10_000 });
});
