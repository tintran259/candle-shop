// Mã giảm giá. BE chưa có bảng này — cần thêm model Discount khi nối API (POST /api/discounts/validate lúc checkout).
// Tiền là VNĐ, số nguyên.

export type DiscountType = "percent" | "fixed" | "freeship";
// Áp dụng cho: mọi sản phẩm / chỉ nến có sẵn / chỉ nến tự phối (Thủ công)
export type DiscountScope = "all" | "products" | "custom";

export type Discount = {
  id: string;
  // Viết hoa, không dấu, không khoảng trắng — khách gõ không phân biệt hoa thường
  code: string;
  description?: string;
  type: DiscountType;
  // percent: 1–100 (%); fixed: số tiền; freeship: bỏ qua
  value: number;
  // Mức giảm tối đa cho loại percent
  maxDiscount?: number;
  minOrder?: number;
  scope: DiscountScope;
  firstOrderOnly: boolean;
  // YYYY-MM-DD; endsAt bỏ trống = không hết hạn
  startsAt: string;
  endsAt?: string;
  // Bỏ trống = không giới hạn
  usageLimit?: number;
  perCustomerLimit?: number;
  // Số lượt đã dùng (BE đếm từ đơn đã thanh toán)
  used: number;
  // Shop tạm dừng thủ công
  active: boolean;
  createdAt: string;
};
