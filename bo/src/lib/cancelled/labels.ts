import type { CancelledProduct, CancelledStatus } from "@/lib/cancelled/types";
import type { Order } from "@/lib/orders/types";
import { fold } from "@/lib/search";

export const statusMeta: Record<CancelledStatus, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "gold" },
  converted: { label: "Đã tạo trưng bày", color: "green" },
  discarded: { label: "Đã bỏ", color: "default" },
};

// Đơn có nến thủ công thì mới có gì để hoàn kho hoặc chuyển sang Sản phẩm hủy đơn
export const hasCustomItems = (order: Order) => order.items.some((i) => i.custom);

// Mỗi dòng nến tự phối là một bản ghi; id cố định theo đơn để không sinh trùng
export function fromOrder(order: Order, reason: string, at: string): CancelledProduct[] {
  return order.items
    .filter((item) => item.custom)
    .map((item) => ({
      id: `${order.id}-${item.id}`,
      name: item.name,
      custom: item.custom,
      recipe: item.recipe,
      personalized: Object.values(item.craft ?? {}).some((s) => s.kind === "inputs" && Object.values(s.values).some((v) => v.trim())),
      images: item.image ? [item.image] : [],
      price: item.price,
      quantity: item.quantity,
      orderId: order.id,
      orderCode: order.code,
      customerName: order.customer.name,
      cancelReason: reason,
      cancelledAt: at,
      status: "pending" as const,
      updatedAt: at,
    }));
}

export type CancelledFilters = { q: string; status: CancelledStatus | "all" };
export const defaultFilters: CancelledFilters = { q: "", status: "all" };

// Mới hủy lên trước
export function applyFilters(items: CancelledProduct[], { q, status }: CancelledFilters) {
  const needle = fold(q.trim());
  return items
    .filter((c) => status === "all" || c.status === status)
    .filter((c) => !needle || [c.name, c.custom, c.orderCode, c.customerName].some((f) => f && fold(f).includes(needle)))
    .sort((a, b) => b.cancelledAt.localeCompare(a.cancelledAt));
}
