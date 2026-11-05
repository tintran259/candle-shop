import { formatMoney } from "@/lib/format";
import { itemCount, remaining } from "@/lib/orders/labels";
import type { Order, Shipment } from "@/lib/orders/types";

// "Giao Hàng Nhanh · mã vận đơn GHN123"
export const shipmentText = (s: Shipment) => (s.trackingCode ? `${s.carrier} · mã vận đơn ${s.trackingCode}` : s.carrier);
// Ghi lịch sử: kèm phí trả đơn vị vận chuyển
export const shipmentNote = (s: Shipment) => (s.cost !== undefined ? `${shipmentText(s)} · phí vận chuyển ${formatMoney(s.cost)}` : shipmentText(s));

// Đơn vị vận chuyển của đơn: đã giao thì theo lượt giao, chưa giao thì đơn vị chọn lúc tạo đơn
export const carrierName = (o: Order) => o.shipment?.carrier ?? o.carrier?.name;

// Tổng phí trả đơn vị vận chuyển so với phí khách trả: dương = shop chịu thêm, âm = shop dư
export const shippingGap = (customerFee: number, carrierCost: number) => Math.round(carrierCost) - Math.round(customerFee);

// Mã vận đơn: bỏ khoảng trắng, viết hoa
export const normalizeTrackingCode = (s = "") => s.replace(/\s+/g, "").toUpperCase();

// Đơn khác (chưa hủy) đang dùng cùng mã vận đơn
export const trackingOwner = (orders: Order[], code: string, selfId?: string) =>
  code ? orders.find((o) => o.id !== selfId && o.status !== "cancelled" && o.shipment?.trackingCode === code) : undefined;

// Tiền đơn vị vận chuyển thu hộ khi giao: phần khách còn phải trả
export const codAmount = (o: Order) => remaining(o);

// "3 sản phẩm: 2× Moon Morning, 1× Nến tự phối"
export const itemsSummary = (o: Order) => `${itemCount(o)} sản phẩm: ${o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}`;
