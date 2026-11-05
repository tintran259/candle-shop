import { useMemo } from "react";
import { fromOrder } from "@/lib/cancelled/labels";
import type { CancelledProduct } from "@/lib/cancelled/types";
import { createLocalStore, useLocalStore } from "@/lib/local-store";
import type { Order } from "@/lib/orders/types";

// Chưa có API: lưu tạm trên trình duyệt. Khi có BE: GET/PATCH /api/admin/cancelled-products,
// bản ghi do BE tạo trong cùng transaction hủy đơn (xem docs/inventory.md mục 7).
// v3: mỗi dòng nến tự phối một bản ghi kèm số lượng, không còn nến có sẵn
const store = createLocalStore<CancelledProduct[]>("bo-cancelled-products-v4", []);

// Hủy đơn đã làm: thêm nến tự phối vào danh sách. Trả về số sản phẩm vừa thêm
export const addFromOrder = (order: Order, reason: string) => {
  const list = store.get();
  const added = fromOrder(order, reason, new Date().toISOString()).filter((c) => !list.some((x) => x.id === c.id));
  store.set([...added, ...list]);
  return added.length;
};

const save = (id: string, changes: Partial<CancelledProduct>) =>
  store.set(store.get().map((c) => (c.id === id ? { ...c, ...changes, updatedAt: new Date().toISOString() } : c)));

const reset = () => store.set(null);

export function useCancelledProducts() {
  const { data: items, loading } = useLocalStore(store);
  return useMemo(() => ({ items, loading, save, reset }), [items, loading]);
}

export type CancelledApi = ReturnType<typeof useCancelledProducts>;
