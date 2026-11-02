import type { CraftSelection } from "@/lib/craft/selection";
import type { RecipeLine } from "@/lib/products/types";

// Đơn hàng — dựa theo bảng Order/OrderItem/Payment bên BE (Prisma) và luồng đặt hàng của web
// (làm theo đơn 2–3 ngày, khách chọn đặt cọc hoặc trả đủ qua VNPay/MoMo).
// Tiền là VNĐ, số nguyên.

// Quy trình làm theo đơn. BE hiện chỉ có PENDING/PAID/SHIPPING/COMPLETED/CANCELLED —
// cần thêm PRODUCING và READY khi nối API.
export const orderFlow = ["pending", "paid", "producing", "ready", "shipping", "completed"] as const;
// delivery_failed, returning, returned: nhánh giao hàng lỗi, nằm ngoài luồng chính
export const deliveryIssues = ["delivery_failed", "returning", "returned"] as const;
export type OrderStatus = (typeof orderFlow)[number] | (typeof deliveryIssues)[number] | "cancelled";

export type PaymentPlan = "full" | "deposit";
export type PaymentProvider = "vnpay" | "momo" | "cod";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";
// id phương thức trong Cài đặt
export type ShippingMethod = string;

// Nến khi hủy đơn đã bắt đầu làm: returned = chưa làm, hoàn nguyên liệu; stocked = đã làm, chuyển sang Sản phẩm hủy đơn;
// consumed = đã làm, đơn toàn nến có sẵn nên không hoàn và không tạo gì
export type CancelOutcome = "returned" | "stocked" | "consumed";
// Lỗi do ai: quyết định số tiền hoàn khi hủy đơn đã thu tiền
export type CancelFault = "customer" | "shop";
// Tình trạng nến khi hàng hoàn về shop
export type ReturnCondition = "good" | "damaged";

// Khoản đã hoàn cho khách, images là ảnh chứng từ
export type Refund = { amount: number; images: string[]; note?: string; at: string; by: string };

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
  // Công thức 1 hũ của nến tự phối lúc tạo đơn, gồm lượng admin tự điền
  recipe?: RecipeLine[];
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
  // status = đổi trạng thái; payment = thu tiền; schedule = đổi ngày làm xong; delivery = giao lại, gửi lại. Bỏ trống = status
  kind?: "status" | "payment" | "schedule" | "delivery";
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
  // Giá trị lúc tạo đơn — đổi Cài đặt không ảnh hưởng đơn cũ. Đơn trước khi có Cài đặt không có các trường này
  shippingName?: string;
  shippingDays?: number;
  depositPercent?: number;
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
  cancelOutcome?: CancelOutcome;
  cancelFault?: CancelFault;
  // Số tiền phải hoàn lúc hủy, chưa hoàn thì chưa có refund
  refundDue?: number;
  refund?: Refund;
  // Số lần giao không thành của lượt giao hiện tại, gửi lại đơn thì đếm lại
  deliveryAttempts?: number;
  // Lý do lần giao không thành gần nhất
  deliveryIssue?: string;
  returnCondition?: ReturnCondition;
  returnNote?: string;
  // Tổng phí gửi lại đã cộng vào shippingFee và total
  resendFee?: number;
  history: OrderEvent[];
  createdAt: string;
  updatedAt: string;
};
