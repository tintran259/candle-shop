import dayjs from "dayjs";
import { orderFlow, type Order, type OrderStatus, type PaymentProvider, type ShippingMethod } from "@/lib/orders/types";

// Màu trạng thái luôn đi kèm chữ (tag antd preset)
export const statusMeta: Record<OrderStatus, { label: string; color: string; hint: string }> = {
  pending: { label: "Chờ thanh toán", color: "gold", hint: "Khách chưa trả cọc/thanh toán." },
  paid: { label: "Đã thanh toán", color: "blue", hint: "Đã nhận cọc hoặc đủ tiền — chờ xưởng nhận làm." },
  producing: { label: "Đang làm", color: "orange", hint: "Xưởng đang đổ và ủ hương." },
  ready: { label: "Chờ giao", color: "cyan", hint: "Đã làm xong, chờ bàn giao vận chuyển." },
  shipping: { label: "Đang giao", color: "purple", hint: "Đơn vị vận chuyển đang giao." },
  completed: { label: "Hoàn tất", color: "green", hint: "Khách đã nhận hàng." },
  cancelled: { label: "Đã hủy", color: "default", hint: "Đơn đã hủy." },
};

// Nhãn ngắn cho thanh tiến trình
export const stepLabels: Record<(typeof orderFlow)[number], string> = {
  pending: "Đặt hàng",
  paid: "Thanh toán",
  producing: "Đang làm",
  ready: "Làm xong",
  shipping: "Đang giao",
  completed: "Hoàn tất",
};

// Nút chuyển bước kế tiếp trong drawer
export const nextAction: Partial<Record<OrderStatus, string>> = {
  pending: "Xác nhận đã thanh toán",
  paid: "Bắt đầu làm",
  producing: "Đã làm xong",
  ready: "Giao cho vận chuyển",
  shipping: "Khách đã nhận",
};

export const nextStatus = (s: OrderStatus): OrderStatus | undefined => {
  const i = orderFlow.indexOf(s as (typeof orderFlow)[number]);
  return i >= 0 && i < orderFlow.length - 1 ? orderFlow[i + 1] : undefined;
};

// Chỉ hủy được trước khi giao
export const canCancel = (s: OrderStatus) => ["pending", "paid", "producing", "ready"].includes(s);

export const providerLabels: Record<PaymentProvider, string> = { vnpay: "VNPay", momo: "MoMo", cod: "Tiền mặt / chuyển khoản" };

// Cọc khi đặt (khách chọn "Cọc 50%") và phí giao theo phương thức — web và đơn tạo tại BO dùng chung
export const DEPOSIT_RATE = 0.5;
export const SHIPPING_FEE: Record<ShippingMethod, number> = { standard: 0, express: 50_000 };
export const shippingLabels: Record<ShippingMethod, string> = { standard: "Tiêu chuẩn (3 ngày)", express: "Nhanh (1 ngày)" };

export const paidAmount = (o: Order) =>
  o.payments.filter((p) => p.status === "success").reduce((s, p) => s + p.amount, 0);
export const remaining = (o: Order) => Math.max(0, o.total - paidAmount(o));

export type PaymentState = "unpaid" | "deposit" | "paid" | "refunded";
export function paymentState(o: Order): PaymentState {
  if (o.payments.some((p) => p.status === "refunded")) return "refunded";
  const paid = paidAmount(o);
  if (paid <= 0) return "unpaid";
  return paid >= o.total ? "paid" : "deposit";
}
export const paymentStateMeta: Record<PaymentState, { label: string; color: string }> = {
  unpaid: { label: "Chưa thanh toán", color: "default" },
  deposit: { label: "Đã cọc", color: "gold" },
  paid: { label: "Đã thanh toán đủ", color: "green" },
  refunded: { label: "Đã hoàn tiền", color: "magenta" },
};

// Hạn làm xong so với hôm nay — chỉ có ý nghĩa khi đơn chưa làm xong
export type Deadline = { label: string; tone: "danger" | "warning" | "secondary" } | null;
export function deadline(o: Order, today = dayjs()): Deadline {
  if (!["pending", "paid", "producing"].includes(o.status)) return null;
  const days = dayjs(o.readyDate).startOf("day").diff(today.startOf("day"), "day");
  if (days < 0) return { label: `Trễ ${-days} ngày`, tone: "danger" };
  if (days === 0) return { label: "Hôm nay", tone: "warning" };
  if (days === 1) return { label: "Ngày mai", tone: "warning" };
  return { label: `Còn ${days} ngày`, tone: "secondary" };
}

export const itemCount = (o: Order) => o.items.reduce((s, i) => s + i.quantity, 0);
