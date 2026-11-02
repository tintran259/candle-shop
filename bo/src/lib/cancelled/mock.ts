// ⚠️ DỮ LIỆU MẪU — lấy từ các đơn đã hủy trong dữ liệu mẫu của trang Đơn hàng.
import { fromOrder } from "@/lib/cancelled/labels";
import type { CancelledProduct } from "@/lib/cancelled/types";
import { mockOrders } from "@/lib/orders/mock";

export const mockCancelled: CancelledProduct[] = mockOrders.filter((o) => o.status === "cancelled").flatMap((o) => fromOrder(o, o.cancelReason ?? "", o.updatedAt));
