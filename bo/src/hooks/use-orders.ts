import { useMemo } from "react";
import { reloadCancelled } from "@/hooks/use-cancelled-products";
import { reloadCustomers } from "@/hooks/use-customers";
import { reloadDiscounts } from "@/hooks/use-discounts";
import { reloadInventory } from "@/hooks/use-inventory";
import { api } from "@/lib/api";
import { createLocalStore, upsert, useLocalStore } from "@/lib/local-store";
import { createOrder, editOrder, orderAction, shipBody } from "@/lib/orders/remote";
import { cancelOutcomeLabels, faultLabels, nextStatus, refundFor, remaining, returnConditionLabels } from "@/lib/orders/labels";
import { recordComplaint } from "@/lib/orders/complaint";
import { applyEdit, type EditOrderInput } from "@/lib/orders/edit";
import { shipmentNote, shipmentText } from "@/lib/orders/shipping";
import type { CancelFault, CancelOutcome, ComplaintResolution, Order, OrderEvent, OrderStatus, Refund, ReturnCondition, Shipment } from "@/lib/orders/types";
import { staffName } from "@/lib/auth";

// Đơn hàng: /api/admin/orders (docs/api.md#đơn-hàng). Mỗi thao tác đổi ngay trên giao diện (tính như cũ), gọi BE rồi lấy đơn BE trả về;
// BE tự giữ / trừ / hoàn Kho, đếm lượt mã, tạo hồ sơ khách, sản phẩm hủy đơn nên tải lại các kho đó sau thao tác.
// Lưu trên trình duyệt (chế độ local): v4 — bắt đầu không có đơn
const store = createLocalStore<Order[]>("bo-orders-v4", [], undefined, () => api<Order[]>("GET", "/admin/orders"));

const now = () => new Date().toISOString();

// Thao tác chỉ đụng tới store nên để ngoài hook — giữ nguyên tham chiếu giữa các lần render.
// request: gọi BE, trả đơn sau khi đổi; after: tải lại kho khác bị BE đổi theo
const patch = (id: string, fn: (o: Order) => Order, request?: () => Promise<Order>, after?: () => unknown) =>
  store.sync(
    store.get().map((o) => (o.id === id ? { ...fn(o), updatedAt: now() } : o)),
    request &&
      (async () => {
        const saved = await request();
        void after?.();
        return upsert(saved);
      }),
  );

const log = (o: Order, status: OrderStatus, note?: string, kind: OrderEvent["kind"] = "status") => [...o.history, { at: now(), kind, status, note, by: staffName() }];

// Ghi nhận đã thu phần còn lại
const collect = (o: Order): Order => {
  const amount = remaining(o);
  if (!amount) return o;
  const payment = { id: `pay-${Date.now()}`, provider: "cod" as const, amount, status: "success" as const, createdAt: now() };
  return { ...o, payments: [...o.payments, payment], history: log(o, o.status, `Thu nốt ${amount.toLocaleString("vi-VN")} ₫ khi giao`, "payment") };
};

// Chuyển sang bước kế tiếp; xác nhận thanh toán thì đánh dấu giao dịch đang chờ là thành công.
// Khách đã nhận nghĩa là đã thu đủ. extra: trường ghi kèm, vd giá vốn chốt lúc Bắt đầu làm
const advance = (id: string, extra?: Partial<Order>) => {
  const from = store.get().find((o) => o.id === id)?.status;
  return patch(
    id,
    (current) => {
      const to = nextStatus(current.status);
      if (!to) return current;
      const o = to === "completed" ? collect(current) : current;
      const payments = to === "paid" ? o.payments.map((p) => (p.status === "pending" ? { ...p, status: "success" as const } : p)) : o.payments;
      return { ...o, ...extra, status: to, payments, history: log(o, to) };
    },
    () => orderAction(id, "POST", "advance"),
    from === "paid" ? reloadInventory : undefined,
  );
};

// Giao cho vận chuyển (Chờ giao → Đang giao) kèm đơn vị và mã vận đơn
const ship = (id: string, shipment: Shipment) =>
  patch(
    id,
    (o) => (o.status === "ready" ? { ...o, status: "shipping", shipment, shippingCost: (o.shippingCost ?? 0) + (shipment.cost ?? 0), history: log(o, "shipping", shipmentNote(shipment)) } : o),
    () => orderAction(id, "POST", "ship", shipBody(shipment)),
  );

