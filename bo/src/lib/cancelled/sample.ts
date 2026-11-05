// ⚠️ MẪU CHO TEST — lấy từ các đơn đã hủy trong đơn mẫu. App bắt đầu trống.
import { fromOrder } from "@/lib/cancelled/labels";
import type { CancelledProduct } from "@/lib/cancelled/types";
import { sampleOrders } from "@/lib/orders/sample";

export const sampleCancelled: CancelledProduct[] = sampleOrders.filter((o) => o.status === "cancelled").flatMap((o) => fromOrder(o, o.cancelReason ?? "", o.updatedAt));
