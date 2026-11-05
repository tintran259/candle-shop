// Kiểm tra lại Doanh thu, Giá trị đơn TB, Lãi gộp trên một bộ đơn đủ các trường hợp, số tính tay (docs/pages/dashboard.md#quy-tắc-doanh-thu)
import dayjs from "dayjs";
import { expect, test } from "./support/harness.mjs";
import { dashboardStats } from "@/lib/dashboard/stats";
import { orderCost } from "@/lib/costs";
import type { Order } from "@/lib/orders/types";

const ago = (n: number) => dayjs().subtract(n, "day").hour(10).minute(0).second(0).millisecond(0).toISOString();
const pay = (id: string, amount: number, n: number, kind?: "refund") => ({ id, provider: "cod", amount, status: "success", createdAt: ago(n), ...(kind && { kind }) });
const make = (id: string, goods: number, placed: number, over: Record<string, unknown>) => ({
  id,
  code: `SC-${id.toUpperCase()}`,
  status: "completed",
  customer: { name: `Khách ${id}`, email: "", phone: `09000000${id.charCodeAt(0)}` },
  shippingAddress: "1 A",
  shippingMethod: "standard",
  shippingName: "Tiêu chuẩn (3 ngày)",
  shippingDays: 3,
  depositPercent: 50,
  // Không có productId: giá vốn chỉ lấy từ materialCost đã chốt
  items: [{ id: `i-${id}`, name: `Nến ${id}`, price: goods, quantity: 1 }],
  subtotal: goods,
  discount: 0,
  shippingFee: 0,
  total: goods,
  paymentPlan: "full",
  paymentMethod: "cod",
  payments: [],
  readyDate: dayjs().format("YYYY-MM-DD"),
  history: [{ at: ago(placed), status: "pending", by: "x" }],
  createdAt: ago(placed),
  updatedAt: ago(placed),
  ...over,
});
const closed = (status: string, n: number) => ({ at: ago(n), status, by: "x" });

// Kỳ 30 ngày. Số tính tay (nghìn đồng):
const orders = [
  // A. Hoàn tất, trả đủ 530 (500 hàng + 30 phí giao), trả đơn vị vận chuyển 30, nguyên liệu 150
  //    Doanh thu 500 · Lãi 500 − 150 + (30 − 30) = 350 · TB 500
  make("a", 500_000, 6, { shippingFee: 30_000, total: 530_000, shippingCost: 30_000, materialCost: 150_000, payments: [pay("a1", 530_000, 5)], history: [closed("pending", 6), closed("completed", 3)] }),
  // B. Hoàn tất, cọc 150 rồi thu nốt 150, miễn phí giao nhưng shop trả bên vận chuyển 25, nguyên liệu 100
  //    Doanh thu 300 · Lãi 300 − 100 − 25 = 175 · TB 300
  make("b", 300_000, 10, { paymentPlan: "deposit", shippingCost: 25_000, materialCost: 100_000, payments: [pay("b1", 150_000, 10), pay("b2", 150_000, 6)], history: [closed("pending", 10), closed("completed", 6)] }),
  // C. Ví dụ 1: khách hủy (lỗi do khách), giữ cọc 150, chưa làm
  //    Doanh thu 150 · Lãi 150
  make("c", 300_000, 8, { status: "cancelled", paymentPlan: "deposit", cancelFault: "customer", payments: [pay("c1", 150_000, 8)], history: [closed("pending", 8), closed("cancelled", 7)] }),
  // D. Ví dụ 2: giao 2 lượt (mỗi lượt trả 30), khách không nhận, hủy giữ cọc 150; nến đã làm (80) không hoàn Kho
  //    Doanh thu 150 · Lãi 150 − 80 − 60 = 10
  make("d", 300_000, 12, {
    status: "cancelled",
    paymentPlan: "deposit",
    cancelFault: "customer",
    cancelOutcome: "consumed",
    shippingFee: 30_000,
    resendFee: 30_000,
    total: 330_000,
    shippingCost: 60_000,
    materialCost: 80_000,
    payments: [pay("d1", 150_000, 12)],
    history: [closed("pending", 12), closed("cancelled", 2)],
  }),
  // E. Hủy lỗi do shop, đã trả 400 rồi hoàn đủ 400 → Doanh thu 0 · Lãi 0
  make("e", 400_000, 9, { status: "cancelled", cancelFault: "shop", payments: [pay("e1", 400_000, 9)], refund: { amount: 400_000, images: [], at: ago(4), by: "x" }, history: [closed("pending", 9), closed("cancelled", 5)] }),
  // F. Đang giao, đã cọc 300: chưa chốt nên không vào Doanh thu, Lãi, TB — ghi "Chưa tính 300.000 ₫ đã thu của 1 đơn" 
  make("f", 600_000, 2, { status: "shipping", paymentPlan: "deposit", shippingCost: 30_000, materialCost: 200_000, payments: [pay("f1", 300_000, 2)] }),
  // G. Hoàn tất ngoài kỳ (đặt 45 ngày, xong 40 ngày trước): không tính gì
  make("g", 900_000, 45, { materialCost: 100_000, payments: [pay("g1", 900_000, 45)], history: [closed("pending", 45), closed("completed", 40)] }),
  // H. Hoàn tất, khiếu nại hoàn 100: Doanh thu 400 − 100 = 300 · Lãi (400 − 100) − 120 = 180 · TB 300
  make("h", 400_000, 15, {
    materialCost: 120_000,
    complaints: [{ id: "k", reason: "Vỡ hũ", images: [], resolution: "refund", refundAmount: 100_000, at: ago(1), by: "x" }],
    payments: [pay("h1", 400_000, 15), pay("h2", -100_000, 1, "refund")],
    history: [closed("pending", 15), closed("completed", 14)],
  }),
];
// Doanh thu (chỉ đơn đã chốt) 500 + 300 + 150 + 150 + 0 + 300 = 1.400
// Giá trị đơn TB: (500 + 300 + 300) / 3 = 366.667
// Lãi gộp: 350 + 175 + 150 + 10 + 0 + 180 = 865 trên 6 đơn đã chốt; phí vận chuyển shop chịu 25 + 60 = 85; tỉ lệ 865 / 1.400 = 62%