// Sửa đơn vị / mã vận đơn của lượt giao hiện tại
const updateShipment = (id: string, shipment: Shipment) =>
  patch(
    id,
    (o) => ({
      ...o,
      shipment,
      // Sửa phí của lượt này: bù phần chênh vào tổng phí đã trả
      shippingCost: (o.shippingCost ?? 0) - (o.shipment?.cost ?? 0) + (shipment.cost ?? 0),
      history: log(o, o.status, `Đổi vận chuyển: ${o.shipment ? `${shipmentNote(o.shipment)} → ` : ""}${shipmentNote(shipment)}`, "delivery"),
    }),
    () => orderAction(id, "PUT", "shipment", shipBody(shipment)),
  );

// Sửa đơn sau khi tạo. Trả về danh sách thay đổi (rỗng = không đổi gì)
const edit = (id: string, input: EditOrderInput) => {
  const order = store.get().find((o) => o.id === id);
  if (!order) return [];
  const result = applyEdit(order, input, staffName());
  if (result.changes.length)
    store.sync(
      store.get().map((o) => (o.id === id ? result.order : o)),
      async () => {
        const saved = await editOrder(id, input);
        void reloadDiscounts();
        void reloadCustomers();
        return upsert(saved.order);
      },
    );
  return result.changes;
};

// Hoàn một phần (thu dư sau khi sửa đơn): khoản âm kèm ảnh chứng từ
const refundPart = (id: string, refund: { amount: number; images: string[]; note?: string }) =>
  patch(
    id,
    (o) => ({
      ...o,
      payments: [
        ...o.payments,
        { id: `pay-${Date.now().toString(36)}`, provider: "cod", amount: -Math.round(refund.amount), status: "success", kind: "refund", images: refund.images, note: refund.note, createdAt: now() },
      ],
      history: log(o, o.status, `Hoàn ${refund.amount.toLocaleString("vi-VN")} ₫ tiền thu dư`, "payment"),
    }),
    () => orderAction(id, "POST", "refund-overpaid", { amount: Math.round(refund.amount), images: refund.images, note: refund.note }),
  );

// picks, readyDate: các cây gửi bù và ngày làm xong của đơn gửi bù (gửi BE dựng đơn gửi bù)
export type ComplaintInput = {
  reason: string;
  images: string[];
  resolution: ComplaintResolution;
  refundAmount?: number;
  refundImages?: string[];
  refundNote?: string;
  replacement?: Order;
  picks?: { itemId: string; quantity: number }[];
  readyDate?: string;
};

// Khiếu nại sau khi giao; gửi bù thì tạo luôn đơn gửi bù
const complain = (id: string, input: ComplaintInput) => {
  const list = store.get();
  const order = list.find((o) => o.id === id);
  if (!order) return false;
  const updated = recordComplaint(order, { ...input, by: staffName() });
  const { reason, images, resolution, refundAmount, refundImages, refundNote, picks, readyDate } = input;
  return store.sync([...(input.replacement ? [input.replacement] : []), ...list.map((o) => (o.id === id ? updated : o))], async () => {
    await api("POST", `/admin/orders/${id}/complaints`, { reason, images, resolution, refundAmount, refundImages, refundNote, ...(resolution === "resend" && { picks, readyDate }) });
    // Đơn gửi bù do BE tạo (id, mã của BE) — tải lại cả danh sách
    return "reload";
  });
};

export type CancelInput = { reason: string; outcome?: CancelOutcome; fault?: CancelFault };

const cancel = (id: string, { reason, outcome, fault }: CancelInput) =>
  patch(
    id,
    (o) => {
      const note = [reason, outcome && cancelOutcomeLabels[outcome], fault && faultLabels[fault]].filter(Boolean).join(" · ");
      return {
        ...o,
        status: "cancelled",
        cancelReason: reason,
        cancelOutcome: outcome,
        cancelFault: fault,
        refundDue: (fault && refundFor(o, fault)) || undefined,
        history: log(o, "cancelled", note),
      };
    },
    async () => (await api<{ order: Order }>("POST", `/admin/orders/${id}/cancel`, { reason, outcome, fault })).order,
    () => Promise.all([reloadInventory(), reloadCancelled(), reloadDiscounts()]),
  );

// Trả false khi trình duyệt hết chỗ lưu ảnh chứng từ
const recordRefund = (id: string, refund: Omit<Refund, "at" | "by">) =>
  patch(
    id,
    (o) => ({ ...o, refund: { ...refund, at: now(), by: staffName() }, history: log(o, o.status, `Đã hoàn ${refund.amount.toLocaleString("vi-VN")} ₫ cho khách`, "payment") }),
    () => orderAction(id, "POST", "refund", { amount: Math.round(refund.amount), images: refund.images, note: refund.note }),
  );

