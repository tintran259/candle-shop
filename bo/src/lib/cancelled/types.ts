// Nến thủ công đã làm xong nhưng đơn bị hủy — chỉ quản lý ở BO, không hiện trên web.
// Mỗi dòng nến tự phối trong đơn là một bản ghi, kèm số lượng. Nến có sẵn đã có ở Sản phẩm trưng bày nên không vào đây.

import type { RecipeLine } from "@/lib/products/types";

// pending = chưa xử lý, converted = đã tạo sản phẩm trưng bày, discarded = đã bỏ
export const cancelledStatuses = ["pending", "converted", "discarded"] as const;
export type CancelledStatus = (typeof cancelledStatuses)[number];

export type CancelledProduct = {
  id: string;
  name: string;
  // Mô tả cấu hình nến tự phối
  custom?: string;
  // Công thức 1 hũ, để điền sẵn khi tạo sản phẩm trưng bày
  recipe?: RecipeLine[];
  // Có chữ riêng của khách (khắc tên, lời nhắn) — khó bán lại
  personalized: boolean;
  // Ảnh đầu tiên là ảnh chính
  images: string[];
  // Giá một cây khách đặt, VNĐ
  price: number;
  quantity: number;
  orderId: string;
  orderCode: string;
  customerName: string;
  cancelReason: string;
  cancelledAt: string;
  status: CancelledStatus;
  // Sản phẩm trưng bày được tạo từ bản ghi này (status = converted)
  displayProductId?: string;
  updatedAt: string;
};
