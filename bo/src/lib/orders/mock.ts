// ⚠️ DỮ LIỆU MẪU — ngày tính theo hôm nay để luôn có đơn sắp tới hạn / trễ hạn khi thử.
// Bản thật lấy từ BE: GET /api/orders.
import dayjs from "dayjs";
import { orderFlow, type Order, type OrderEvent, type OrderItem, type OrderStatus, type PaymentPlan, type ShippingMethod } from "@/lib/orders/types";
import { mockProducts } from "@/lib/products/mock";

const DEPOSIT_RATE = 0.5;
const SHIPPING_FEE: Record<ShippingMethod, number> = { standard: 0, express: 50_000 };
const DISCOUNTS: Record<string, number> = { WELCOME10: 0.1, CANDLE2510: 0.15 };

const custom = (desc: string, price: number): Omit<OrderItem, "id" | "quantity"> => ({ name: "Nến tự phối", price, custom: desc });
const product = (id: string): Omit<OrderItem, "id" | "quantity"> => {
  const p = mockProducts.find((x) => x.id === id)!;
  return { productId: p.id, name: p.name, image: p.images[0], price: p.salePrice ?? p.price };
};

type Seed = {
  name: string;
  phone: string;
  address: string;
  items: [Omit<OrderItem, "id" | "quantity">, number][];
  status: OrderStatus;
  // Đặt cách hôm nay bao nhiêu ngày (âm = trước), ngày xong cách ngày đặt bao nhiêu ngày
  placed: number;
  readyAfter: number;
  plan: PaymentPlan;
  method: "vnpay" | "momo";
  shipping?: ShippingMethod;
  code?: string;
  note?: string;
  cancelReason?: string;
};

const seeds: Seed[] = [
  { name: "Nguyễn Minh Anh", phone: "0912 345 678", address: "12 Lý Tự Trọng, Q.1, TP.HCM", items: [[product("moon-morning"), 1], [product("vanilla-relax"), 2]], status: "pending", placed: 0, readyAfter: 3, plan: "deposit", method: "vnpay", note: "Gói quà giúp mình nhé." },
  { name: "Trần Bảo Ngọc", phone: "0987 654 321", address: "45 Nguyễn Huệ, Q.1, TP.HCM", items: [[custom("Hũ gốm · 150g · Sáp đậu nành · Vanilla 70% + Lavender 30% · Nhãn “Ngọc ♥”", 735_000), 1]], status: "paid", placed: -1, readyAfter: 2, plan: "full", method: "momo", code: "CANDLE2510" },
  { name: "Lê Hoàng Phúc", phone: "0903 112 233", address: "88 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội", items: [[product("beach-sunshine"), 1]], status: "producing", placed: -2, readyAfter: 2, plan: "deposit", method: "vnpay", shipping: "express" },
  { name: "Phạm Thu Hà", phone: "0938 445 566", address: "21 Võ Văn Tần, Q.3, TP.HCM", items: [[product("woman-secret"), 1], [product("brown-relac"), 1]], status: "producing", placed: -3, readyAfter: 2, plan: "full", method: "vnpay" },
  { name: "Sunny Marwah", phone: "0905 778 899", address: "5 Bạch Đằng, Hải Châu, Đà Nẵng", items: [[custom("Thủy tinh hổ phách · 200g · Sáp dừa · Sandalwood · Bấc gỗ · Hoa khô", 885_000), 2]], status: "producing", placed: -4, readyAfter: 3, plan: "deposit", method: "momo", note: "Giao giờ hành chính." },
  { name: "Wing Sun", phone: "0977 001 122", address: "120 Hai Bà Trưng, Q.1, TP.HCM", items: [[product("moonlight-aurora"), 2], [product("moon-morning"), 2]], status: "ready", placed: -4, readyAfter: 3, plan: "full", method: "vnpay", code: "WELCOME10" },
  { name: "Đỗ Gia Huy", phone: "0966 334 455", address: "33 Phan Chu Trinh, Hoàn Kiếm, Hà Nội", items: [[product("citrus-bloom"), 3]], status: "ready", placed: -5, readyAfter: 3, plan: "deposit", method: "momo" },
  { name: "Vũ Khánh Linh", phone: "0919 223 344", address: "9 Pasteur, Q.3, TP.HCM", items: [[product("vanilla-relax"), 1]], status: "shipping", placed: -6, readyAfter: 2, plan: "full", method: "momo" },
  { name: "Hoàng Anh Tuấn", phone: "0932 556 677", address: "77 Lê Lợi, Huế", items: [[product("brown-relac"), 2], [custom("Hũ thiếc · 100g · Sáp đậu nành · Citrus · Không trang trí", 525_000), 1]], status: "shipping", placed: -7, readyAfter: 3, plan: "deposit", method: "vnpay" },
  { name: "Ngô Thanh Vy", phone: "0944 889 900", address: "14 Nguyễn Trãi, Q.5, TP.HCM", items: [[product("moon-morning"), 1]], status: "completed", placed: -9, readyAfter: 2, plan: "full", method: "vnpay" },
  // Khách quen: Wing Sun từng mua đơn này trước đơn đang chờ giao
  { name: "Wing Sun", phone: "0977 001 122", address: "120 Hai Bà Trưng, Q.1, TP.HCM", items: [[product("woman-secret"), 2]], status: "completed", placed: -11, readyAfter: 3, plan: "deposit", method: "momo", code: "CANDLE2510" },
  { name: "Mai Phương Thảo", phone: "0911 990 011", address: "3 Hàng Bài, Hoàn Kiếm, Hà Nội", items: [[product("beach-sunshine"), 1]], status: "cancelled", placed: -3, readyAfter: 3, plan: "full", method: "vnpay", cancelReason: "Khách đổi ý, đã hoàn tiền." },
  { name: "Đặng Minh Khoa", phone: "0923 445 667", address: "18 Lê Duẩn, Q.1, TP.HCM", items: [[product("citrus-bloom"), 1]], status: "pending", placed: -2, readyAfter: 2, plan: "full", method: "momo" },
  { name: "Trịnh Hải Yến", phone: "0936 778 112", address: "41 Kim Mã, Ba Đình, Hà Nội", items: [[custom("Hũ gốm · 200g · Sáp ong · Rose + White Tea · Topping sáp", 1_045_000), 1]], status: "paid", placed: -1, readyAfter: 3, plan: "deposit", method: "vnpay" },
];

