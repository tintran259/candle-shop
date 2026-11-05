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
  // Khoản hoàn một phần (thu dư sau khi sửa đơn, khiếu nại) là số âm, kind = "refund"
  amount: number;
  status: PaymentStatus;
  // Mã giao dịch VNPay (vnp_TransactionNo) / MoMo (transId)
  transactionId?: string;
  kind?: "refund";
  // Ảnh chứng từ và ghi chú của khoản hoàn
  images?: string[];
  note?: string;
  createdAt: string;
};

// Cách xử lý khiếu nại sau khi giao: gửi bù nến mới (đơn 0 ₫), hoàn một phần tiền, hoặc chỉ ghi nhận
export type ComplaintResolution = "resend" | "refund" | "none";

export type Complaint = {
  id: string;
  reason: string;
  // Ảnh khách gửi (nến vỡ, cháy lỗi…)
  images: string[];
  resolution: ComplaintResolution;
  refundAmount?: number;
  // Đơn gửi bù được tạo
  replacementId?: string;
  replacementCode?: string;
  at: string;
  by: string;
};

// Lượt giao hiện tại: đơn vị vận chuyển, mã vận đơn, link tra cứu (chụp lại lúc giao, đổi Cài đặt không ảnh hưởng).
// Gửi lại đơn đã hoàn về thì bỏ, lịch sử đơn vẫn ghi mã cũ
// cost: phí shop trả đơn vị vận chuyển cho lượt này
export type Shipment = { carrierId: string; carrier: string; trackingCode?: string; trackingUrl?: string; cost?: number; at: string };

export type OrderEvent = {
  at: string;
  // status = đổi trạng thái; payment = thu, hoàn tiền; schedule = đổi ngày làm xong; delivery = giao lại, gửi lại;
  // edit = sửa đơn; complaint = khiếu nại sau khi giao. Bỏ trống = status
  kind?: "status" | "payment" | "schedule" | "delivery" | "edit" | "complaint";
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
  // Đơn vị vận chuyển chọn lúc tạo đơn; lúc Giao cho vận chuyển chọn sẵn đơn vị này
  carrier?: { id: string; name: string };
  shipment?: Shipment;
  // Tổng phí shop đã trả đơn vị vận chuyển (mọi lượt giao, phí hoàn hàng) — chi phí, trừ vào lãi. Chưa giao thì không có
  shippingCost?: number;
  // Số lần giao không thành của lượt giao hiện tại, gửi lại đơn thì đếm lại
  deliveryAttempts?: number;
  // Lý do lần giao không thành gần nhất
  deliveryIssue?: string;
  returnCondition?: ReturnCondition;
  returnNote?: string;
  // Tổng phí gửi lại đã cộng vào shippingFee và total
  resendFee?: number;
  // Giá vốn nguyên liệu chốt lúc Bắt đầu làm (theo giá nhập lúc đó). Chưa làm thì tính ước tính từ công thức
  materialCost?: number;
  // Khiếu nại sau khi giao
  complaints?: Complaint[];
  // Đơn gửi bù cho đơn gốc này: giá 0 ₫, không tính vào số đơn, doanh thu, khách hàng
  replacementFor?: { id: string; code: string };
  history: OrderEvent[];
  createdAt: string;
  updatedAt: string;
};