// Giao không thành; hết số lần giao thì tự chuyển hoàn về
const failDelivery = (id: string, reason: string, max: number) =>
  patch(
    id,
    (o) => {
      const deliveryAttempts = (o.deliveryAttempts ?? 0) + 1;
      const failed: Order = { ...o, status: "delivery_failed", deliveryAttempts, deliveryIssue: reason, history: log(o, "delivery_failed", `Lần ${deliveryAttempts}/${max}: ${reason}`) };
      return deliveryAttempts < max ? failed : { ...failed, status: "returning", history: log(failed, "returning", `Hết ${max} lần giao`) };
    },
    () => orderAction(id, "POST", "delivery-failed", { reason }),
  );

const redeliver = (id: string) =>
  patch(
    id,
    (o) => ({
      ...o,
      status: "shipping",
      history: log(o, "shipping", [`Giao lại lần ${(o.deliveryAttempts ?? 0) + 1}`, o.shipment && shipmentText(o.shipment)].filter(Boolean).join(" · "), "delivery"),
    }),
    () => orderAction(id, "POST", "redeliver"),
  );

const startReturn = (id: string) =>
  patch(
    id,
    (o) => ({ ...o, status: "returning", history: log(o, "returning") }),
    () => orderAction(id, "POST", "return"),
  );

// returnFee: phí hoàn hàng shop trả đơn vị vận chuyển, cộng vào chi phí vận chuyển
const receiveReturn = (id: string, returnCondition: ReturnCondition, returnNote?: string, returnFee = 0) =>
  patch(
    id,
    (o) => ({
      ...o,
      status: "returned",
      returnCondition,
      returnNote,
      shippingCost: returnFee ? (o.shippingCost ?? 0) + returnFee : o.shippingCost,
      history: log(o, "returned", [returnConditionLabels[returnCondition], returnNote, returnFee && `phí hoàn hàng ${returnFee.toLocaleString("vi-VN")} ₫`].filter(Boolean).join(" · ")),
    }),
    () => orderAction(id, "POST", "receive-return", { condition: returnCondition, note: returnNote, returnFee }),
  );

// Hàng về shop rồi gửi lại: chọn lại đơn vị, mã vận đơn mới, chuyển thẳng Đang giao. Đếm lại số lần giao, phí cộng vào đơn.
// Lịch sử giữ mã của lượt giao trước
const resend = (id: string, fee: number, shipment: Shipment) =>
  patch(
    id,
    (o) => ({
      ...o,
      status: "shipping",
      shipment,
      shippingCost: (o.shippingCost ?? 0) + (shipment.cost ?? 0),
      deliveryAttempts: 0,
      deliveryIssue: undefined,
      returnCondition: undefined,
      returnNote: undefined,
      shippingFee: o.shippingFee + fee,
      total: o.total + fee,
      resendFee: (o.resendFee ?? 0) + fee,
      history: log(o, "shipping", `Gửi lại đơn · khách trả thêm ${fee.toLocaleString("vi-VN")} ₫ · ${shipmentNote(shipment)}`, "delivery"),
    }),
    () => orderAction(id, "POST", "resend", { ...shipBody(shipment), fee }),
  );

const reschedule = (id: string, readyDate: string) =>
  patch(
    id,
    (o) => ({ ...o, readyDate, history: log(o, o.status, `Ngày làm xong mới: ${readyDate.split("-").reverse().join("/")}`, "schedule") }),
    () => orderAction(id, "PATCH", "ready-date", { readyDate }),
  );

const setInternalNote = (id: string, internalNote: string) =>
  patch(
    id,
    (o) => ({ ...o, internalNote: internalNote.trim() || undefined }),
    () => orderAction(id, "PATCH", "internal-note", { internalNote }),
  );

// Đơn tạo tại BO — thêm lên đầu danh sách
const create = (order: Order) =>
  store.sync([order, ...store.get()], async () => {
    await createOrder(order);
    void reloadCustomers();
    void reloadDiscounts();
    // Mã đơn do BE cấp — tải lại để khớp
    return "reload";
  });

const reset = () => store.set(null);

export function useOrders() {
  const { data: orders, loading } = useLocalStore(store);
  return useMemo(
    () => ({
      orders,
      loading,
      create,
      advance,
      ship,
      updateShipment,
      edit,
      refundPart,
      complain,
      cancel,
      recordRefund,
      failDelivery,
      redeliver,
      startReturn,
      receiveReturn,
      resend,
      reschedule,
      setInternalNote,
      reset,
    }),
    [orders, loading],
  );
}

export type OrdersApi = ReturnType<typeof useOrders>;