const slugEmail = (name: string) =>
  name.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d").toLowerCase().split(" ").slice(-2).join("") + "@example.com";

function build(s: Seed, index: number): Order {
  const placedAt = dayjs().add(s.placed, "day").hour(8 + ((index * 3) % 12)).minute((index * 17) % 60).second(0);
  const at = (hoursLater: number) => placedAt.add(hoursLater, "hour").toISOString();
  const items: OrderItem[] = s.items.map(([it, quantity], i) => ({ ...it, id: `${index}-${i}`, quantity }));
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = s.code ? Math.round((subtotal * DISCOUNTS[s.code]) / 1000) * 1000 : 0;
  const shipping = s.shipping ?? "standard";
  const total = subtotal - discount + SHIPPING_FEE[shipping];
  const dueNow = s.plan === "deposit" ? Math.round((total * DEPOSIT_RATE) / 1000) * 1000 : total;

  // Lịch sử đi theo quy trình tới trạng thái hiện tại
  const reached = s.status === "cancelled" ? ["pending", "paid"] : orderFlow.slice(0, orderFlow.indexOf(s.status) + 1);
  const history: OrderEvent[] = reached.map((status, i) => ({
    at: at(i === 0 ? 0 : i * 18),
    status: status as OrderStatus,
    by: status === "pending" || status === "paid" ? "Hệ thống" : "Admin 2510",
    note: status === "paid" ? (s.plan === "deposit" ? "Nhận cọc 50%" : "Thanh toán đủ") : undefined,
  }));
  if (s.status === "cancelled") history.push({ at: at(30), status: "cancelled", by: "Admin 2510", note: s.cancelReason });

  const isPaid = s.status !== "pending";
  const payments: Order["payments"] = [
    {
      id: `pay-${index}-1`,
      provider: s.method,
      amount: dueNow,
      status: s.status === "cancelled" ? "refunded" : isPaid ? "success" : "pending",
      transactionId: isPaid ? String(14_000_000 + index * 7919) : undefined,
      createdAt: at(0.2),
    },
  ];
  if (s.status === "completed" && dueNow < total) {
    const at = history.at(-1)!.at;
    payments.push({ id: `pay-${index}-2`, provider: "cod", amount: total - dueNow, status: "success", createdAt: at });
    history.splice(-1, 0, { at, kind: "payment", status: "shipping", by: "Admin 2510", note: `Thu nốt ${(total - dueNow).toLocaleString("vi-VN")} ₫ khi giao` });
  }

  return {
    id: `ord-${index + 1}`,
    code: `SC${placedAt.format("YYMMDD")}${String(index + 1).padStart(3, "0")}`,
    status: s.status,
    customer: { name: s.name, phone: s.phone, email: slugEmail(s.name) },
    shippingAddress: s.address,
    shippingMethod: shipping,
    items,
    subtotal,
    discount,
    discountCode: s.code,
    shippingFee: SHIPPING_FEE[shipping],
    total,
    paymentPlan: s.plan,
    paymentMethod: s.method,
    payments,
    readyDate: placedAt.add(s.readyAfter, "day").format("YYYY-MM-DD"),
    note: s.note,
    cancelReason: s.cancelReason,
    history,
    createdAt: placedAt.toISOString(),
    updatedAt: history.at(-1)!.at,
  };
}

export const mockOrders: Order[] = seeds.map(build);
