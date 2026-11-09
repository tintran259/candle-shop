// Hình thức thanh toán khi tạo đơn: Cọc x% (theo từng đơn), Trả đủ, Trả sau (docs/pages/orders.md#hình-thức-thanh-toán)
import { expect, test } from "./support/harness.mjs";

const drawer = (page) => page.locator(".ant-drawer-open").last();
const saved = (page, phone: string) => page.evaluate((p) => JSON.parse(localStorage.getItem("bo-orders-v4") ?? "[]").find((o) => o.customer.phone === p), phone);

// Mở form tạo đơn, điền khách, chọn Moon Morning (850.000 ₫)
async function startOrder(page, phone: string) {
  await page.goto("/orders");
  await page.getByRole("button", { name: /Tạo đơn hàng|Tiếp tục đơn nháp/ }).click();
  const o = drawer(page);
  await o.locator("#name").fill("Khách Thử");
  await o.locator("#phone").fill(phone);
  await o.locator("#address").fill("1 Hàng Bài, Hà Nội");
  await o.getByRole("button", { name: "Nến có sẵn" }).click();
  await expect(async () => {
    await o.getByLabel("Chọn sản phẩm").last().click();
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("Moon Morning");
    await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: "Moon Morning" }).first().click();
    await expect(o.locator("aside.order-summary")).toContainText("Moon Morning", { timeout: 2000 });
  }).toPass({ timeout: 15_000 });
  return o;
}

test.beforeEach(async ({ page, t }) => {
  void t;
  await page.goto("/");
  // Cọc mặc định 50%, phương thức giao miễn phí để dễ tính
  await page.evaluate(() => localStorage.setItem("bo-settings-v1", JSON.stringify({ depositPercent: 50, shippingOptions: [{ id: "standard", name: "Tiêu chuẩn", fee: 0, days: 3, enabled: true }] })));
});

test("Cọc theo % từng đơn: điền sẵn theo Cài đặt, sửa 30% thì tiền cọc và đơn lưu đúng 30%", async ({ page }) => {
  const o = await startOrder(page, "0901 300 300");
  const pct = o.getByLabel("Phần trăm cọc");
  await expect(pct).toHaveValue("50");
  await expect(o.locator("aside.order-summary")).toContainText(/Cọc 50% tiền hàng khi đặt\s*425\.000/);
  await pct.fill("30");
  await expect(o).toContainText("Cài đặt: 50%");
  await expect(o.locator("aside.order-summary")).toContainText(/Cọc 30% tiền hàng khi đặt\s*255\.000/);
  await expect(o.locator("aside.order-summary")).toContainText(/Thu nốt khi giao\s*595\.000/);
  await o.getByLabel("Đã nhận tiền").click();
  await o.locator(".ant-drawer-footer").getByRole("button", { name: /^Tạo đơn/ }).click();
  await expect(drawer(page)).not.toContainText("Phần trăm cọc");
  const order = await saved(page, "0901 300 300");
  expect(order).toMatchObject({ paymentPlan: "deposit", depositPercent: 30, status: "paid", payments: [expect.objectContaining({ amount: 255_000, status: "success" })] });
});

test("Trả sau: không thu lúc đặt, Chờ xác nhận → Xác nhận đơn → Đã xác nhận; khách trả toàn bộ khi nhận", async ({ page }) => {
  const o = await startOrder(page, "0901 400 400");
  await o.locator(".ant-radio-button-wrapper", { hasText: "Trả sau" }).click();
  await expect(o.getByLabel("Phần trăm cọc")).toHaveCount(0);
  const summary = o.locator("aside.order-summary");
  await expect(summary).toContainText(/Thu khi nhận hàng\s*850\.000/);
  await expect(summary).toContainText("Chờ xác nhận");
  await expect(o).toContainText("Xác nhận đơn luôn");
  await o.locator(".ant-drawer-footer").getByRole("button", { name: /^Tạo đơn/ }).click();
  await expect.poll(() => saved(page, "0901 400 400")).toBeTruthy();
  const order = await saved(page, "0901 400 400");
  expect(order).toMatchObject({ paymentPlan: "later", status: "pending", payments: [] });

  // Danh sách: trạng thái và thanh toán theo hình thức trả sau
  await page.goto("/orders");
  const row = page.locator(".ant-table-row", { hasText: order.code });
  await expect(row).toContainText("Chờ xác nhận");
  await expect(row).toContainText("Trả khi nhận hàng");

  // Chi tiết: nút Xác nhận đơn (không thu tiền)
  await page.goto(`/orders?order=${order.id}`);
  const d = drawer(page);
  await d.getByRole("button", { name: "Xác nhận đơn" }).click();
  await expect(d).toContainText("Đã xác nhận");
  const after = await saved(page, "0901 400 400");
  expect(after).toMatchObject({ status: "paid", payments: [] });
  await expect(d).toContainText("Khách trả toàn bộ khi nhận hàng");
});
