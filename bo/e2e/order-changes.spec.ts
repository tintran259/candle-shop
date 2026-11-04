// Sửa đơn sau khi tạo, hoàn phần thu dư, khiếu nại sau khi giao (docs/pages/orders.md, docs/workflow.md mục 7)
import { expect, test } from "./support/harness.mjs";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const now = new Date().toISOString();
const inDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

const seed = (id: string, over: Record<string, unknown>) => ({
  id,
  code: "T" + id.toUpperCase().replace(/-/g, ""),
  status: "paid",
  customer: { name: "Khách " + id, email: "", phone: "0900000123" },
  shippingAddress: "1 Lê Lợi",
  shippingMethod: "standard",
  shippingName: "Tiêu chuẩn (3 ngày)",
  shippingDays: 3,
  depositPercent: 50,
  items: [{ id: "i1", productId: "moon-morning", name: "Moon Morning", image: "/products/product-moon.jpg", price: 850_000, quantity: 2 }],
  subtotal: 1_700_000,
  discount: 0,
  shippingFee: 0,
  total: 1_700_000,
  paymentPlan: "full",
  paymentMethod: "cod",
  payments: [{ id: "p-" + id, provider: "cod", amount: 1_700_000, status: "success", createdAt: now }],
  readyDate: inDays(4),
  history: [{ at: now, status: "paid", by: "x" }],
  createdAt: now,
  updatedAt: now,
  ...over,
});
const orders = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("bo-orders-v3") ?? "[]"));
const find = async (page, id: string) => (await orders(page)).find((o) => o.id === id);
const drawer = (page) => page.locator(".ant-drawer-open").last();
const modal = (page) => page.locator(".ant-modal-wrap:not([style*='none']) .ant-modal");

test.beforeEach(async ({ page, t }) => {
  void t;
  await page.goto("/");
  await page.evaluate((list) => localStorage.setItem("bo-orders-v3", JSON.stringify(list)), [
    seed("paid-full", {}),
    seed("making", { status: "producing", history: [{ at: now, status: "producing", by: "x" }] }),
    seed("done", { status: "completed", readyDate: inDays(-5), history: [{ at: now, status: "completed", by: "x" }] }),
  ]);
});

test("Sửa đơn Đã thanh toán: bớt hàng thì báo thu dư, ghi nhận hoàn phần dư kèm chứng từ", async ({ page, t }) => {
  await page.goto("/orders?order=paid-full");
  await page.getByRole("button", { name: "Sửa đơn" }).click();
  await expect(page).toHaveURL(/edit=paid-full/);
  const d = drawer(page);
  await expect(d).toContainText("Sửa đơn TPAIDFULL");
  // Không có ô Hình thức / Đã nhận tiền khi sửa
  await expect(d.getByRole("switch", { name: "Đã nhận tiền" })).toHaveCount(0);
  await d.getByLabel("Số lượng").fill("1");
  await d.locator("#address").fill("9 Pasteur, Q.3");
  await expect(d.getByRole("complementary", { name: "Tóm tắt đơn" })).toContainText("Thu dư, cần hoàn");
  await t.shot("edit-drawer");
  await d.getByRole("button", { name: /^Lưu thay đổi/ }).click();
  await expect(page.getByText(/Đã lưu \d+ thay đổi của đơn TPAIDFULL/)).toBeVisible();
  await expect(page).not.toHaveURL(/edit=/);

  const o = await find(page, "paid-full");
  expect(o).toMatchObject({ total: 850_000, shippingAddress: "9 Pasteur, Q.3" });
  expect(o.items[0].quantity).toBe(1);
  expect(o.history.at(-1)).toMatchObject({ kind: "edit" });
  expect(o.history.at(-1).note).toContain("Sản phẩm: Moon Morning ×1");

  // Chi tiết đơn: báo thu dư, ghi nhận hoàn phần dư
  const view = page.locator(".ant-drawer-open").first();
  await expect(view).toContainText("Thu dư 850.000");
  await view.getByRole("button", { name: "Ghi nhận đã hoàn phần dư" }).click();
  await expect(modal(page).locator("input").first()).toHaveValue(/850\.000/);
  await modal(page).locator("input[type=file]").setInputFiles({ name: "ct.png", mimeType: "image/png", buffer: PNG });
  await modal(page).getByRole("button", { name: "Ghi nhận" }).click();
  await expect(view).not.toContainText("Thu dư 850.000");
  await expect(view).toContainText("Hoàn tiền cho khách");
  const refunded = await find(page, "paid-full");
  expect(refunded.payments.at(-1)).toMatchObject({ amount: -850_000, kind: "refund" });
  await t.shot("edit-refunded");
});

