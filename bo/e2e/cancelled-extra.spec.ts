// Sản phẩm hủy đơn: đơn Đã hoàn về nến tốt / nến hỏng khi hủy, bộ lọc và tìm kiếm (docs/pages/cancelled-products.md)
import { expect, test } from "./support/harness.mjs";

const now = new Date().toISOString();
const custom = { id: "i-c", name: "Nến tự phối", custom: "Hũ gốm · 150g · Sáp dừa", price: 500_000, quantity: 1 };
const returned = (id: string, returnCondition: "good" | "damaged") => ({
  id,
  code: "T" + id.toUpperCase(),
  status: "returned",
  returnCondition,
  customer: { name: "Khách hoàn " + id, email: "", phone: "0900000009" },
  shippingAddress: "1 A",
  shippingMethod: "standard",
  shippingName: "Tiêu chuẩn",
  shippingDays: 3,
  depositPercent: 50,
  items: [custom],
  subtotal: 500_000,
  discount: 0,
  shippingFee: 0,
  total: 500_000,
  paymentPlan: "full",
  paymentMethod: "cod",
  payments: [{ id: "p-" + id, provider: "cod", amount: 500_000, status: "success", createdAt: now }],
  readyDate: "2026-12-30",
  history: [{ at: now, status: "returned", by: "x" }],
  createdAt: now,
  updatedAt: now,
});
const cancelled = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("bo-cancelled-products-v3") ?? "[]"));

const cancelOrder = async (page, id: string) => {
  await page.goto(`/orders?order=${id}`);
  const d = page.locator(".ant-drawer-open");
  await d.locator("section").getByRole("button", { name: "Hủy đơn" }).click();
  const modal = page.locator(".ant-modal-wrap:not([style*='none']) .ant-modal");
  await modal.locator("textarea").fill("Khách không nhận");
  await modal.locator(".ant-radio-wrapper").filter({ hasText: "Lỗi do khách" }).click();
  await modal.locator(".ant-modal-footer").getByRole("button", { name: "Hủy đơn" }).click();
  await expect(d).toContainText("Đã hủy");
};

test("Đơn Đã hoàn về: nến còn tốt vào Sản phẩm hủy đơn, nến hỏng thì không", async ({ page, t }) => {
  void t;
  await page.goto("/");
  await page.evaluate((list) => localStorage.setItem("bo-orders-v3", JSON.stringify(list)), [returned("good", "good"), returned("bad", "damaged")]);
  await cancelOrder(page, "good");
  await cancelOrder(page, "bad");
  const list = await cancelled(page);
  expect(list.filter((c) => c.orderId === "good")).toHaveLength(1);
  expect(list.filter((c) => c.orderId === "bad")).toHaveLength(0);
  await page.goto("/cancelled-products");
  await expect(page.locator("main tr.ant-table-row").filter({ hasText: "TGOOD" })).toHaveCount(1);
  await expect(page.locator("main tr.ant-table-row").filter({ hasText: "TBAD" })).toHaveCount(0);
});

test("Lọc theo trạng thái, tìm theo cấu hình, mã đơn, tên khách", async ({ page, t }) => {
  void t;
  await page.goto("/cancelled-products");
  const rows = page.locator("main tr.ant-table-row");
  await expect(rows.first()).toBeVisible();
  const total = await rows.count();
  const first = await rows.first().innerText();
  const code = first.match(/SC\d{9}/)?.[0];
  expect(code).toBeTruthy();
  const search = page.getByLabel("Tìm sản phẩm hủy đơn");
  await search.fill(code!.toLowerCase());
  await expect(rows).not.toHaveCount(0);
  for (const text of await rows.allInnerTexts()) expect(text).toContain(code);
  await search.fill("khong co dong nao");
  await expect(rows).toHaveCount(0);
  await search.fill("");
  await expect(rows).toHaveCount(total);
  // Trạng thái: Chờ xử lý có đủ 2 nút xử lý trên mọi dòng
  await page.getByRole("radiogroup", { name: "Trạng thái" }).locator(".ant-segmented-item").filter({ hasText: "Chờ xử lý" }).click();
  for (const text of await rows.allInnerTexts()) expect(text).toContain("Tạo sản phẩm trưng bày");
});
