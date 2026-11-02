// Số liệu Dashboard tính từ đơn trong BO. Khi có BE thay bằng API thống kê, giữ nguyên quy tắc ở docs/pages/dashboard.md.
import dayjs, { type Dayjs } from "dayjs";
import { deadline, isDeliveryIssue } from "@/lib/orders/labels";
import type { Order, OrderStatus } from "@/lib/orders/types";
import { aromaTypeLabels } from "@/lib/products/labels";
import type { Product } from "@/lib/products/types";

const DAY = "YYYY-MM-DD";
const CUSTOM = "custom";

export const dashboardRanges = [7, 30, 90] as const;

export type DailyRevenue = { date: string; revenue: number; orders: number };
export type TypeSales = { type: string; revenue: number };
export type ProductSales = { id: string; name: string; image?: string; sold: number; revenue: number };

// Mỗi biến động tiền của đơn: khoản đã thu là dương, tiền đã hoàn hoặc đang chờ hoàn là âm
function moneyEntries(o: Order) {
  const entries = o.payments.filter((p) => p.status === "success").map((p) => ({ at: p.createdAt, amount: p.amount }));
  const back = o.status === "cancelled" ? (o.refund?.amount ?? o.refundDue ?? 0) : 0;
  return back ? [...entries, { at: o.refund?.at ?? o.updatedAt, amount: -back }] : entries;
}

const phoneKey = (o: Order) => o.customer.phone.replace(/\D/g, "");
// So với kỳ trước; kỳ trước không có số thì không so được
const change = (now: number, before: number) => (before > 0 ? now / before - 1 : null);

function period(orders: Order[], from: string, to: string) {
  const inRange = (iso: string) => {
    const d = dayjs(iso).format(DAY);
    return d >= from && d <= to;
  };
  const placed = orders.filter((o) => o.status !== "cancelled" && inRange(o.createdAt));
  const revenue = orders.flatMap(moneyEntries).reduce((s, e) => s + (inRange(e.at) ? e.amount : 0), 0);
  const value = placed.reduce((s, o) => s + o.total, 0);
  return { placed, revenue, count: placed.length, average: placed.length ? value / placed.length : 0 };
}

// Khách mới: đơn hợp lệ đầu tiên của số điện thoại rơi vào kỳ
function newCustomers(orders: Order[], from: string, to: string) {
  const first = new Map<string, string>();
  for (const o of orders) {
    if (o.status === "cancelled") continue;
    const d = dayjs(o.createdAt).format(DAY);
    const key = phoneKey(o);
    if (!first.has(key) || d < first.get(key)!) first.set(key, d);
  }
  return [...first.values()].filter((d) => d >= from && d <= to).length;
}

export function dashboardStats(orders: Order[], products: Product[], days: number, today: Dayjs = dayjs()) {
  const to = today.format(DAY);
  const from = today.subtract(days - 1, "day").format(DAY);
  const prevTo = today.subtract(days, "day").format(DAY);
  const prevFrom = today.subtract(days * 2 - 1, "day").format(DAY);
  const now = period(orders, from, to);
  const prev = period(orders, prevFrom, prevTo);
  const customers = newCustomers(orders, from, to);
  const prevCustomers = newCustomers(orders, prevFrom, prevTo);

  const daily = new Map<string, DailyRevenue>(
    Array.from({ length: days }, (_, i) => {
      const date = today.subtract(days - 1 - i, "day").format(DAY);
      return [date, { date, revenue: 0, orders: 0 }];
    }),
  );
  for (const e of orders.flatMap(moneyEntries)) {
    const row = daily.get(dayjs(e.at).format(DAY));
    if (row) row.revenue += e.amount;
  }
  for (const o of now.placed) {
    const row = daily.get(dayjs(o.createdAt).format(DAY));
    if (row) row.orders += 1;
  }

  // Tỉ trọng và bán chạy tính theo giá trị dòng trên đơn, nến tự phối gộp một nhóm
  const byId = new Map(products.map((p) => [p.id, p]));
  const types = new Map<string, number>();
  const sales = new Map<string, ProductSales>();
  for (const o of now.placed) {
    for (const item of o.items) {
      const value = item.price * item.quantity;
      const product = item.productId ? byId.get(item.productId) : undefined;
      const type = item.custom ? "Tự phối" : product ? aromaTypeLabels[product.aromaType] : "Khác";
      types.set(type, (types.get(type) ?? 0) + value);
      const id = item.custom ? CUSTOM : (item.productId ?? item.name);
      const row = sales.get(id) ?? { id, name: item.custom ? "Nến tự phối" : (product?.name ?? item.name), image: item.custom ? undefined : (product?.images[0] ?? item.image), sold: 0, revenue: 0 };
      sales.set(id, { ...row, sold: row.sold + item.quantity, revenue: row.revenue + value });
    }
  }

  return {
    kpis: {
      revenue: { value: now.revenue, delta: change(now.revenue, prev.revenue) },
      orders: { value: now.count, delta: change(now.count, prev.count) },
      average: { value: now.average, delta: change(now.average, prev.average) },
      customers: { value: customers, delta: change(customers, prevCustomers) },
    },
    daily: [...daily.values()],
    byType: [...types].map(([type, revenue]): TypeSales => ({ type, revenue })).sort((a, b) => b.revenue - a.revenue),
    top: [...sales.values()].sort((a, b) => b.sold - a.sold || b.revenue - a.revenue).slice(0, 4),
  };
}

export type DashboardStats = ReturnType<typeof dashboardStats>;

// Việc cần xử lý ngay, không phụ thuộc kỳ đang xem
export function attention(orders: Order[], today: Dayjs = dayjs()) {
  const refunds = orders.filter((o) => o.refundDue && !o.refund);
  const issues = orders.filter((o) => isDeliveryIssue(o.status));
  return {
    late: orders.filter((o) => deadline(o, today)?.tone === "danger").length,
    issues: issues.length,
    issueStatus: issues[0]?.status as OrderStatus | undefined,
    refundCount: refunds.length,
    refundAmount: refunds.reduce((s, o) => s + (o.refundDue ?? 0), 0),
  };
}
