// Bán hàng › Liên hệ (docs/pages/messages.md): lời nhắn khách gửi ở web — số chưa xử lý trên menu, lọc, nhắn Zalo, đánh dấu đã xử lý, xóa
import { expect, test } from "./support/harness.mjs";

const at = (h) => new Date(Date.now() - h * 3_600_000).toISOString();
const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("bo-messages-v1")));
const row = (page, name) => page.getByRole("row").filter({ hasText: name });

test("Liên hệ: huy hiệu menu, lọc Chưa xử lý / Đã xử lý, nhắn Zalo, đánh dấu, xóa", async ({ page, t }) => {
  void t;
  await page.goto("/messages");
  await expect(page.getByText("Không còn lời nhắn chưa xử lý")).toBeVisible();
  await page.evaluate(
    (list) => localStorage.setItem("bo-messages-v1", JSON.stringify(list)),
    [
      { id: "m1", name: "Lan", phone: "0901 234 567", email: "lan@example.com", message: "Mình muốn đặt 5 hũ làm quà.", handled: false, createdAt: at(1) },
      { id: "m2", name: "Mai", phone: "+84 912 345 678", email: "", message: "Có giao Hà Nội không?", handled: false, createdAt: at(5) },
      { id: "m3", name: "Hoa", phone: "0987654321", email: "", message: "Cảm ơn shop!", handled: true, createdAt: at(30) },
    ],
  );
  await page.goto("/");

  // Menu: số lời nhắn chưa xử lý
  const menu = page.getByRole("menuitem", { name: /Liên hệ/ });
  await expect(menu.locator(".ant-badge")).toContainText("2");
  await menu.click();
  await expect(page).toHaveURL(/\/messages$/);

  // Mặc định: Chưa xử lý, mới nhất trước
  await expect(page.getByRole("row")).toHaveCount(3);
  await expect(page.getByRole("row").nth(1)).toContainText("Lan");
  await expect(row(page, "Lan")).toContainText("lan@example.com");
  await expect(row(page, "Mai").getByRole("link", { name: "Nhắn Zalo cho Mai" })).toHaveAttribute("href", "https://zalo.me/0912345678");

  // Đánh dấu đã xử lý: rời danh sách Chưa xử lý, huy hiệu giảm
  await row(page, "Lan").getByRole("button", { name: "Đã xử lý: Lan" }).click();
  await expect(page.getByText("Đã đánh dấu đã xử lý")).toBeVisible();
  await expect(row(page, "Lan")).toHaveCount(0);
  await expect(menu.locator(".ant-badge")).toContainText("1");
  expect((await stored(page)).find((m) => m.id === "m1").handled).toBe(true);

  // Đã xử lý: chuyển về chưa xử lý được
  await page.getByText(/^Đã xử lý \(2\)$/).click();
  await expect(page.getByRole("row")).toHaveCount(3);
  await row(page, "Hoa").getByRole("button", { name: "Chuyển về chưa xử lý: Hoa" }).click();
  await expect(row(page, "Hoa")).toHaveCount(0);

  // Xóa
  await page.getByText("Tất cả", { exact: true }).click();
  await row(page, "Mai").getByRole("button", { name: "Xóa lời nhắn của Mai" }).click();
  await page.locator(".ant-popconfirm").getByRole("button", { name: "Xóa" }).click();
  await expect(row(page, "Mai")).toHaveCount(0);
  expect((await stored(page)).map((m) => m.id)).toEqual(["m1", "m3"]);
});
