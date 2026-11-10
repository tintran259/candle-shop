// Luồng đơn hàng trên BE thật: thao tác trên giao diện BO, đọc lại BE để đối chiếu (trạng thái, tiền, Kho)
import type { Page } from "@playwright/test";
import { drawer, expect, modal, stockOf, test, type Api } from "./support/fixtures";

type Order = { id: string; code: string; status: string; customer: { phone: string }; total: number; payments: { amount: number; status: string }[]; shipment?: { trackingCode?: string } };

// Moon Morning (850.000 ₫): 1 hũ thủy tinh trong 150, 130 g sáp dừa, 10 ml White Tea, 1 bấc cotton
const RECIPE = { "jar-clear-glass-150": 1, "wax-coconut": 130, "oil-white-tea": 10, "wick-cotton": 1 };
const stocks = async (api: Api) => Object.fromEntries(await Promise.all(Object.keys(RECIPE).map(async (id) => [id, await stockOf(api, id)] as const)));
const digits = (s: string) => s.replace(/\D/g, "");
const findOrder = async (api: Api, phone: string) => (await api.get<Order[]>("/admin/orders")).find((o) => digits(o.customer.phone) === digits(phone));

// Tạo đơn 1 Moon Morning trên giao diện, cọc 50% đã nhận tiền → đơn Đã thanh toán trên BE
async function createOrder(page: Page, api: Api, phone: string) {
  await page.goto("/orders");
  await page.getByRole("button", { name: /Tạo đơn hàng|Tiếp tục đơn nháp/ }).click();
  const o = drawer(page);
  await o.locator("#name").fill("Khách BE");
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
  }).toPass({ timeout: 20_000 });
  await o.getByLabel("Đã nhận tiền").click();
  await o
    .locator(".ant-drawer-footer")
    .getByRole("button", { name: /^Tạo đơn/ })
    .click();
  await expect.poll(async () => (await findOrder(api, phone))?.status, { timeout: 20_000 }).toBe("paid");
  return (await findOrder(api, phone))!;
}

// Bấm nút bước kế tiếp trong drawer đơn (tên nút có kèm tên icon phía trước) rồi chờ BE ghi nhận trạng thái mới
async function advance(page: Page, api: Api, order: Order, button: string, status: string) {
  await drawer(page)
    .getByRole("button", { name: new RegExp(`${button}$`) })
    .click();
  await expect.poll(async () => (await api.get<Order>(`/admin/orders/${order.id}`)).status, { timeout: 20_000 }).toBe(status);
}

test("Tạo đơn → Bắt đầu làm (trừ Kho) → Làm xong → Giao → Khách nhận (thu nốt) → Hoàn tất", async ({ page, api }) => {
  const before = await stocks(api);
  const order = await createOrder(page, api, "0909 111 222");
  expect(order.total).toBe(850_000);
  expect(order.payments).toEqual([expect.objectContaining({ amount: 425_000, status: "success" })]);
  // Đã thanh toán mới giữ nguyên liệu, chưa trừ Kho
  expect(await stocks(api)).toEqual(before);

  await page.goto(`/orders?order=${order.id}`);
  await expect(drawer(page)).toContainText(order.code);
  await advance(page, api, order, "Bắt đầu làm", "producing");
  const after = await stocks(api);
  for (const [id, qty] of Object.entries(RECIPE)) expect(after[id], id).toBe(before[id] - qty);

  await advance(page, api, order, "Đã làm xong", "ready");

  await drawer(page)
    .getByRole("button", { name: /Giao cho vận chuyển$/ })
    .click();
  const m = modal(page);
  await m.getByLabel("Mã vận đơn").fill("ghn be01");
  await m.getByRole("button", { name: "Giao cho vận chuyển" }).click();
  await expect(m).toBeHidden();
  await expect.poll(async () => (await api.get<Order>(`/admin/orders/${order.id}`)).status).toBe("shipping");
  expect((await api.get<Order>(`/admin/orders/${order.id}`)).shipment?.trackingCode).toBe("GHNBE01");

  // Còn 425.000 ₫: hỏi đã thu đủ chưa
  await drawer(page)
    .getByRole("button", { name: /Khách đã nhận$/ })
    .click();
  await page.getByRole("button", { name: "Đã thu đủ, hoàn tất" }).click();
  await expect.poll(async () => (await api.get<Order>(`/admin/orders/${order.id}`)).status, { timeout: 20_000 }).toBe("completed");
  const done = await api.get<Order>(`/admin/orders/${order.id}`);
  expect(done.payments.filter((p) => p.status === "success").reduce((s, p) => s + p.amount, 0)).toBe(850_000);
  await expect(drawer(page)).toContainText("Hoàn tất");

  // Tải lại trang: giao diện đọc đúng dữ liệu BE
  await page.reload();
  await expect(drawer(page)).toContainText("Hoàn tất");
  await expect(drawer(page)).toContainText("GHNBE01");
});

test("Hủy đơn đang làm, chưa làm: BE hoàn nguyên liệu về Kho", async ({ page, api }) => {
  const before = await stocks(api);
  const order = await createOrder(page, api, "0909 333 444");
  await page.goto(`/orders?order=${order.id}`);
  await advance(page, api, order, "Bắt đầu làm", "producing");
  expect((await stocks(api))["wax-coconut"]).toBe(before["wax-coconut"] - 130);

  await drawer(page)
    .getByRole("button", { name: /Hủy đơn$/ })
    .click();
  const m = modal(page);
  await m.locator("textarea").first().fill("Khách đổi ý");
  await m.locator(".ant-radio-wrapper", { hasText: "Lỗi do shop" }).click();
  await m.locator(".ant-radio-wrapper", { hasText: "Chưa làm" }).click();
  await m.locator(".ant-modal-footer").getByRole("button", { name: "Hủy đơn" }).click();
  await expect.poll(async () => (await api.get<Order>(`/admin/orders/${order.id}`)).status, { timeout: 20_000 }).toBe("cancelled");
  expect(await stocks(api)).toEqual(before);
});
