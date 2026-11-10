// Sentry trên BO: máy chủ trả 5xx thì gửi lỗi lên Sentry (kể cả lúc thư viện Sentry chưa tải xong); 4xx không gửi; không kèm dữ liệu khách
import { expect, test } from "./support/fixtures";

test("API trả 500: gửi lỗi lên Sentry kèm đường dẫn API, không kèm dữ liệu khách; 4xx không gửi", async ({ page, api }) => {
  void api;
  const sent: string[] = [];
  await page.route("https://sentry.invalid/**", async (route) => {
    sent.push(route.request().postData() ?? "");
    await route.fulfill({ status: 200, body: "{}" });
  });
  // Danh sách đơn lỗi máy chủ ngay lần tải đầu (Sentry có thể chưa tải xong); danh sách khách bị từ chối 400
  await page.route("**/api/admin/orders", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ statusCode: 500, message: "Internal server error" }) }));
  await page.route("**/api/admin/customers", (route) => route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ statusCode: 400, message: "Sai" }) }));
  await page.goto("/orders");
  await expect.poll(() => sent.filter((b) => b.includes("API GET /admin/orders → 500")).length, { timeout: 15_000 }).toBeGreaterThan(0);
  await page.waitForTimeout(1500);
  expect(sent.some((b) => b.includes("/admin/customers → 400"))).toBe(false);
  // Không gửi số điện thoại / tên khách (dữ liệu mẫu)
  expect(sent.join("\n")).not.toMatch(/09\d{8}|Khách BE/);
});
