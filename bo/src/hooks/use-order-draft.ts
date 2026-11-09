import { useMemo } from "react";
import { api } from "@/lib/api";
import { createLocalStore, useLocalStore } from "@/lib/local-store";
import { notifyError } from "@/lib/notify";
import type { DraftLine } from "@/lib/orders/create";

// Đơn đang tạo dở trong form Tạo đơn hàng (docs/pages/orders.md#đơn-nháp). Một bản nháp cho cả BO:
// chế độ BE lưu ở /api/admin/order-draft (gửi sau khi ngừng gõ 1 giây), không thì trên trình duyệt này.
// values: giá trị form, ngày làm xong dạng "YYYY-MM-DD". Không giữ nguyên liệu, không tính lượt mã giảm giá
export type OrderDraft = {
  savedAt: string;
  values: { name?: string; phone?: string; address?: string; lines?: DraftLine[]; readyDate?: string } & Record<string, unknown>;
};

// BE trả rỗng khi không có nháp
const store = createLocalStore<OrderDraft | null>("bo-order-draft-v1", null, undefined, async () => {
  const d = await api<Partial<OrderDraft> | undefined>("GET", "/admin/order-draft");
  return d?.values ? (d as OrderDraft) : null;
});

let timer: ReturnType<typeof setTimeout> | undefined;
const push = (draft: OrderDraft | null) => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    (draft ? api("PUT", "/admin/order-draft", { values: draft.values }) : api("DELETE", "/admin/order-draft")).catch((e: Error) => notifyError(`Chưa lưu được đơn nháp: ${e.message}`));
  }, 1000);
};

// Đọc ngay lúc mở form (không chờ tải)
export const getOrderDraft = () => store.get();
// null = xóa nháp
export const saveOrderDraft = (draft: OrderDraft | null) => {
  const ok = store.set(draft);
  if (store.online) push(draft);
  return ok;
};

// Có gì để giữ: tên, SĐT, địa chỉ, sản phẩm hoặc ghi chú
export const draftHasContent = (v: OrderDraft["values"]) =>
  !!(v.name?.trim() || v.phone?.trim() || v.address?.trim() || v.lines?.some(Boolean) || (v.note as string | undefined)?.trim() || (v.internalNote as string | undefined)?.trim());

export function useOrderDraft() {
  const { data: draft } = useLocalStore<OrderDraft | null>(store);
  return useMemo(() => ({ draft, clear: () => saveOrderDraft(null) }), [draft]);
}
