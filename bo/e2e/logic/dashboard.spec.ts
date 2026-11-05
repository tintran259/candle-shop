// Dashboard: doanh thu theo tiền thực nhận, so với kỳ trước, giá trị đơn TB, khách mới, cột âm, theo danh mục (docs/pages/dashboard.md)
import { expect, test } from "@playwright/test";
import dayjs from "dayjs";
import { attention, dashboardStats } from "@/lib/dashboard/stats";
import type { Order } from "@/lib/orders/types";
import type { Product } from "@/lib/products/types";

const today = dayjs("2026-11-03T15:00:00");
const at = (daysAgo: number) => today.subtract(daysAgo, "day").hour(10).toISOString();
let n = 0;
const order = (phone: string, daysAgo: number, over: Partial<Order> = {}) =>
  ({
    id: `o${++n}`,
    status: "completed",
    createdAt: at(daysAgo),
    updatedAt: at(daysAgo),
    customer: { name: "", phone },
    payments: [{ status: "success", amount: 500_000, createdAt: at(daysAgo) }],
    history: [],
    items: [{ productId: "moon", name: "Moon", quantity: 1, price: 500_000 }],
    total: 500_000,
    ...over,
  }) as unknown as Order;
const products = [{ id: "moon", name: "Moon", categoryId: "parfum", images: [] }] as unknown as Product[];
const label = (id?: string) => ({ parfum: "Nước hoa đổi tên" })[id ?? ""] ?? "Chưa phân loại";
const stats = (orders: Order[], days = 7) => dashboardStats(orders, products, label, days, today);

test("Doanh thu ghi nhận vào ngày hoàn tất, không theo ngày đặt hay ngày thu cọc", () => {
  // Đặt và cọc 10 ngày trước (ngoài kỳ 7 ngày), thu nốt và hoàn tất hôm nay: cả 500.000 tính hôm nay
  const o = order("1", 10, {
    updatedAt: at(0),
    payments: [
      { status: "success", amount: 200_000, createdAt: at(10) },
      { status: "success", amount: 300_000, createdAt: at(0) },
    ] as Order["payments"],
  });
  const s = stats([o]);
  expect(s.kpis.revenue.value).toBe(500_000);
  expect(s.daily.at(-1)?.revenue).toBe(500_000);
  expect(s.kpis.orders.value).toBe(0);
});

test("Đơn chưa xong (đã cọc, đang giao, giao lỗi, đã hoàn về Kho) chưa tính doanh thu, ghi riêng số đã thu", () => {
  const open = (["paid", "shipping", "delivery_failed", "returned"] as const).map((status, i) => order(`o${i}`, 2, { status, payments: [{ status: "success", amount: 150_000, createdAt: at(2) }] as Order["payments"] }));
  const s = stats(open);
  expect(s.kpis.revenue.value).toBe(0);
  expect(s.kpis.revenue.pending).toEqual({ amount: 600_000, count: 4 });
});

test("Đơn hủy: chỉ tính phần shop giữ lại, vào ngày hủy", () => {
  const cancelled = order("2", 3, { status: "cancelled", refund: { amount: 400_000, at: at(1) } as Order["refund"] });
  const s = stats([cancelled]);
  expect(s.kpis.revenue.value).toBe(100_000);
  expect(s.kpis.orders.value).toBe(0);
  expect(s.daily.find((d) => d.date === today.subtract(3, "day").format("YYYY-MM-DD"))?.revenue).toBe(100_000);
  expect(s.daily.find((d) => d.date === today.subtract(1, "day").format("YYYY-MM-DD"))?.revenue).toBe(0);
  // Chưa hoàn mà đang chờ hoàn: trừ trước số phải hoàn
  expect(stats([order("2", 3, { status: "cancelled", refundDue: 500_000 })]).kpis.revenue.value).toBe(0);
});

test("So với kỳ trước cùng độ dài; kỳ trước không có số thì không so được", () => {
  const s = stats([order("3", 1), order("4", 2), order("5", 9)]);
  expect(s.kpis.orders).toEqual({ value: 2, delta: 1 });
  expect(s.kpis.revenue.delta).toBe(1);
  expect(stats([order("3", 1)]).kpis.orders.delta).toBeNull();
});

test("Giá trị đơn trung bình: tiền hàng của đơn Hoàn tất trong kỳ, không tính đơn hủy, đơn đang xử lý, phí vận chuyển", () => {
  const s = stats([
    order("6", 1, { subtotal: 300_000, discount: 0, shippingFee: 30_000, total: 330_000 }),
    order("7", 1, { subtotal: 700_000, discount: 0, shippingFee: 0, total: 700_000 }),
    order("8", 1, { status: "cancelled", subtotal: 9_000_000, discount: 0, total: 9_000_000 }),
    order("9", 1, { status: "shipping", subtotal: 5_000_000, discount: 0, total: 5_000_000 }),
  ]);
  expect(s.kpis.average).toMatchObject({ value: 500_000, completed: 2 });
});

test("Khách mới: đơn hợp lệ đầu tiên của số điện thoại rơi vào kỳ", () => {
  const s = stats([
    order("0901 111 111", 2),
    // Khách cũ: đã có đơn trước kỳ
    order("0902", 1),
    order("0902", 20),
    // Đơn đầu bị hủy không tính, đơn sau trong kỳ mới là đơn đầu
    order("0903", 20, { status: "cancelled" }),
    order("0903", 3),
  ]);
  expect(s.kpis.customers.value).toBe(2);
});

test("Biểu đồ đủ số ngày của kỳ, đếm đơn mới theo ngày đặt", () => {
  const s = stats([order("9", 0), order("10", 0)], 30);
  expect(s.daily).toHaveLength(30);
  expect(s.daily.at(-1)).toMatchObject({ date: "2026-11-03", orders: 2, revenue: 1_000_000 });
});

test("Theo danh mục dùng tên ở trang Danh mục, nến tự phối gộp nhóm Tự phối", () => {
  const s = stats([order("11", 1), order("12", 1, { items: [{ custom: "Hũ gốm", name: "Nến tự phối", quantity: 2, price: 600_000 }] as Order["items"] })]);
  expect(s.byType).toEqual([
    { type: "Tự phối", revenue: 1_200_000 },
    { type: "Nước hoa đổi tên", revenue: 500_000 },
  ]);
  expect(s.top.map((t) => [t.name, t.sold])).toEqual([
    ["Nến tự phối", 2],
    ["Moon", 1],
  ]);
});

test("Việc cần xử lý: giao lỗi, chờ hoàn tiền", () => {
  const a = attention(
    [order("13", 1, { status: "delivery_failed" }), order("14", 1, { status: "cancelled", refundDue: 250_000 }), order("15", 1, { status: "cancelled", refundDue: 100_000, refund: { amount: 100_000 } as Order["refund"] })],
    today,
  );
  expect(a).toMatchObject({ issues: 1, issueStatus: "delivery_failed", refundCount: 1, refundAmount: 250_000 });
});
