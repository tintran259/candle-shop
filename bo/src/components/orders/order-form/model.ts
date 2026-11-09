// Kiểu và hằng dùng chung của form Tạo / Sửa đơn (order-create-drawer.tsx)
import type { Dayjs } from "dayjs";
import type { DraftLine, OrderChannel } from "@/lib/orders/create";
import type { PaymentPlan, PaymentProvider, ShippingMethod } from "@/lib/orders/types";

export const STAFF = "Admin 2510";

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
