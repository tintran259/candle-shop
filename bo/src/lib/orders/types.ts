import type { CraftSelection } from "@/lib/craft/selection";

// Đơn hàng — dựa theo bảng Order/OrderItem/Payment bên BE (Prisma) và luồng đặt hàng của web
// (làm theo đơn 2–3 ngày, khách chọn cọc 50% hoặc trả đủ qua VNPay/MoMo).
// Tiền là VNĐ, số nguyên.

// Quy trình làm theo đơn. BE hiện chỉ có PENDING/PAID/SHIPPING/COMPLETED/CANCELLED —
// cần thêm PRODUCING và READY khi nối API.
export const orderFlow = ["pending", "paid", "producing", "ready", "shipping", "completed"] as const;
export type OrderStatus = (typeof orderFlow)[number] | "cancelled";

export type PaymentPlan = "full" | "deposit";
export type PaymentProvider = "vnpay" | "momo" | "cod";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";
export type ShippingMethod = "standard" | "express";

export type OrderItem = {
  id: string;
  // Nến có sẵn mẫu thì có productId; nến tự phối (Thủ công) thì có custom
  productId?: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  // Mô tả cấu hình nến tự phối, vd "Hũ gốm · 150g · Sáp đậu nành · Vanilla 70% + Lavender 30%"
  custom?: string;
  // Lựa chọn từng bước của nến tự phối (bản chụp CraftSelection) — để xưởng làm đúng & BE trừ kho
  craft?: CraftSelection;
};

export type Payment = {
  id: string;
  provider: PaymentProvider;
  amount: number;
  status: PaymentStatus;
  // Mã giao dịch VNPay (vnp_TransactionNo) / MoMo (transId)
  transactionId?: string;
  createdAt: string;
};

export type OrderEvent = {
  at: string;
  // status = đổi trạng thái; payment = thu tiền; schedule = đổi ngày làm xong. Bỏ trống = status
  kind?: "status" | "payment" | "schedule";
  // Trạng thái đơn tại thời điểm xảy ra sự kiện
  status: OrderStatus;
  note?: string;
  // Ai thao tác: "Hệ thống" hoặc tên nhân viên
  by: string;
};

export type Order = {
  id: string;
  code: string;
  status: OrderStatus;
  customer: { name: string; email: string; phone: string };
  shippingAddress: string;
  shippingMethod: ShippingMethod;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  discountCode?: string;
  shippingFee: number;
  total: number;
  paymentPlan: PaymentPlan;
  // Đơn trên web: VNPay / MoMo. Đơn tạo tại BO có thể là tiền mặt / chuyển khoản (cod)
  paymentMethod: PaymentProvider;
  payments: Payment[];
  // Ngày xưởng làm xong khách đã chọn (YYYY-MM-DD)
  readyDate: string;
  // Ghi chú của khách / ghi chú nội bộ của shop
  note?: string;
  internalNote?: string;
  cancelReason?: string;
  history: OrderEvent[];
  createdAt: string;
  updatedAt: string;
};
