import { useMemo } from "react";
import { createLocalStore, useLocalStore } from "@/lib/local-store";
import type { DraftLine } from "@/lib/orders/create";

// Đơn đang tạo dở trong form Tạo đơn hàng (docs/pages/orders.md#đơn-nháp). Một bản nháp cho cả BO, lưu trên trình duyệt này.
// values: giá trị form, ngày làm xong dạng "YYYY-MM-DD". Không giữ nguyên liệu, không tính lượt mã giảm giá
export type OrderDraft = {
  savedAt: string;
  values: { name?: string; phone?: string; address?: string; lines?: DraftLine[]; readyDate?: string } & Record<string, unknown>;
};

const store = createLocalStore<OrderDraft | null>("bo-order-draft-v1", null);

// Đọc ngay lúc mở form (không chờ tải)
export const getOrderDraft = () => store.get();
// null = xóa nháp
export const saveOrderDraft = (draft: OrderDraft | null) => store.set(draft);

// Có gì để giữ: tên, SĐT, địa chỉ, sản phẩm hoặc ghi chú
export const draftHasContent = (v: OrderDraft["values"]) =>
  !!(v.name?.trim() || v.phone?.trim() || v.address?.trim() || v.lines?.some(Boolean) || (v.note as string | undefined)?.trim() || (v.internalNote as string | undefined)?.trim());

export function useOrderDraft() {
  const { data: draft } = useLocalStore<OrderDraft | null>(store);
  return useMemo(() => ({ draft, clear: () => store.set(null) }), [draft]);
}
