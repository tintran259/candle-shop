// Phần đơn hàng của file sao lưu BO → bảng Order, OrderItem, Payment, OrderEvent, Complaint (tách từ map-backup.ts)
import { date, int, str, type J } from "./map-utils.js";

export function mapOrders(orderList: J[], now: Date) {
  const orders = orderList.map((o) => ({
    id: o.id,
    code: o.code,
    status: o.status,
    customerName: o.customer?.name ?? "",
    customerEmail: o.customer?.email ?? "",
    customerPhone: o.customer?.phone ?? "",
    shippingAddress: o.shippingAddress ?? "",
    shippingMethod: o.shippingMethod ?? "",
    shippingName: str(o.shippingName) ?? null,
    shippingDays: int(o.shippingDays) ?? null,
    depositPercent: int(o.depositPercent) ?? null,
    subtotal: int(o.subtotal) ?? 0,
    discount: int(o.discount) ?? 0,
    discountCode: str(o.discountCode) ?? null,
    shippingFee: int(o.shippingFee) ?? 0,
    total: int(o.total) ?? 0,
    paymentPlan: o.paymentPlan ?? "full",
    paymentMethod: o.paymentMethod ?? "cod",
    readyDate: o.readyDate ?? "",
    note: str(o.note) ?? null,
    internalNote: str(o.internalNote) ?? null,
    cancelReason: str(o.cancelReason) ?? null,
    cancelOutcome: o.cancelOutcome ?? null,
    cancelFault: o.cancelFault ?? null,
    refundDue: int(o.refundDue) ?? null,
    refundAmount: int(o.refund?.amount) ?? null,
    refundImages: o.refund?.images ?? [],
    refundNote: str(o.refund?.note) ?? null,
    refundAt: date(o.refund?.at) ?? null,
    refundBy: str(o.refund?.by) ?? null,
    carrierId: str(o.carrier?.id) ?? null,
    carrierName: str(o.carrier?.name) ?? null,
    shipCarrierId: str(o.shipment?.carrierId) ?? null,
    shipCarrier: str(o.shipment?.carrier) ?? null,
    trackingCode: str(o.shipment?.trackingCode) ?? null,
    trackingUrl: str(o.shipment?.trackingUrl) ?? null,
    shipCost: int(o.shipment?.cost) ?? null,
    shippedAt: date(o.shipment?.at) ?? null,
    shippingCost: int(o.shippingCost) ?? null,
    deliveryAttempts: int(o.deliveryAttempts) ?? null,
    deliveryIssue: str(o.deliveryIssue) ?? null,
    returnCondition: o.returnCondition ?? null,
    returnNote: str(o.returnNote) ?? null,
    resendFee: int(o.resendFee) ?? null,
    materialCost: int(o.materialCost) ?? null,
    replacementForId: str(o.replacementFor?.id) ?? null,
    replacementForCode: str(o.replacementFor?.code) ?? null,
    createdAt: date(o.createdAt) ?? now,
    updatedAt: date(o.updatedAt) ?? now,
  }));
  const orderItems = orderList.flatMap((o) =>
    ((o.items ?? []) as J[]).map((i, k) => ({
      id: `${o.id}:${i.id}`,
      orderId: o.id,
      sortOrder: k,
      productId: str(i.productId) ?? null,
      name: i.name ?? "",
      image: str(i.image) ?? null,
      price: int(i.price) ?? 0,
      quantity: int(i.quantity) ?? 1,
      custom: str(i.custom) ?? null,
      craft: i.craft ?? undefined,
      recipe: i.recipe ?? undefined,
    })),
  );
  const payments = orderList.flatMap((o) =>
    ((o.payments ?? []) as J[]).map((p) => ({
      id: `${o.id}:${p.id}`,
      orderId: o.id,
      provider: p.provider ?? "cod",
      amount: int(p.amount) ?? 0,
      status: p.status ?? "pending",
      transactionId: str(p.transactionId) ?? null,
      isRefund: p.kind === "refund",
      images: p.images ?? [],
      note: str(p.note) ?? null,
      createdAt: date(p.createdAt) ?? now,
    })),
  );
  const events = orderList.flatMap((o) =>
    ((o.history ?? []) as J[]).map((e, k) => ({ orderId: o.id, sortOrder: k, at: date(e.at) ?? now, kind: e.kind ?? null, status: e.status, note: str(e.note) ?? null, by: e.by ?? "" })),
  );
  const complaints = orderList.flatMap((o) =>
    ((o.complaints ?? []) as J[]).map((c) => ({
      id: `${o.id}:${c.id}`,
      orderId: o.id,
      reason: c.reason ?? "",
      images: c.images ?? [],
      resolution: c.resolution ?? "none",
      refundAmount: int(c.refundAmount) ?? null,
      replacementId: str(c.replacementId) ?? null,
      replacementCode: str(c.replacementCode) ?? null,
      at: date(c.at) ?? now,
      by: c.by ?? "",
    })),
  );

  return { orders, orderItems, payments, events, complaints };
}
