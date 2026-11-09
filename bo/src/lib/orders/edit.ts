// Sửa đơn sau khi tạo (docs/pages/orders.md#sửa-đơn). Trước khi Bắt đầu làm sửa được cả sản phẩm;
// sau đó nguyên liệu đã trừ Kho nên chỉ còn sửa liên hệ, địa chỉ, giao hàng, ghi chú.
import dayjs from "dayjs";
import { formatMoney } from "@/lib/format";
import { depositAmount, toItems, type DiscountResult, type DraftLine, lineTotal } from "@/lib/orders/create";
import type { Order, OrderStatus } from "@/lib/orders/types";
import { shippingOptionLabel, type Carrier, type ShippingOption } from "@/lib/settings/types";

export const itemsEditable = (s: OrderStatus) => s === "pending" || s === "paid";
export const orderEditable = (s: OrderStatus) => s !== "completed" && s !== "cancelled";

export type EditOrderInput = {
  customer: Order["customer"];
  shippingAddress: string;
  // Đổi phương thức giao; bỏ trống = giữ nguyên
  shipping?: ShippingOption;
  // Đổi đơn vị vận chuyển dự kiến; chỉ khi chưa giao cho vận chuyển
  carrier?: Carrier;
  shippingFee: number;
  readyDate: string;
  // Chỉ dùng khi còn sửa được sản phẩm
  lines?: DraftLine[];
  discount?: DiscountResult;
  note?: string;
  internalNote?: string;
};

const itemsText = (o: Pick<Order, "items">) => o.items.map((i) => `${i.name} ×${i.quantity}`).join(", ");
const clean = (s?: string) => s?.trim() || undefined;

// Trả về đơn sau khi sửa và danh sách thay đổi (ghi vào lịch sử). Không có thay đổi thì changes rỗng
export function applyEdit(order: Order, input: EditOrderInput, by: string, at = dayjs()): { order: Order; changes: string[] } {
  const canItems = itemsEditable(order.status) && !!input.lines;
  const items = canItems ? toItems(input.lines!, at.valueOf().toString(36)) : order.items;
  const subtotal = canItems ? input.lines!.reduce((s, l) => s + lineTotal(l), 0) : order.subtotal;
  const discount = canItems ? (input.discount?.amount ?? 0) : order.discount;
  const discountCode = canItems ? input.discount?.discount?.code : order.discountCode;
  const shippingFee = Math.max(0, Math.round(input.shippingFee));
  const total = Math.max(0, subtotal - discount + shippingFee);
  const shipping = input.shipping && input.shipping.id !== order.shippingMethod ? input.shipping : undefined;
  const carrier = !order.shipment && input.carrier && input.carrier.id !== order.carrier?.id ? { id: input.carrier.id, name: input.carrier.name } : undefined;

  const next: Order = {
    ...order,
    customer: { name: input.customer.name.trim(), phone: input.customer.phone.trim(), email: input.customer.email.trim() },
    shippingAddress: input.shippingAddress.trim(),
    ...(shipping && { shippingMethod: shipping.id, shippingName: shippingOptionLabel(shipping), shippingDays: shipping.days }),
    ...(carrier && { carrier }),
    items,
    subtotal,
    discount,
    discountCode,
    shippingFee,
    total,
    readyDate: input.readyDate,
    note: clean(input.note),
    internalNote: clean(input.internalNote),
    // Chưa thanh toán: khoản đang chờ thu đổi theo tổng mới (cọc theo % lúc tạo đơn)
    payments:
      order.status === "pending"
        ? order.payments.map((p) =>
            p.status === "pending" && order.paymentPlan !== "later"
              ? { ...p, amount: order.paymentPlan === "deposit" ? depositAmount(Math.max(0, subtotal - discount), order.depositPercent ?? 50) : total }
              : p,
          )
        : order.payments,
  };

  const changes: string[] = [];
  const diff = (label: string, before: unknown, after: unknown, show = true) => {
    if (before !== after) changes.push(show && after !== undefined && after !== "" ? `${label}: ${after}` : label);
  };
  diff("Tên khách", order.customer.name, next.customer.name);
  diff("Số điện thoại", order.customer.phone, next.customer.phone);
  diff("Email", order.customer.email, next.customer.email);
  diff("Địa chỉ giao", order.shippingAddress, next.shippingAddress);
  if (shipping) changes.push(`Giao hàng: ${next.shippingName}`);
  if (carrier) changes.push(`Đơn vị vận chuyển: ${carrier.name}`);
  if (shippingFee !== order.shippingFee) changes.push(`Phí giao: ${formatMoney(shippingFee)}`);
  if (order.readyDate !== next.readyDate) changes.push(`Ngày làm xong: ${next.readyDate.split("-").reverse().join("/")}`);
  if (canItems && itemsText(order) !== itemsText(next)) changes.push(`Sản phẩm: ${itemsText(next)}`);
  else if (canItems && JSON.stringify(order.items.map((i) => [i.price, i.custom, i.recipe])) !== JSON.stringify(next.items.map((i) => [i.price, i.custom, i.recipe])))
    changes.push("Cấu hình sản phẩm");
  if ((order.discountCode ?? "") !== (next.discountCode ?? "")) changes.push(next.discountCode ? `Mã giảm giá: ${next.discountCode}` : "Bỏ mã giảm giá");
  diff("Ghi chú của khách", order.note, next.note, false);
  diff("Ghi chú nội bộ", order.internalNote, next.internalNote, false);
  if (total !== order.total) changes.push(`Tổng ${formatMoney(order.total)} → ${formatMoney(total)}`);

  if (!changes.length) return { order, changes };
  return {
    order: { ...next, history: [...order.history, { at: at.toISOString(), kind: "edit", status: order.status, note: `Sửa đơn · ${changes.join(" · ")}`, by }] },
    changes,
  };
}