test("Sửa đơn đã Bắt đầu làm: khóa sản phẩm, vẫn sửa được liên hệ", async ({ page }) => {
  await page.goto("/orders?order=making&edit=making");
  const d = drawer(page);
  await expect(d).toContainText("Đơn đã bắt đầu làm — không đổi sản phẩm được");
  await expect(d.getByRole("button", { name: "Nến có sẵn" })).toHaveCount(0);
  await d.locator("#phone").fill("0911222333");
  await d.getByRole("button", { name: /^Lưu thay đổi/ }).click();
  await expect(page.getByText("Đã lưu 1 thay đổi của đơn TMAKING")).toBeVisible();
  const o = await find(page, "making");
  expect(o.customer.phone).toBe("0911222333");
  expect(o.items[0].quantity).toBe(2);
  expect(o.total).toBe(1_700_000);
});

test("Không đổi gì thì không ghi lịch sử; đơn Hoàn tất không có nút Sửa đơn", async ({ page }) => {
  await page.goto("/orders?order=paid-full&edit=paid-full");
  await drawer(page).getByRole("button", { name: /^Lưu thay đổi/ }).click();
  await expect(page.getByText("Không có thay đổi nào.")).toBeVisible();
  expect((await find(page, "paid-full")).history).toHaveLength(1);
  await page.goto("/orders?order=done");
  await expect(page.locator(".ant-drawer-open")).toContainText("Hoàn tất");
  await expect(page.getByRole("button", { name: "Sửa đơn" })).toHaveCount(0);
});

test("Khiếu nại gửi bù: tạo đơn 0 ₫ liên kết đơn gốc, đi qua các bước làm", async ({ page, t }) => {
  await page.goto("/orders?order=done");
  await page.getByRole("button", { name: "Khiếu nại" }).click();
  const m = modal(page);
  await m.locator("textarea").first().fill("Hũ vỡ khi nhận");
  await m.getByLabel("Số cây gửi bù Moon Morning").fill("1");
  await t.shot("complaint-modal");
  await m.getByRole("button", { name: "Ghi nhận" }).click();
  await expect(page.getByText(/Đã ghi nhận khiếu nại, tạo đơn gửi bù SC\d{9}/)).toBeVisible();

  const list = await orders(page);
  const replacement = list.find((o) => o.replacementFor?.id === "done");
  expect(replacement).toMatchObject({ status: "paid", total: 0, payments: [] });
  expect(replacement.items).toEqual([expect.objectContaining({ name: "Moon Morning", quantity: 1, price: 0 })]);
  const done = list.find((o) => o.id === "done");
  expect(done.complaints[0]).toMatchObject({ reason: "Hũ vỡ khi nhận", resolution: "resend", replacementCode: replacement.code });

  // Đơn gốc hiện khiếu nại, link sang đơn gửi bù
  const view = page.locator(".ant-drawer-open");
  await expect(view).toContainText("Khiếu nại (1)");
  await view.getByRole("link", { name: replacement.code }).click();
  await expect(page).toHaveURL(new RegExp(`order=${replacement.id}`));
  await expect(view).toContainText("Đơn gửi bù cho khiếu nại của đơn");
  await expect(view).toContainText("Bắt đầu làm");
  // Bảng đơn có nhãn Gửi bù và Khiếu nại
  await page.goto("/orders");
  await expect(page.locator("main tr.ant-table-row").filter({ hasText: replacement.code })).toContainText("Gửi bù");
  await expect(page.locator("main tr.ant-table-row").filter({ hasText: "TDONE" })).toContainText("Khiếu nại");
});

test("Khiếu nại hoàn một phần: bắt buộc chứng từ, trừ vào tiền shop giữ", async ({ page }) => {
  await page.goto("/orders?order=done");
  await page.getByRole("button", { name: "Khiếu nại" }).click();
  const m = modal(page);
  await m.locator("textarea").first().fill("Nến cháy lệch tâm");
  await m.locator(".ant-radio-button-wrapper").filter({ hasText: "Hoàn một phần tiền" }).click();
  await m.getByLabel("Số tiền hoàn").fill("200000");
  await m.getByRole("button", { name: "Ghi nhận" }).click();
  await expect(m.getByText("Thêm ít nhất một ảnh chứng từ.")).toBeVisible();
  await m.locator(".ant-form-item").filter({ hasText: "Ảnh chứng từ hoàn tiền" }).locator("input[type=file]").setInputFiles({ name: "ct.png", mimeType: "image/png", buffer: PNG });
  await m.getByRole("button", { name: "Ghi nhận" }).click();
  await expect(page.getByText(/Đã ghi nhận khiếu nại, hoàn 200\.000/)).toBeVisible();
  const o = await find(page, "done");
  expect(o.payments.at(-1)).toMatchObject({ amount: -200_000, kind: "refund" });
  expect(o.history.at(-1)).toMatchObject({ kind: "complaint" });
  await expect(page.locator(".ant-drawer-open")).toContainText("Hoàn tiền cho khách");
});
