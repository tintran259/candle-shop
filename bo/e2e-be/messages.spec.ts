// Liên hệ trên BE thật: khách gửi lời nhắn (API công khai) → BO đánh dấu đã xử lý / chuyển về / xóa; BE trả lại cả danh sách, kho BO áp đúng
// (lỗi đã gặp: request trả thẳng mảng → sync gọi mảng như hàm → "$ is not a function")
import { expect, test } from "./support/fixtures";

type Message = { id: string; name: string; handled: boolean };

test("Lời nhắn từ web: đánh dấu đã xử lý, chuyển về, xóa — lưu ở BE, không báo lỗi", async ({ page, api }) => {
  const name = `Khách thử ${Date.now() % 100000}`;
  await api.post("/shop/messages", { name, phone: "0901 234 567", message: "Mình muốn đặt quà.", elapsed: 5000 });
  const mine = async () => (await api.get<Message[]>("/admin/messages")).find((m) => m.name === name);
  expect(await mine()).toMatchObject({ handled: false });

  await page.goto("/messages");
  const row = page.getByRole("row").filter({ hasText: name });
  await row.getByRole("button", { name: `Đã xử lý: ${name}` }).click();
  await expect(page.getByText("Đã đánh dấu đã xử lý")).toBeVisible();
  await expect.poll(async () => (await mine())?.handled, { timeout: 20_000 }).toBe(true);

  await page.getByText(/^Đã xử lý \(\d+\)$/).click();
  await row.getByRole("button", { name: `Chuyển về chưa xử lý: ${name}` }).click();
  await expect.poll(async () => (await mine())?.handled, { timeout: 20_000 }).toBe(false);

  await page.getByText("Tất cả", { exact: true }).click();
  await row.getByRole("button", { name: `Xóa lời nhắn của ${name}` }).click();
  await page.locator(".ant-popconfirm").getByRole("button", { name: "Xóa" }).click();
  await expect.poll(async () => await mine(), { timeout: 20_000 }).toBeUndefined();

  // Không có thông báo lỗi nào (vd "$ is not a function")
  await expect(page.locator(".ant-message-error")).toHaveCount(0);
  await expect(page.getByText(/is not a function/)).toHaveCount(0);
});