test("Số liệu tính đúng theo quy tắc", () => {
  const source = { map: new Map(), products: [] } as unknown as Parameters<typeof orderCost>[1];
  const s = dashboardStats(orders as unknown as Order[], [], () => "", 30, dayjs(), (o) => orderCost(o, source).cost);
  expect(s.kpis.revenue.value).toBe(1_400_000);
  expect(s.kpis.revenue.pending).toEqual({ amount: 300_000, count: 1 });
  expect(s.daily.reduce((n, d) => n + d.revenue, 0)).toBe(1_400_000);
  expect(s.kpis.orders.value).toBe(4);
  expect(Math.round(s.kpis.average.value)).toBe(366_667);
  expect(s.kpis.average.completed).toBe(3);
  expect(s.kpis.profit).toMatchObject({ value: 865_000, closed: 6, shipping: -85_000 });
  expect(Math.round(s.kpis.profit.rate! * 100)).toBe(62);
});

test("Thẻ trên Dashboard hiện đúng số", async ({ page, t }) => {
  void t;
  await page.goto("/");
  await page.evaluate((list) => localStorage.setItem("bo-orders-v4", JSON.stringify(list)), orders);
  await page.goto("/?days=30");
  const card = (label: string) => page.locator("main .ant-card").filter({ has: page.getByText(label, { exact: true }) }).first();
  const text = async (label: string) => (await card(label).innerText()).replace(/\s+/g, " ");
  await expect(card("Doanh thu")).toContainText("Tiền hàng của đơn hoàn tất và tiền giữ lại của đơn hủy, không gồm phí vận chuyển");
  expect(await text("Doanh thu")).toContain("1,4 tr");
  expect(await text("Doanh thu")).toContain("Chưa tính 300.000 ₫ đã thu của 1 đơn chưa hoàn tất");
  expect(await text("Đơn hàng")).toMatch(/Đơn hàng 4 /);
  expect(await text("Giá trị đơn TB")).toContain("366.667 ₫");
  expect(await text("Giá trị đơn TB")).toContain("Tiền hàng TB của 3 đơn hoàn tất, không gồm phí vận chuyển");
  expect(await text("Lãi gộp")).toContain("865.000 ₫");
  expect(await text("Lãi gộp")).toContain("Từ 6 đơn đã chốt (hoàn tất, đã hủy) · tỉ lệ lãi 62% · Đã trừ 85.000 ₫ phí vận chuyển shop chịu");
  await t.shot("dashboard-money", true);
});
