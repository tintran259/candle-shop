// Tạo đơn tại BO (khách đặt qua điện thoại, Zalo, Facebook, tại cửa hàng…). Cùng cách tính tiền với web:
// tạm tính − giảm giá + phí giao; cọc 50% hoặc trả đủ. Tiền là VNĐ, số nguyên.
import dayjs from "dayjs";
import type { CraftSelection } from "@/lib/craft/selection";
import { discountStatus } from "@/lib/discounts/labels";
import type { Discount } from "@/lib/discounts/types";
import { formatMoney } from "@/lib/format";
import { DEPOSIT_RATE, SHIPPING_FEE } from "@/lib/orders/labels";
import type { Order, OrderEvent, OrderItem, PaymentPlan, PaymentProvider, ShippingMethod } from "@/lib/orders/types";

// Kênh khách đặt — ghi vào lịch sử đơn
export const orderChannels = ["phone", "zalo", "facebook", "store", "other"] as const;
export type OrderChannel = (typeof orderChannels)[number];
export const channelLabels: Record<OrderChannel, string> = { phone: "Điện thoại", zalo: "Zalo", facebook: "Facebook", store: "Tại cửa hàng", other: "Khác" };

// Ghi chú của sự kiện đầu tiên khi đơn tạo tại BO: "Tạo đơn tại BO · Zalo"
export const BO_ORDER_NOTE = "Tạo đơn tại BO";
// Kênh khách đặt nếu đơn tạo tại BO, không thì undefined (đơn khách tự đặt trên web)
export const boChannel = (note?: string) => (note?.startsWith(BO_ORDER_NOTE) ? note.slice(BO_ORDER_NOTE.length).replace(/^ · /, "") : undefined);

// Một dòng trong form: nến có sẵn (productId) hoặc nến tự phối (cấu hình theo các bước Thủ công → mô tả + giá)
export type DraftLine = {
  kind: "product" | "custom";
  productId?: string;
  name?: string;
  image?: string;
  custom?: string;
  craft?: CraftSelection;
  price?: number;
  quantity?: number;
};

export const lineTotal = (l: DraftLine) => Math.max(0, Math.round(l.price ?? 0)) * Math.max(0, Math.round(l.quantity ?? 0));

export type DiscountResult = { discount?: Discount; amount: number; error?: string };

// Kiểm tra & tính mã giảm giá giống lúc khách nhập ở checkout
export function evaluateDiscount(code: string | undefined, discounts: Discount[], lines: DraftLine[], shippingFee: number, previousOrders: Order[]): DiscountResult {
  const key = code?.trim().toUpperCase();
  if (!key) return { amount: 0 };
  const d = discounts.find((x) => x.code === key);
  if (!d) return { amount: 0, error: "Không có mã này." };
  const status = discountStatus(d);
  if (status !== "running") return { amount: 0, error: { paused: "Mã đang tạm dừng.", expired: "Mã đã hết hạn.", exhausted: "Mã đã hết lượt dùng.", scheduled: "Mã chưa tới ngày áp dụng.", running: "" }[status] };
  const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
  if (d.minOrder && subtotal < d.minOrder) return { amount: 0, error: `Đơn từ ${formatMoney(d.minOrder)} mới dùng được mã này.` };
  const valid = previousOrders.filter((o) => o.status !== "cancelled");
  if (d.firstOrderOnly && valid.length) return { amount: 0, error: "Mã chỉ dành cho khách đặt lần đầu." };
  if (d.perCustomerLimit && valid.filter((o) => o.discountCode === d.code).length >= d.perCustomerLimit) return { amount: 0, error: "Khách đã dùng hết lượt của mã này." };
  if (d.type === "freeship") return shippingFee ? { discount: d, amount: shippingFee } : { amount: 0, error: "Đơn đang miễn phí giao — mã không có tác dụng." };
  // Phạm vi: chỉ tính trên các dòng phù hợp
  const base = lines.filter((l) => d.scope === "all" || (d.scope === "products" ? l.kind === "product" : l.kind === "custom")).reduce((s, l) => s + lineTotal(l), 0);
  if (!base) return { amount: 0, error: d.scope === "products" ? "Mã chỉ áp dụng cho nến có sẵn." : "Mã chỉ áp dụng cho nến tự phối." };
  const raw = d.type === "percent" ? Math.round((base * d.value) / 100 / 1000) * 1000 : d.value;
  return { discount: d, amount: Math.min(base, d.type === "percent" && d.maxDiscount ? Math.min(raw, d.maxDiscount) : raw) };
}

