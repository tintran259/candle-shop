// Dữ liệu mẫu cho test: app bắt đầu không có đơn, sản phẩm trưng bày, sản phẩm hủy đơn.
// Bộ khung test (harness.mjs) nạp các mẫu này khi khóa còn trống, để các kịch bản viết trên dữ liệu mẫu cũ chạy như trước.
import { sampleCancelled } from "@/lib/cancelled/sample";
import { sampleOrders } from "@/lib/orders/sample";
import { sampleProducts } from "@/lib/products/sample";

export { sampleCancelled, sampleOrders, sampleProducts };

// { khóa localStorage: JSON }
export const sampleStorage: Record<string, string> = {
  "bo-orders-v4": JSON.stringify(sampleOrders),
  "bo-products-v2": JSON.stringify(sampleProducts),
  "bo-cancelled-products-v4": JSON.stringify(sampleCancelled),
};
