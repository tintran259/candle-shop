// Mất mạng khi đang lưu: BO giữ thao tác, báo chưa lưu, tự gửi lại khi có mạng — không mất, không ghi trùng (Idempotency-Key).
// Dùng nhiều thiết bị: quay lại tab sau một lúc thì tải lại dữ liệu mới (thay đổi từ máy khác)
import { drawer, expect, test } from "./support/fixtures";
import { createOrder, RECIPE, stocks, type Order } from "./support/orders";

test("Mất phản hồi khi Bắt đầu làm: BE đã làm, BO gửi lại cùng khóa → Kho chỉ trừ một lần; báo chưa lưu rồi đã lưu", async ({ page, api }) => {
  const order = await createOrder(page, api, "0909 555 666");
  const before = await stocks(api);
  await page.goto(`/orders?order=${order.id}`);
  await expect(drawer(page)).toContainText(order.code);

  // Lần gửi đầu: BE nhận và làm xong, nhưng BO không nhận được trả lời (như rớt mạng đúng lúc đó). Các lần sau: mất mạng hẳn
  let attempts = 0;
  let down = true;
  await page.route("**/api/admin/orders/*/advance", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fetch();
      return route.abort("internetdisconnected");
    }
    if (down) return route.abort("internetdisconnected");
    return route.continue();
  });
  await drawer(page)
    .getByRole("button", { name: /Bắt đầu làm$/ })
    .click();

  await expect(page.getByText(/Mất kết nối máy chủ — 1 thay đổi chưa lưu/)).toBeVisible();
  // Giao diện đã đổi ngay, BE đã làm (lần đầu)
  await expect(drawer(page).getByRole("button", { name: /Đã làm xong$/ })).toBeVisible();
  await expect.poll(async () => (await api.get<Order>(`/admin/orders/${order.id}`)).status).toBe("producing");

  // Có mạng lại: gửi lại ngay, BE trả kết quả cũ theo khóa — không trừ Kho lần hai
  down = false;
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.getByText("Đã kết nối lại — đã lưu các thay đổi.")).toBeVisible();
  await expect(page.getByText(/Mất kết nối máy chủ/)).toBeHidden();
  expect(attempts).toBeGreaterThanOrEqual(2);
  const after = await stocks(api);
  for (const [id, qty] of Object.entries(RECIPE)) expect(after[id], id).toBe(before[id] - qty);
  const events = await api.get<Order & { history: { status: string }[] }>(`/admin/orders/${order.id}`);
  expect(events.history.filter((h) => h.status === "producing")).toHaveLength(1);
});

test("Quay lại tab sau hơn 30 giây: tải lại dữ liệu, thấy thay đổi từ thiết bị khác", async ({ page, api }) => {
  const order = await createOrder(page, api, "0909 777 888");
  await page.goto(`/orders?order=${order.id}`);
  await expect(drawer(page)).toContainText("Bắt đầu làm");

  // Ẩn tab (chuyển app / khóa màn hình điện thoại)
  const setVisibility = (state: "hidden" | "visible") =>
    page.evaluate((s) => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => s });
      document.dispatchEvent(new Event("visibilitychange"));
    }, state);
  await setVisibility("hidden");
  // Máy khác chuyển đơn sang Đang làm
  await api.post(`/admin/orders/${order.id}/advance`);
  await page.waitForTimeout(31_000);
  await setVisibility("visible");
  await expect(drawer(page).getByRole("button", { name: /Đã làm xong$/ })).toBeVisible();
});