export type OrderTotals = { subtotal: number; discount: number; shippingFee: number; total: number; dueNow: number };

export function orderTotals(lines: DraftLine[], shipping: ShippingMethod, plan: PaymentPlan, discount: number): OrderTotals {
  const subtotal = lines.reduce((s, l) => s + lineTotal(l), 0);
  const shippingFee = SHIPPING_FEE[shipping];
  const total = Math.max(0, subtotal - discount + shippingFee);
  const dueNow = plan === "deposit" ? Math.round((total * DEPOSIT_RATE) / 1000) * 1000 : total;
  return { subtotal, discount, shippingFee, total, dueNow };
}

// Mã đơn theo ngày như web: SC + YYMMDD + số thứ tự trong ngày
export function nextOrderCode(orders: Order[], at = dayjs()) {
  const prefix = `SC${at.format("YYMMDD")}`;
  const used = new Set(orders.map((o) => o.code));
  for (let n = orders.filter((o) => o.code.startsWith(prefix)).length + 1; ; n++) {
    const code = `${prefix}${String(n).padStart(3, "0")}`;
    if (!used.has(code)) return code;
  }
}

export type CreateOrderInput = {
  customer: Order["customer"];
  shippingAddress: string;
  shippingMethod: ShippingMethod;
  lines: DraftLine[];
  discount: DiscountResult;
  paymentPlan: PaymentPlan;
  paymentMethod: PaymentProvider;
  // Đã nhận tiền (cọc / đủ) lúc tạo đơn → đơn "Đã thanh toán"
  received: boolean;
  transactionId?: string;
  readyDate: string;
  channel: OrderChannel;
  note?: string;
  internalNote?: string;
  by: string;
};

export function buildOrder(input: CreateOrderInput, orders: Order[]): Order {
  const now = dayjs();
  const at = now.toISOString();
  const totals = orderTotals(input.lines, input.shippingMethod, input.paymentPlan, input.discount.amount);
  const items: OrderItem[] = input.lines.map((l, i) => ({
    id: `${now.valueOf().toString(36)}-${i}`,
    productId: l.kind === "product" ? l.productId : undefined,
    name: l.kind === "product" ? (l.name ?? "") : "Nến tự phối",
    image: l.kind === "product" ? l.image : undefined,
    price: Math.round(l.price ?? 0),
    quantity: Math.round(l.quantity ?? 1),
    custom: l.kind === "custom" ? l.custom?.trim() : undefined,
    craft: l.kind === "custom" ? l.craft : undefined,
  }));
  const history: OrderEvent[] = [{ at, status: "pending", by: input.by, note: `${BO_ORDER_NOTE} · ${channelLabels[input.channel]}` }];
  if (input.received)
    history.push({ at, status: "paid", by: input.by, note: input.paymentPlan === "deposit" ? `Nhận cọc ${formatMoney(totals.dueNow)}` : "Thanh toán đủ" });
  return {
    id: `ord-${now.valueOf().toString(36)}`,
    code: nextOrderCode(orders, now),
    status: input.received ? "paid" : "pending",
    customer: { name: input.customer.name.trim(), phone: input.customer.phone.trim(), email: input.customer.email.trim() },
    shippingAddress: input.shippingAddress.trim(),
    shippingMethod: input.shippingMethod,
    items,
    subtotal: totals.subtotal,
    discount: totals.discount,
    discountCode: input.discount.discount?.code,
    shippingFee: totals.shippingFee,
    total: totals.total,
    paymentPlan: input.paymentPlan,
    paymentMethod: input.paymentMethod,
    payments: [
      {
        id: `pay-${now.valueOf().toString(36)}`,
        provider: input.paymentMethod,
        amount: totals.dueNow,
        status: input.received ? "success" : "pending",
        transactionId: input.received ? input.transactionId?.trim() || undefined : undefined,
        createdAt: at,
      },
    ],
    readyDate: input.readyDate,
    note: input.note?.trim() || undefined,
    internalNote: input.internalNote?.trim() || undefined,
    history,
    createdAt: at,
    updatedAt: at,
  };
}
