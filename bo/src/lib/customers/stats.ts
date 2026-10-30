// Số liệu mua hàng của khách — tính từ đơn hàng, gộp theo số điện thoại.
// Khi có BE nên trả sẵn trong GET /api/customers (đếm/tổng ở DB thay vì tải hết đơn).
import dayjs from "dayjs";
import type { Customer } from "@/lib/customers/types";
import { paidAmount } from "@/lib/orders/labels";
import type { Order, OrderItem } from "@/lib/orders/types";

export const phoneKey = (phone: string) => phone.replace(/\D/g, "");

// Phân nhóm tự động — xét từ trên xuống, nhóm đầu tiên khớp được chọn
export type Segment = "vip" | "at-risk" | "returning" | "new" | "none";
export const VIP_SPENT = 3_000_000;
export const VIP_ORDERS = 4;
// Quá số ngày này chưa đặt lại → "Lâu chưa mua"
export const AT_RISK_DAYS = 60;

export const segmentMeta: Record<Segment, { label: string; color: string; hint: string }> = {
  vip: { label: "VIP", color: "gold", hint: `Đã chi từ ${VIP_SPENT / 1e6} triệu hoặc từ ${VIP_ORDERS} đơn.` },
  "at-risk": { label: "Lâu chưa mua", color: "volcano", hint: `Hơn ${AT_RISK_DAYS} ngày chưa đặt lại — nên gửi ưu đãi.` },
  returning: { label: "Khách quen", color: "green", hint: "Đã đặt từ 2 đơn." },
  new: { label: "Khách mới", color: "blue", hint: "Mới đặt 1 đơn." },
  none: { label: "Chưa mua", color: "default", hint: "Chưa có đơn thành công — mới đăng ký hoặc đơn đã hủy." },
};
export const segmentOrder: Segment[] = ["vip", "returning", "new", "at-risk", "none"];

export type CustomerStats = {
  // Mới nhất trước, gồm cả đơn đã hủy
  orders: Order[];
  // Không tính đơn đã hủy
  orderCount: number;
  cancelled: number;
  // Tiền thực nhận (gồm cọc), không tính đơn hủy
  spent: number;
  average: number;
  lastOrderAt?: string;
  firstOrderAt?: string;
  // Địa chỉ đã giao, mới dùng nhất trước
  addresses: string[];
  segment: Segment;
};

export type CustomerRow = { customer: Customer; stats: CustomerStats };

export function groupOrdersByPhone(orders: Order[]) {
  const map = new Map<string, Order[]>();
  for (const o of orders) {
    const key = phoneKey(o.customer.phone);
    map.set(key, [...(map.get(key) ?? []), o]);
  }
  return map;
}

export function customerStats(customer: Customer, ordersByPhone: Map<string, Order[]>, today = dayjs()): CustomerStats {
  const orders = [...(ordersByPhone.get(phoneKey(customer.phone)) ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const valid = orders.filter((o) => o.status !== "cancelled");
  const spent = valid.reduce((s, o) => s + paidAmount(o), 0);
  const lastOrderAt = valid[0]?.createdAt;
  const addresses = [...new Set(valid.map((o) => o.shippingAddress))];

  let segment: Segment = "none";
  if (valid.length) {
    if (spent >= VIP_SPENT || valid.length >= VIP_ORDERS) segment = "vip";
    else if (today.diff(dayjs(lastOrderAt), "day") > AT_RISK_DAYS) segment = "at-risk";
    else segment = valid.length > 1 ? "returning" : "new";
  }

  return {
    orders,
    orderCount: valid.length,
    cancelled: orders.length - valid.length,
    spent,
    average: valid.length ? Math.round(spent / valid.length) : 0,
    lastOrderAt,
    firstOrderAt: valid.at(-1)?.createdAt,
    addresses,
    segment,
  };
}

// Sản phẩm khách mua nhiều nhất (theo số lượng), bỏ đơn đã hủy
export function favoriteItems(stats: CustomerStats, limit = 3) {
  const count = new Map<string, { item: OrderItem; quantity: number }>();
  for (const o of stats.orders) {
    if (o.status === "cancelled") continue;
    for (const i of o.items) {
      const key = i.productId ?? `custom:${i.custom ?? i.name}`;
      count.set(key, { item: i, quantity: (count.get(key)?.quantity ?? 0) + i.quantity });
    }
  }
  return [...count.values()].sort((a, b) => b.quantity - a.quantity).slice(0, limit);
}
