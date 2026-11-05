import dayjs from "dayjs";
import { depositAmount } from "@/lib/orders/create";
import { deliveryIssues, orderFlow, type CancelFault, type CancelOutcome, type Order, type OrderStatus, type PaymentProvider, type ReturnCondition, type ShippingMethod } from "@/lib/orders/types";

// Màu trạng thái luôn đi kèm chữ (tag antd preset)
export const statusMeta: Record<OrderStatus, { label: string; color: string; hint: string }> = {
  pending: { label: "Chờ thanh toán", color: "gold", hint: "Khách chưa trả cọc/thanh toán." },
  paid: { label: "Đã thanh toán", color: "blue", hint: "Đã nhận cọc hoặc đủ tiền — chờ xưởng nhận làm." },
  producing: { label: "Đang làm", color: "orange", hint: "Xưởng đang đổ và ủ hương." },
  ready: { label: "Chờ giao", color: "cyan", hint: "Đã làm xong, chờ bàn giao vận chuyển." },
  shipping: { label: "Đang giao", color: "purple", hint: "Đơn vị vận chuyển đang giao." },
  completed: { label: "Hoàn tất", color: "green", hint: "Khách đã nhận hàng." },
  delivery_failed: { label: "Giao không thành", color: "red", hint: "Chọn giao lại hoặc hoàn về." },
  returning: { label: "Đang hoàn về", color: "volcano", hint: "Hàng đang trên đường về shop." },
  returned: { label: "Đã hoàn về", color: "magenta", hint: "Hàng đã về shop. Chọn gửi lại đơn hoặc hủy đơn." },
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

// Hủy được trước khi giao, hoặc sau khi hàng đã hoàn về shop
export const canCancel = (s: OrderStatus) => ["pending", "paid", "producing", "ready", "returned"].includes(s);

export const isDeliveryIssue = (s: OrderStatus) => (deliveryIssues as readonly OrderStatus[]).includes(s);
// Số lần giao không thành của các đơn, để cảnh báo khách hay bom hàng
export const failedDeliveries = (orders: Order[]) => orders.reduce((n, o) => n + o.history.filter((e) => e.status === "delivery_failed").length, 0);

export const faultLabels: Record<CancelFault, string> = { customer: "Lỗi do khách", shop: "Lỗi do shop" };
export const returnConditionLabels: Record<ReturnCondition, string> = { good: "Nến còn tốt", damaged: "Nến bị hỏng" };

export const cancelOutcomeLabels: Record<CancelOutcome, string> = {
  returned: "Chưa làm: hoàn nguyên liệu đã trừ về Kho",
  stocked: "Đã làm: chuyển sang Sản phẩm hủy đơn",
  consumed: "Đã làm: không hoàn nguyên liệu",
};

export const providerLabels: Record<PaymentProvider, string> = { vnpay: "VNPay", momo: "MoMo", cod: "Tiền mặt / chuyển khoản" };

// Giá trị của đơn trước khi có trang Cài đặt và dữ liệu mẫu. Đơn mới lấy từ Cài đặt và lưu vào đơn
export const DEPOSIT_RATE = 0.5;
export const SHIPPING_FEE: Record<ShippingMethod, number> = { standard: 0, express: 50_000 };
const shippingLabels: Record<ShippingMethod, string> = { standard: "Tiêu chuẩn (3 ngày)", express: "Nhanh (1 ngày)" };
const SHIP_DAYS: Record<ShippingMethod, number> = { standard: 3, express: 1 };

export const depositLabel = (o: Order) => `Cọc ${o.depositPercent ?? DEPOSIT_RATE * 100}%`;
export const shippingName = (o: Order) => o.shippingName ?? shippingLabels[o.shippingMethod] ?? o.shippingMethod;
export const shippingDays = (o: Order) => o.shippingDays ?? SHIP_DAYS[o.shippingMethod] ?? 3;

export const paidAmount = (o: Order) => o.payments.filter((p) => p.status === "success").reduce((s, p) => s + p.amount, 0);
export const remaining = (o: Order) => Math.max(0, o.total - paidAmount(o));
// Khách đã trả nhiều hơn tổng đơn (sau khi sửa đơn bớt hàng) — cần hoàn phần dư
export const overpaid = (o: Order) => (o.status === "cancelled" ? 0 : Math.max(0, paidAmount(o) - o.total));
// Tổng các khoản hoàn một phần (thu dư, khiếu nại), số dương
export const partialRefunds = (o: Order) => -o.payments.filter((p) => p.kind === "refund" && p.status === "success").reduce((s, p) => s + p.amount, 0);
// Đơn gửi bù cho khiếu nại: không tính vào số đơn, doanh thu, khách hàng
export const isReplacement = (o: Order) => !!o.replacementFor;

// Lỗi do shop hoàn hết tiền đã thu. Lỗi do khách giữ phần cọc, cọc tính trên tiền hàng (không gồm phí giao, phí gửi lại)
export function refundFor(o: Order, fault: CancelFault) {
  const paid = paidAmount(o);
  if (fault === "shop") return paid;
  return Math.max(0, paid - depositAmount(Math.max(0, o.total - (o.shippingFee ?? 0)), o.depositPercent ?? DEPOSIT_RATE * 100));
}

export type PaymentState = "unpaid" | "deposit" | "paid" | "refunding" | "refunded";
export function paymentState(o: Order): PaymentState {
  if (o.refund || o.payments.some((p) => p.status === "refunded")) return "refunded";
  if (o.refundDue) return "refunding";
  const paid = paidAmount(o);
  // Đơn 0 ₫ (gửi bù khiếu nại) không có gì để thu
  if (paid <= 0) return o.total > 0 ? "unpaid" : "paid";
  return paid >= o.total ? "paid" : "deposit";
}
export const paymentStateMeta: Record<PaymentState, { label: string; color: string }> = {
  unpaid: { label: "Chưa thanh toán", color: "default" },
  deposit: { label: "Đã cọc", color: "gold" },
  paid: { label: "Đã thanh toán đủ", color: "green" },
  refunding: { label: "Chờ hoàn tiền", color: "red" },
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
