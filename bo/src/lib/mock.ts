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
  // Giá trị mỗi đơn khoảng 750.000 – 950.000 ₫, làm tròn tới nghìn
  const revenue = Math.round((orders * (750_000 + rand() * 200_000)) / 1000) * 1000;
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
  { id: "moon-morning", name: "Moon Morning", image: "/products/product-moon.jpg", sold: 212, revenue: 180_200_000, stock: 34 },
  { id: "vanilla-relax", name: "Vanilla Relax", image: "/products/product-vanilla.jpg", sold: 198, revenue: 99_000_000, stock: 8 },
  { id: "brown-relac", name: "Brown Relac", image: "/products/product-brown.jpg", sold: 154, revenue: 127_050_000, stock: 51 },
  { id: "beach-sunshine", name: "Beach Sunshine", image: "/products/product-beach.jpg", sold: 121, revenue: 121_000_000, stock: 5 },
];

export const salesByType = [
  { type: "Nước hoa", revenue: 355_750_000 },
  { type: "Thiên nhiên", revenue: 291_000_000 },
  { type: "Trái cây", revenue: 198_000_000 },
];
