// Doanh thu và lãi: phí vận chuyển không phải doanh thu, phí trả đơn vị vận chuyển trừ vào lãi, đơn hủy tính tiền giữ lại (docs/pages/dashboard.md#quy-tắc-doanh-thu)
import { expect, test } from "@playwright/test";
import dayjs from "dayjs";
import { dashboardStats } from "@/lib/dashboard/stats";
import { orderMoney, orderProfit } from "@/lib/orders/money";
import type { Order } from "@/lib/orders/types";

const today = dayjs("2026-11-03T15:00:00");
const at = (daysAgo: number) => today.subtract(daysAgo, "day").hour(10).toISOString();
const pay = (amount: number, daysAgo = 2, kind?: "refund") => ({ id: `p${amount}${daysAgo}`, provider: "cod", status: "success", amount, createdAt: at(daysAgo), kind });
// Đơn 300.000 ₫ tiền hàng, cọc 150.000 ₫
const order = (over: Partial<Order> = {}) =>
  ({
    id: "o",
    code: "SC1",
    status: "shipping",
    createdAt: at(2),
    updatedAt: at(2),
    customer: { name: "", phone: "0900" },
    items: [{ id: "i", name: "Moon", price: 300_000, quantity: 1 }],
    subtotal: 300_000,
    discount: 0,
    shippingFee: 0,
    total: 300_000,
    paymentPlan: "deposit",
    depositPercent: 50,
    payments: [pay(150_000)],
    history: [],
    ...over,
  }) as unknown as Order;

test("Khách hủy (lỗi do khách), shop giữ cọc: doanh thu 150.000, lãi tính trên tiền giữ lại", () => {
  const o = order({ status: "cancelled", cancelFault: "customer" });
  expect(orderMoney(o).goods).toBe(150_000);
  // Chưa làm: không mất nguyên liệu
  expect(orderProfit(o, 80_000)).toMatchObject({ value: 150_000, material: 0, profit: 150_000 });
  // Đã làm, không hoàn Kho: mất nguyên liệu
  expect(orderProfit({ ...o, materialCost: 80_000, cancelOutcome: "consumed" }, 80_000).profit).toBe(70_000);
  // Đã làm nhưng hoàn nguyên liệu về Kho: không mất
  expect(orderProfit({ ...o, materialCost: 80_000, cancelOutcome: "returned" }, 80_000).profit).toBe(150_000);
});

test("Giao 2 lượt, mỗi lượt trả đơn vị vận chuyển 30.000, khách không nhận rồi hủy: doanh thu 150.000, lãi trừ 60.000", () => {
  // Lượt 2 là gửi lại: phí gửi lại 30.000 cộng vào đơn nhưng khách không trả
  const o = order({ status: "cancelled", cancelFault: "customer", shippingFee: 30_000, resendFee: 30_000, total: 330_000, shippingCost: 60_000, materialCost: 80_000 });
  expect(orderMoney(o)).toMatchObject({ goods: 150_000, shipping: 0 });
  expect(orderProfit(o, 80_000)).toMatchObject({ value: 150_000, carrier: 60_000, shipping: -60_000, material: 80_000, profit: 150_000 - 60_000 - 80_000 });
});

test("Khách trả phí gửi lại và nhận hàng: 60.000 khách trả bù đúng phần trả đơn vị vận chuyển, doanh thu chỉ tiền hàng", () => {
  const o = order({ status: "completed", shippingFee: 60_000, resendFee: 30_000, total: 360_000, shippingCost: 60_000, payments: [pay(150_000), pay(210_000, 0)] as Order["payments"] });
  expect(orderMoney(o)).toMatchObject({ goods: 300_000, shipping: 60_000 });
  expect(orderMoney(o).entries.map((e) => e.amount)).toEqual([150_000, 150_000]);
  expect(orderProfit(o, 100_000)).toMatchObject({ value: 300_000, shipping: 0, profit: 200_000 });
});

test("Miễn phí giao: phí trả đơn vị vận chuyển là chi phí của shop; chưa giao thì chưa trừ", () => {
  expect(orderProfit(order({ status: "completed", shippingCost: 25_000 }), 100_000).profit).toBe(175_000);
  expect(orderProfit(order({ status: "ready" }), 100_000).profit).toBe(200_000);
  // Phí giao khách trả nhưng chưa giao: chưa tính vào lãi
  expect(orderProfit(order({ status: "ready", shippingFee: 30_000, total: 330_000 }), 100_000).profit).toBe(200_000);
});

test("Thu dư sau khi sửa đơn rồi hoàn lại: không tính vào doanh thu; khiếu nại hoàn tiền trừ vào tiền hàng", () => {
  const edited = order({ status: "completed", subtotal: 200_000, total: 230_000, shippingFee: 30_000, payments: [pay(330_000), pay(-100_000, 1, "refund")] as Order["payments"] });
  expect(orderMoney(edited)).toMatchObject({ goods: 200_000, shipping: 30_000 });
  const complaint = order({ status: "completed", payments: [pay(300_000), pay(-50_000, 1, "refund")] as Order["payments"] });
  expect(orderMoney(complaint).goods).toBe(250_000);
});

test("Hủy sau khi đã trả đủ cả phí giao: hoàn trừ phí giao trước rồi tới tiền hàng", () => {
  // Trả 330.000 (gồm 30.000 phí giao), hủy lỗi do khách, hoàn 165.000
  const o = order({ status: "cancelled", shippingFee: 30_000, total: 330_000, payments: [pay(330_000)] as Order["payments"], refund: { amount: 165_000, images: [], at: at(1), by: "x" } });
  expect(orderMoney(o)).toMatchObject({ goods: 165_000, shipping: 0 });
});

