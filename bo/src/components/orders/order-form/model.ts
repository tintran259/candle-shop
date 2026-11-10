// Kiểu và hằng dùng chung của form Tạo / Sửa đơn (order-create-drawer.tsx)
import dayjs, { type Dayjs } from "dayjs";
import { toLines, type DraftLine, type OrderChannel } from "@/lib/orders/create";
import type { Order, PaymentPlan, PaymentProvider, ShippingMethod } from "@/lib/orders/types";

// Hồ sơ khách vãng lai cho số điện thoại chưa có hồ sơ (sửa đơn đổi sang số mới)
export const guestProfile = (v: { name: string; phone: string; email?: string }) => ({
  id: `cus-${Date.now().toString(36)}`,
  name: v.name.trim(),
  phone: v.phone.trim(),
  email: v.email ?? "",
  hasAccount: false,
  newsletter: false,
  tags: [],
  blocked: false,
  createdAt: new Date().toISOString(),
});

export type OrderFormValues = {
  customerId?: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  channel: OrderChannel;
  lines: DraftLine[];
  shippingMethod: ShippingMethod;
  carrierId?: string;
  shippingFee?: number;
  readyDate: Dayjs;
  discountCode?: string;
  paymentPlan: PaymentPlan;
  // % cọc của đơn này (điền sẵn theo Cài đặt), chỉ dùng khi Cọc
  depositPercent?: number;
  paymentMethod: PaymentProvider;
  received: boolean;
  transactionId?: string;
  note?: string;
  internalNote?: string;
};

// Lọc lựa chọn Select theo chuỗi search (không dấu)
export const searchFilter = (fold: (s: string) => string) => (input: string, o?: unknown) => fold((o as { search?: string })?.search ?? "").includes(fold(input.trim()));

// Sửa đơn: giá trị form ban đầu lấy từ đơn đã tạo
export const fromOrder = (order: Order): Partial<OrderFormValues> => ({
  name: order.customer.name,
  phone: order.customer.phone,
  email: order.customer.email,
  address: order.shippingAddress,
  lines: toLines(order.items),
  shippingMethod: order.shippingMethod,
  carrierId: order.shipment?.carrierId ?? order.carrier?.id,
  shippingFee: order.shippingFee,
  readyDate: dayjs(order.readyDate),
  discountCode: order.discountCode,
  paymentPlan: order.paymentPlan,
  depositPercent: order.depositPercent,
  paymentMethod: order.paymentMethod,
  note: order.note,
  internalNote: order.internalNote,
});
