// Đơn trong DB → đúng dạng Order của BO (bo/src/lib/orders/types.ts). id dòng, khoản thu, khiếu nại lưu dạng "<orderId>:<id>"
// để không trùng giữa các đơn; trả về BO thì bỏ tiền tố
import type { Complaint, Order, OrderEvent, OrderItem, Payment, Prisma } from '../generated/prisma/client.js';

export const withAll = {
  items: { orderBy: { sortOrder: 'asc' } },
  payments: { orderBy: { createdAt: 'asc' } },
  events: { orderBy: { sortOrder: 'asc' } },
  complaints: { orderBy: { at: 'asc' } },
} as const;
export type OrderRow = Order & { items: OrderItem[]; payments: Payment[]; events: OrderEvent[]; complaints: Complaint[] };

const opt = <T>(v: T | null) => v ?? undefined;
const local = (orderId: string, id: string) => (id.startsWith(`${orderId}:`) ? id.slice(orderId.length + 1) : id);
export const rowId = (orderId: string, id: string) => `${orderId}:${id}`;

export const itemDto = (orderId: string, i: OrderItem) => ({
  id: local(orderId, i.id),
  productId: opt(i.productId),
  name: i.name,
  image: opt(i.image),
  price: i.price,
  quantity: i.quantity,
  custom: opt(i.custom),
  craft: opt(i.craft),
  recipe: opt(i.recipe as { materialId: string; quantity: number }[] | null),
});

export function orderDto(o: OrderRow) {
  return {
    id: o.id,
    code: o.code,
    status: o.status,
    customer: { name: o.customerName, email: o.customerEmail, phone: o.customerPhone },
    shippingAddress: o.shippingAddress,
    shippingMethod: o.shippingMethod,
    shippingName: opt(o.shippingName),
    shippingDays: opt(o.shippingDays),
    depositPercent: opt(o.depositPercent),
    items: o.items.map((i) => itemDto(o.id, i)),
    subtotal: o.subtotal,
    discount: o.discount,
    discountCode: opt(o.discountCode),
    shippingFee: o.shippingFee,
    total: o.total,
    paymentPlan: o.paymentPlan,
    paymentMethod: o.paymentMethod,
    payments: o.payments.map((p) => ({
      id: local(o.id, p.id),
      provider: p.provider,
      amount: p.amount,
      status: p.status,
      transactionId: opt(p.transactionId),
      ...(p.isRefund && { kind: 'refund' as const }),
      ...(p.images.length && { images: p.images }),
      note: opt(p.note),
      createdAt: p.createdAt.toISOString(),
    })),
    readyDate: o.readyDate,
    note: opt(o.note),
    internalNote: opt(o.internalNote),
    cancelReason: opt(o.cancelReason),
    cancelOutcome: opt(o.cancelOutcome),
    cancelFault: opt(o.cancelFault),
    refundDue: opt(o.refundDue),
    refund: o.refundAmount !== null ? { amount: o.refundAmount, images: o.refundImages, note: opt(o.refundNote), at: o.refundAt?.toISOString() ?? '', by: o.refundBy ?? '' } : undefined,
    carrier: o.carrierId ? { id: o.carrierId, name: o.carrierName ?? o.carrierId } : undefined,
    shipment: o.shipCarrierId
      ? {
          carrierId: o.shipCarrierId,
          carrier: o.shipCarrier ?? o.shipCarrierId,
          trackingCode: opt(o.trackingCode),
          trackingUrl: opt(o.trackingUrl),
          cost: opt(o.shipCost),
          at: o.shippedAt?.toISOString() ?? '',
        }
      : undefined,
    shippingCost: opt(o.shippingCost),
    deliveryAttempts: opt(o.deliveryAttempts),
    deliveryIssue: opt(o.deliveryIssue),
    returnCondition: opt(o.returnCondition),
    returnNote: opt(o.returnNote),
    resendFee: opt(o.resendFee),
    materialCost: opt(o.materialCost),
    complaints: o.complaints.length
      ? o.complaints.map((c) => ({
          id: local(o.id, c.id),
          reason: c.reason,
          images: c.images,
          resolution: c.resolution,
          refundAmount: opt(c.refundAmount),
          replacementId: opt(c.replacementId),
          replacementCode: opt(c.replacementCode),
          at: c.at.toISOString(),
          by: c.by,
        }))
      : undefined,
    replacementFor: o.replacementForId ? { id: o.replacementForId, code: o.replacementForCode ?? '' } : undefined,
    history: o.events.map((e) => ({ at: e.at.toISOString(), ...(e.kind && { kind: e.kind }), status: e.status, note: opt(e.note), by: e.by })),
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  };
}
export type OrderDto = ReturnType<typeof orderDto>;

type Tx = Prisma.TransactionClient;
export type EventKind = 'status' | 'payment' | 'schedule' | 'delivery' | 'edit' | 'complaint';
type Status = Order['status'];

// Ghi một dòng lịch sử, nối vào cuối
export async function addEvent(tx: Tx, orderId: string, e: { status: Status; note?: string | null; kind?: EventKind; by: string; at?: Date }) {
  const sortOrder = await tx.orderEvent.count({ where: { orderId } });
  await tx.orderEvent.create({ data: { orderId, sortOrder, at: e.at ?? new Date(), kind: e.kind ?? 'status', status: e.status, note: e.note || null, by: e.by } });
}

// Mã tạm theo thời gian: "mf3k2a9"
export const stamp = () => Date.now().toString(36);