test("Cọc 150.000 rồi shop hủy và hoàn đủ 150.000: doanh thu 0, lãi 0 — không ảnh hưởng lãi gộp", () => {
  // Lúc còn đang làm: chưa chốt nên không vào doanh thu, lãi gộp
  const open = order({ status: "producing" });
  expect(dashboardStats([open], [], () => "", 7, today, () => 100_000).kpis.profit.value).toBe(0);
  // Hủy lỗi do shop, hoàn đủ 150.000, chưa làm hoặc đã hoàn nguyên liệu về Kho
  const refunded = order({ status: "cancelled", cancelFault: "shop", refund: { amount: 150_000, images: [], at: at(1), by: "x" } });
  expect(orderMoney(refunded).goods).toBe(0);
  expect(orderProfit(refunded, 100_000).profit).toBe(0);
  expect(orderProfit({ ...refunded, materialCost: 100_000, cancelOutcome: "returned" }, 100_000).profit).toBe(0);
  const s = dashboardStats([refunded], [], () => "", 7, today, () => 100_000);
  expect(s.kpis.revenue.value).toBe(0);
  expect(s.kpis.profit.value).toBe(0);
});

test("Dashboard: doanh thu không gồm phí vận chuyển, lãi gồm đơn hủy và trừ phí shop chịu", () => {
  const done = order({ id: "a", status: "completed", shippingFee: 30_000, total: 330_000, shippingCost: 30_000, payments: [pay(330_000)] as Order["payments"] });
  const cancelled = order({ id: "b", status: "cancelled", cancelFault: "customer", shippingCost: 60_000 });
  const s = dashboardStats([done, cancelled], [], () => "", 7, today, () => 100_000);
  expect(s.kpis.revenue.value).toBe(450_000);
  // (300.000 − 100.000) + (150.000 − 60.000), đơn hủy chưa làm nên không mất nguyên liệu
  expect(s.kpis.profit.value).toBe(290_000);
  expect(s.kpis.profit.shipping).toBe(-60_000);
  expect(s.daily.reduce((n, d) => n + d.revenue, 0)).toBe(450_000);
});

test("Bảng ví dụ đã chốt (docs/pages/dashboard.md#quy-tắc-lãi-gộp)", () => {
  const cancel = (fault: "customer" | "shop", trips: number) =>
    order({
      status: "cancelled",
      cancelFault: fault,
      cancelOutcome: "stocked",
      materialCost: 100_000,
      shippingFee: 30_000 * (trips - 1),
      resendFee: 30_000 * (trips - 1),
      total: 300_000 + 30_000 * (trips - 1),
      shippingCost: 30_000 * trips,
      ...(fault === "shop" && { refund: { amount: 150_000, images: [], at: at(1), by: "x" } }),
    });
  // Khách không nhận, mất cọc: 1 lượt → 120.000; 3 lượt → 60.000
  expect([orderMoney(cancel("customer", 1)).goods, orderProfit(cancel("customer", 1), 100_000).profit]).toEqual([150_000, 120_000]);
  expect([orderMoney(cancel("customer", 3)).goods, orderProfit(cancel("customer", 3), 100_000).profit]).toEqual([150_000, 60_000]);
  // Lỗi do shop, hoàn cọc: doanh thu 0, lãi −30.000
  expect([orderMoney(cancel("shop", 1)).goods, orderProfit(cancel("shop", 1), 100_000).profit]).toEqual([0, -30_000]);
  // Hoàn tất: khách trả phí giao 30.000 → 200.000; miễn phí giao, shop trả 30.000 → 170.000
  expect(orderProfit(order({ status: "completed", shippingFee: 30_000, total: 330_000, shippingCost: 30_000 }), 100_000).profit).toBe(200_000);
  expect(orderProfit(order({ status: "completed", shippingCost: 30_000 }), 100_000).profit).toBe(170_000);
});

test("Cọc tính trên tiền hàng, không gồm phí vận chuyển", async () => {
  const { orderTotals } = await import("@/lib/orders/create");
  const { refundFor } = await import("@/lib/orders/labels");
  // 300.000 tiền hàng + 30.000 phí giao, cọc 50% = 150.000 (không phải 165.000)
  expect(orderTotals([{ kind: "product", productId: "p", price: 300_000, quantity: 1 }], 30_000, "deposit", 0, 50)).toMatchObject({ total: 330_000, dueNow: 150_000 });
  // Có giảm giá 50.000: cọc 50% của 250.000
  expect(orderTotals([{ kind: "product", productId: "p", price: 300_000, quantity: 1 }], 30_000, "deposit", 50_000, 50).dueNow).toBe(125_000);
  // Khách hủy (lỗi do khách) sau khi trả đủ 330.000: giữ 150.000 cọc, hoàn 180.000
  const paidFull = order({ shippingFee: 30_000, total: 330_000, payments: [pay(330_000)] as Order["payments"] });
  expect(refundFor(paidFull, "customer")).toBe(180_000);
  // Đã gửi lại (phí gửi lại cộng vào phí giao): cọc vẫn 150.000
  expect(refundFor(order({ shippingFee: 60_000, resendFee: 30_000, total: 360_000, payments: [pay(150_000)] as Order["payments"] }), "customer")).toBe(0);
});
