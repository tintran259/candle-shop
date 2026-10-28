// Dữ liệu mẫu cho dashboard — sẽ thay bằng API thống kê từ BE.
// Dùng PRNG có seed để server và client render ra cùng một số liệu.

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(2510);
const TODAY = new Date("2026-10-28T00:00:00Z");

export type DailyRevenue = { date: string; revenue: number; orders: number };

/** 90 ngày gần nhất: xu hướng tăng nhẹ + cuối tuần bán chạy hơn */
export const dailyRevenue: DailyRevenue[] = Array.from({ length: 90 }, (_, i) => {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() - (89 - i));
  const weekend = [0, 6].includes(d.getUTCDay()) ? 1.35 : 1;
  const orders = Math.round((14 + i * 0.12) * weekend * (0.75 + rand() * 0.5));
  const revenue = Math.round(orders * (30 + rand() * 8));
  return { date: d.toISOString().slice(0, 10), revenue, orders };
});

const sum = (rows: DailyRevenue[], key: "revenue" | "orders") => rows.reduce((s, r) => s + r[key], 0);

/** So sánh 30 ngày gần nhất với 30 ngày trước đó */
const last30 = dailyRevenue.slice(-30);
const prev30 = dailyRevenue.slice(-60, -30);

export const kpis = (() => {
  const revenue = sum(last30, "revenue");
  const orders = sum(last30, "orders");
  const prevRevenue = sum(prev30, "revenue");
  const prevOrders = sum(prev30, "orders");
  return {
    revenue: { value: revenue, delta: revenue / prevRevenue - 1 },
    orders: { value: orders, delta: orders / prevOrders - 1 },
    aov: { value: revenue / orders, delta: revenue / orders / (prevRevenue / prevOrders) - 1 },
    customers: { value: 184, delta: 0.124 },
  };
})();

export type ProductRow = { id: string; name: string; image: string; sold: number; revenue: number; stock: number };

export const topProducts: ProductRow[] = [
  { id: "moon-morning", name: "Moon Morning", image: "/products/product-moon.jpg", sold: 212, revenue: 7208, stock: 34 },
  { id: "vanilla-relax", name: "Vanilla Relax", image: "/products/product-vanilla.jpg", sold: 198, revenue: 3960, stock: 8 },
  { id: "brown-relac", name: "Brown Relac", image: "/products/product-brown.jpg", sold: 154, revenue: 5082, stock: 51 },
  { id: "beach-sunshine", name: "Beach Sunshine", image: "/products/product-beach.jpg", sold: 121, revenue: 4840, stock: 5 },
];

export const salesByType = [
  { type: "Nước hoa", revenue: 14230 },
  { type: "Thiên nhiên", revenue: 11640 },
  { type: "Trái cây", revenue: 7920 },
];

export type OrderStatus = "pending" | "paid" | "shipping" | "completed" | "cancelled";
export type PaymentMethod = "VNPay" | "MoMo" | "COD";

export type Order = {
  code: string;
  customer: string;
  email: string;
  items: number;
  total: number;
  payment: PaymentMethod;
  status: OrderStatus;
  createdAt: string;
};

export const recentOrders: Order[] = [
  { code: "SC20261028", customer: "Nguyễn Minh Anh", email: "minhanh@example.com", items: 2, total: 74, payment: "VNPay", status: "pending", createdAt: "2026-10-28T09:12:00+07:00" },
  { code: "SC20261027", customer: "Trần Bảo Ngọc", email: "baongoc@example.com", items: 1, total: 34, payment: "MoMo", status: "paid", createdAt: "2026-10-27T21:40:00+07:00" },
  { code: "SC20261026", customer: "Sunny Marwah", email: "sunny@example.com", items: 3, total: 118, payment: "VNPay", status: "shipping", createdAt: "2026-10-27T15:05:00+07:00" },
  { code: "SC20261025", customer: "Lê Hoàng Phúc", email: "hoangphuc@example.com", items: 1, total: 40, payment: "COD", status: "shipping", createdAt: "2026-10-27T10:22:00+07:00" },
  { code: "SC20261024", customer: "Phạm Thu Hà", email: "thuha@example.com", items: 2, total: 53, payment: "MoMo", status: "completed", createdAt: "2026-10-26T19:48:00+07:00" },
  { code: "SC20261023", customer: "Wing Sun", email: "wingsun@example.com", items: 4, total: 142, payment: "VNPay", status: "completed", createdAt: "2026-10-26T08:30:00+07:00" },
  { code: "SC20261022", customer: "Đỗ Gia Huy", email: "giahuy@example.com", items: 1, total: 20, payment: "COD", status: "cancelled", createdAt: "2026-10-25T17:16:00+07:00" },
];
