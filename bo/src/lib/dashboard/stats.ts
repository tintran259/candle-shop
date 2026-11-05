// Số liệu Dashboard tính từ đơn trong BO. Khi có BE thay bằng API thống kê, giữ nguyên quy tắc ở docs/pages/dashboard.md.
import dayjs, { type Dayjs } from "dayjs";
import { goodsValue } from "@/lib/costs";
import { deadline, isDeliveryIssue, isReplacement } from "@/lib/orders/labels";
import { orderMoney, orderProfit, type MoneyEntry } from "@/lib/orders/money";
import type { Order, OrderStatus } from "@/lib/orders/types";
import type { Product } from "@/lib/products/types";

const DAY = "YYYY-MM-DD";
const CUSTOM = "custom";

export const dashboardRanges = [7, 30, 90] as const;

export type DailyRevenue = { date: string; revenue: number; orders: number };
export type TypeSales = { type: string; revenue: number };
export type ProductSales = { id: string; name: string; image?: string; sold: number; revenue: number };

// Doanh thu ghi nhận khi đơn chốt, vào ngày chốt (docs/pages/dashboard.md#quy-tắc-doanh-thu). Chỉ tiền hàng, không gồm phí vận chuyển.
// - Hoàn tất: tiền hàng đã thu tới lúc hoàn tất; khoản hoàn sau đó (khiếu nại) trừ vào ngày hoàn.
// - Đã hủy: tiền hàng shop giữ lại (vd tiền cọc), đã trừ số hoàn / số đang chờ hoàn.
// - Đơn chưa xong (đang làm, đang giao, giao lỗi, đang hoàn, đã hoàn về Kho): chưa tính, kể cả tiền cọc đã thu.
function moneyEntries(o: Order): MoneyEntry[] {
  const at = closedAt(o);
  if (!at) return [];
  const { entries, goods } = orderMoney(o);
  if (o.status === "cancelled") return goods ? [{ at, amount: goods }] : [];
  const until = entries.filter((e) => e.at <= at).reduce((s, e) => s + e.amount, 0);
  return [{ at, amount: until }, ...entries.filter((e) => e.at > at)];
}

// Tiền hàng đã thu của đơn chưa chốt (tiền cọc, đã thu đủ nhưng chưa giao xong) — chưa tính vào doanh thu
export function pendingRevenue(orders: Order[]) {
  const open = orders
    .filter((o) => o.status !== "cancelled" && !closedAt(o))
    .map((o) => orderMoney(o).goods)
    .filter((n) => n > 0);
  return { amount: open.reduce((s, n) => s + n, 0), count: open.length };
}

const phoneKey = (o: Order) => o.customer.phone.replace(/\D/g, "");
// So với kỳ trước; kỳ trước không có số thì không so được
const change = (now: number, before: number) => (before > 0 ? now / before - 1 : null);

// Ngày chốt đơn: lúc Hoàn tất hoặc lúc hủy (lần cuối chuyển sang trạng thái đó). Đơn đang xử lý chưa chốt
export function closedAt(o: Order) {
  if (o.status !== "completed" && o.status !== "cancelled") return undefined;
  return o.history.findLast((e) => e.status === o.status && (e.kind ?? "status") === "status")?.at ?? o.updatedAt;
}

// costOf: giá vốn nguyên liệu của đơn.
// Đơn hàng: đơn đặt trong kỳ, không tính đơn hủy, đơn gửi bù.
// Giá trị đơn TB: tiền hàng (không gồm phí vận chuyển) trung bình của đơn Hoàn tất trong kỳ, không tính đơn gửi bù.
// Lãi gộp: đơn đã chốt trong kỳ — Hoàn tất, và đơn hủy (tiền cọc giữ lại, phí vận chuyển đã trả, nguyên liệu đã mất).
// Đơn gửi bù vẫn tính lãi (giá 0 nên lãi âm)
function period(orders: Order[], from: string, to: string, costOf: (o: Order) => number) {
  const inRange = (iso: string) => {
    const d = dayjs(iso).format(DAY);
    return d >= from && d <= to;
  };
  const placed = orders.filter((o) => o.status !== "cancelled" && !isReplacement(o) && inRange(o.createdAt));
  const revenue = orders.flatMap(moneyEntries).reduce((s, e) => s + (inRange(e.at) ? e.amount : 0), 0);
  const closed = orders.filter((o) => {
    const at = closedAt(o);
    return at !== undefined && inRange(at);
  });
  const completed = closed.filter((o) => o.status === "completed" && !isReplacement(o));
  const value = completed.reduce((s, o) => s + goodsValue(o), 0);
  const profits = closed.map((o) => orderProfit(o, costOf(o)));
  const goods = profits.reduce((s, p) => s + p.value, 0);
  const profit = profits.reduce((s, p) => s + p.profit, 0);
  // Phí vận chuyển khách trả − phí trả đơn vị vận chuyển: âm là shop chịu
  const shipping = profits.reduce((s, p) => s + p.shipping, 0);
  return {
    placed,
    revenue,
    count: placed.length,
    completed: completed.length,
    average: completed.length ? value / completed.length : 0,
    closed: closed.length,
    profit,
    shipping,
    profitRate: goods > 0 ? profit / goods : null,
  };
}

// Khách mới: đơn hợp lệ đầu tiên của số điện thoại rơi vào kỳ
function newCustomers(orders: Order[], from: string, to: string) {
  const first = new Map<string, string>();
  for (const o of orders) {
    if (o.status === "cancelled" || isReplacement(o)) continue;
    const d = dayjs(o.createdAt).format(DAY);
    const key = phoneKey(o);
    if (!first.has(key) || d < first.get(key)!) first.set(key, d);
  }
  return [...first.values()].filter((d) => d >= from && d <= to).length;
}

// categoryLabel: tên danh mục theo id (trang Danh mục); costOf: giá vốn nguyên liệu của đơn (lib/costs)
export function dashboardStats(orders: Order[], products: Product[], categoryLabel: (id?: string) => string, days: number, today: Dayjs = dayjs(), costOf: (o: Order) => number = () => 0) {
  const to = today.format(DAY);
  const from = today.subtract(days - 1, "day").format(DAY);
  const prevTo = today.subtract(days, "day").format(DAY);
  const prevFrom = today.subtract(days * 2 - 1, "day").format(DAY);
  const now = period(orders, from, to, costOf);
  const prev = period(orders, prevFrom, prevTo, costOf);
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
      const type = item.custom ? "Tự phối" : product ? categoryLabel(product.categoryId) : "Khác";
      types.set(type, (types.get(type) ?? 0) + value);
      const id = item.custom ? CUSTOM : (item.productId ?? item.name);
      const row = sales.get(id) ?? { id, name: item.custom ? "Nến tự phối" : (product?.name ?? item.name), image: item.custom ? undefined : (product?.images[0] ?? item.image), sold: 0, revenue: 0 };
      sales.set(id, { ...row, sold: row.sold + item.quantity, revenue: row.revenue + value });
    }
  }

  return {
    kpis: {
      revenue: { value: now.revenue, delta: change(now.revenue, prev.revenue), pending: pendingRevenue(orders) },
      orders: { value: now.count, delta: change(now.count, prev.count) },
      average: { value: now.average, delta: change(now.average, prev.average), completed: now.completed },
      customers: { value: customers, delta: change(customers, prevCustomers) },
      profit: { value: now.profit, delta: change(now.profit, prev.profit), rate: now.profitRate, shipping: now.shipping, closed: now.closed },
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
