// Đơn hàng ở chế độ BE (docs/api.md#đơn-hàng): đổi dữ liệu BO đang dùng sang dữ liệu gửi lên API.
// BE tự làm các việc đi kèm (giữ / trừ / hoàn Kho, lượt mã giảm giá, hồ sơ khách, sản phẩm hủy đơn), BO không làm lại
import { api } from "@/lib/api";
import { boChannel, channelLabels, type OrderChannel } from "@/lib/orders/create";
import type { EditOrderInput } from "@/lib/orders/edit";
import type { Order, OrderItem, Shipment } from "@/lib/orders/types";

const line = (i: OrderItem) =>
  i.custom
    ? { kind: "custom", custom: i.custom, craft: i.craft, recipe: i.recipe ?? [], price: i.price, quantity: i.quantity }
    : { kind: "product", productId: i.productId, name: i.name, image: i.image, price: i.price, quantity: i.quantity };

// "Tạo đơn tại BO · Zalo" → "zalo"
const channelOf = (o: Order): OrderChannel => {
  const label = boChannel(o.history[0]?.note);
  return (Object.entries(channelLabels).find(([, l]) => l === label)?.[0] as OrderChannel | undefined) ?? "other";
};

// Đơn BO vừa dựng (buildOrder) → POST /admin/orders. Khách bị chặn đã được admin xác nhận "Vẫn tạo đơn" trước đó
export const createOrder = (o: Order) =>
  api<{ order: Order }>("POST", "/admin/orders", {
    id: o.id,
    customer: o.customer,
    shippingAddress: o.shippingAddress,
    shippingMethod: o.shippingMethod,
    shippingFee: o.shippingFee,
    carrierId: o.carrier?.id,
    lines: o.items.map(line),
    discountCode: o.discountCode,
    paymentPlan: o.paymentPlan,
    depositPercent: o.depositPercent,
    paymentMethod: o.paymentMethod,
    received: o.status === "paid",
    transactionId: o.payments[0]?.transactionId,
    readyDate: o.readyDate,
    channel: channelOf(o),
    note: o.note,
    internalNote: o.internalNote,
    allowBlocked: true,
  });

export const editOrder = (id: string, input: EditOrderInput) =>
  api<{ order: Order; changes: string[] }>("PUT", `/admin/orders/${id}`, {
    customer: input.customer,
    shippingAddress: input.shippingAddress,
    shippingMethod: input.shipping?.id,
    carrierId: input.carrier?.id,
    shippingFee: Math.max(0, Math.round(input.shippingFee)),
    readyDate: input.readyDate,
    ...(input.lines && {
      lines: input.lines.map((l) =>
        line({
          id: "",
          productId: l.kind === "product" ? l.productId : undefined,
          name: l.name ?? "",
          image: l.image,
          price: Math.round(l.price ?? 0),
          quantity: Math.round(l.quantity ?? 1),
          custom: l.kind === "custom" ? l.custom : undefined,
          craft: l.craft,
          recipe: l.recipe,
        }),
      ),
      discountCode: input.discount?.discount?.code ?? "",
    }),
    note: input.note ?? "",
    internalNote: input.internalNote ?? "",
  });

export const shipBody = (s: Shipment) => ({ carrierId: s.carrierId, trackingCode: s.trackingCode, cost: s.cost });

// Thao tác đổi trạng thái / giao hàng / hoàn tiền: trả đơn sau khi đổi
export const orderAction = (id: string, method: "POST" | "PUT" | "PATCH", action: string, body?: object) => api<Order>(method, `/admin/orders/${id}/${action}`, body);
