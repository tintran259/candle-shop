import { useMemo } from "react";
import { createLocalStore, useLocalStore } from "@/lib/local-store";
import { cancelOutcomeLabels, faultLabels, nextStatus, refundFor, remaining, returnConditionLabels } from "@/lib/orders/labels";
import { mockOrders } from "@/lib/orders/mock";
import type { CancelFault, CancelOutcome, Order, OrderEvent, OrderStatus, Refund, ReturnCondition } from "@/lib/orders/types";

// Chưa có API: lưu tạm trên trình duyệt. Khi có BE thay bằng /api/orders (GET, PATCH status/payment/note).
// v3: thêm đơn cũ cho trang Khách hàng — bỏ dữ liệu mẫu v2
const store = createLocalStore<Order[]>("bo-orders-v3", mockOrders);

const STAFF = "Admin 2510";
const now = () => new Date().toISOString();

// Thao tác chỉ đụng tới store nên để ngoài hook — giữ nguyên tham chiếu giữa các lần render
const patch = (id: string, fn: (o: Order) => Order) =>
  store.set(store.get().map((o) => (o.id === id ? { ...fn(o), updatedAt: now() } : o)));

const log = (o: Order, status: OrderStatus, note?: string, kind: OrderEvent["kind"] = "status") => [
  ...o.history,
  { at: now(), kind, status, note, by: STAFF },
];

// Ghi nhận đã thu phần còn lại
const collect = (o: Order): Order => {
  const amount = remaining(o);
  if (!amount) return o;
  const payment = { id: `pay-${Date.now()}`, provider: "cod" as const, amount, status: "success" as const, createdAt: now() };
  return { ...o, payments: [...o.payments, payment], history: log(o, o.status, `Thu nốt ${amount.toLocaleString("vi-VN")} ₫ khi giao`, "payment") };
};

// Chuyển sang bước kế tiếp; xác nhận thanh toán thì đánh dấu giao dịch đang chờ là thành công.
// Khách đã nhận nghĩa là đã thu đủ
const advance = (id: string) =>
  patch(id, (current) => {
    const to = nextStatus(current.status);
    if (!to) return current;
    const o = to === "completed" ? collect(current) : current;
    const payments = to === "paid" ? o.payments.map((p) => (p.status === "pending" ? { ...p, status: "success" as const } : p)) : o.payments;
    return { ...o, status: to, payments, history: log(o, to) };
  });

export type CancelInput = { reason: string; outcome?: CancelOutcome; fault?: CancelFault };

const cancel = (id: string, { reason, outcome, fault }: CancelInput) =>
  patch(id, (o) => {
    const note = [reason, outcome && cancelOutcomeLabels[outcome], fault && faultLabels[fault]].filter(Boolean).join(" · ");
    return { ...o, status: "cancelled", cancelReason: reason, cancelOutcome: outcome, cancelFault: fault, refundDue: (fault && refundFor(o, fault)) || undefined, history: log(o, "cancelled", note) };
  });

// Trả false khi trình duyệt hết chỗ lưu ảnh chứng từ
const recordRefund = (id: string, refund: Omit<Refund, "at" | "by">) =>
  patch(id, (o) => ({ ...o, refund: { ...refund, at: now(), by: STAFF }, history: log(o, o.status, `Đã hoàn ${refund.amount.toLocaleString("vi-VN")} ₫ cho khách`, "payment") }));

// Giao không thành; hết số lần giao thì tự chuyển hoàn về
const failDelivery = (id: string, reason: string, max: number) =>
  patch(id, (o) => {
    const deliveryAttempts = (o.deliveryAttempts ?? 0) + 1;
    const failed: Order = { ...o, status: "delivery_failed", deliveryAttempts, deliveryIssue: reason, history: log(o, "delivery_failed", `Lần ${deliveryAttempts}/${max}: ${reason}`) };
    return deliveryAttempts < max ? failed : { ...failed, status: "returning", history: log(failed, "returning", `Hết ${max} lần giao`) };
  });

const redeliver = (id: string) => patch(id, (o) => ({ ...o, status: "shipping", history: log(o, "shipping", `Giao lại lần ${(o.deliveryAttempts ?? 0) + 1}`, "delivery") }));

const startReturn = (id: string) => patch(id, (o) => ({ ...o, status: "returning", history: log(o, "returning") }));

const receiveReturn = (id: string, returnCondition: ReturnCondition, returnNote?: string) =>
  patch(id, (o) => ({ ...o, status: "returned", returnCondition, returnNote, history: log(o, "returned", [returnConditionLabels[returnCondition], returnNote].filter(Boolean).join(" · ")) }));

// Hàng về shop rồi gửi lại: quay về Chờ giao, đếm lại số lần giao, phí cộng vào đơn
const resend = (id: string, fee: number) =>
  patch(id, (o) => ({
    ...o,
    status: "ready",
    deliveryAttempts: 0,
    deliveryIssue: undefined,
    returnCondition: undefined,
    returnNote: undefined,
    shippingFee: o.shippingFee + fee,
    total: o.total + fee,
    resendFee: (o.resendFee ?? 0) + fee,
    history: log(o, "ready", `Gửi lại đơn · phí ${fee.toLocaleString("vi-VN")} ₫`, "delivery"),
  }));

const reschedule = (id: string, readyDate: string) =>
  patch(id, (o) => ({ ...o, readyDate, history: log(o, o.status, `Ngày làm xong mới: ${readyDate.split("-").reverse().join("/")}`, "schedule") }));

const setInternalNote = (id: string, internalNote: string) => patch(id, (o) => ({ ...o, internalNote: internalNote.trim() || undefined }));

// Đơn tạo tại BO — thêm lên đầu danh sách
const create = (order: Order) => store.set([order, ...store.get()]);

const reset = () => store.set(null);

export function useOrders() {
  const { data: orders, loading } = useLocalStore(store);
  return useMemo(
    () => ({ orders, loading, create, advance, cancel, recordRefund, failDelivery, redeliver, startReturn, receiveReturn, resend, reschedule, setInternalNote, reset }),
    [orders, loading],
  );
}

export type OrdersApi = ReturnType<typeof useOrders>;
