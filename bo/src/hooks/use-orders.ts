import { useMemo } from "react";
import { createLocalStore, useLocalStore } from "@/lib/local-store";
import { nextStatus, remaining } from "@/lib/orders/labels";
import { mockOrders } from "@/lib/orders/mock";
import type { Order, OrderEvent, OrderStatus } from "@/lib/orders/types";

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

// Chuyển sang bước kế tiếp; xác nhận thanh toán thì đánh dấu giao dịch đang chờ là thành công
const advance = (id: string) =>
  patch(id, (o) => {
    const to = nextStatus(o.status);
    if (!to) return o;
    const payments = to === "paid" ? o.payments.map((p) => (p.status === "pending" ? { ...p, status: "success" as const } : p)) : o.payments;
    return { ...o, status: to, payments, history: log(o, to) };
  });

const cancel = (id: string, reason: string) =>
  patch(id, (o) => ({ ...o, status: "cancelled", cancelReason: reason, history: log(o, "cancelled", reason) }));

// Ghi nhận đã thu phần còn lại (cọc 50% → thu nốt khi giao)
const collectRemaining = (id: string) =>
  patch(id, (o) => {
    const amount = remaining(o);
    if (!amount) return o;
    const payment = { id: `pay-${Date.now()}`, provider: "cod" as const, amount, status: "success" as const, createdAt: now() };
    return { ...o, payments: [...o.payments, payment], history: log(o, o.status, `Thu nốt ${amount.toLocaleString("vi-VN")} ₫ khi giao`, "payment") };
  });

const reschedule = (id: string, readyDate: string) =>
  patch(id, (o) => ({ ...o, readyDate, history: log(o, o.status, `Ngày làm xong mới: ${readyDate.split("-").reverse().join("/")}`, "schedule") }));

const setInternalNote = (id: string, internalNote: string) => patch(id, (o) => ({ ...o, internalNote: internalNote.trim() || undefined }));

// Đơn tạo tại BO — thêm lên đầu danh sách
const create = (order: Order) => store.set([order, ...store.get()]);

const reset = () => store.set(null);

export function useOrders() {
  const { data: orders, loading } = useLocalStore(store);
  return useMemo(
    () => ({ orders, loading, create, advance, cancel, collectRemaining, reschedule, setInternalNote, reset }),
    [orders, loading],
  );
}

export type OrdersApi = ReturnType<typeof useOrders>;
