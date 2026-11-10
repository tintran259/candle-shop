// Đơn hàng dùng chung cho các test BE thật: tạo đơn trên giao diện, đọc đơn / tồn kho từ BE
import type { Page } from "@playwright/test";
import { drawer, expect, stockOf, type Api } from "./fixtures";

export type Order = { id: string; code: string; status: string; customer: { phone: string }; total: number; payments: { amount: number; status: string }[]; shipment?: { trackingCode?: string } };

// Moon Morning (850.000 ₫): 1 hũ thủy tinh trong 150, 130 g sáp dừa, 10 ml White Tea, 1 bấc cotton
export const RECIPE = { "jar-clear-glass-150": 1, "wax-coconut": 130, "oil-white-tea": 10, "wick-cotton": 1 };
export const stocks = async (api: Api) => Object.fromEntries(await Promise.all(Object.keys(RECIPE).map(async (id) => [id, await stockOf(api, id)] as const)));
const digits = (s: string) => s.replace(/\D/g, "");
export const findOrder = async (api: Api, phone: string) => (await api.get<Order[]>("/admin/orders")).find((o) => digits(o.customer.phone) === digits(phone));

// Tạo đơn 1 Moon Morning trên giao diện, cọc 50% đã nhận tiền → đơn Đã thanh toán trên BE
export async function createOrder(page: Page, api: Api, phone: string) {
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
