import { useMemo } from "react";
import { fromOrder } from "@/lib/cancelled/labels";
import type { CancelledProduct } from "@/lib/cancelled/types";
import { api } from "@/lib/api";
import { createLocalStore, upsert, useLocalStore } from "@/lib/local-store";
import type { Order } from "@/lib/orders/types";

// Sản phẩm hủy đơn: GET / PATCH /api/admin/cancelled-products (docs/api.md#sản-phẩm-hủy-đơn).
// Chế độ BE: bản ghi do BE tạo khi hủy đơn đã làm. Lưu trên trình duyệt: v3 — mỗi dòng nến tự phối một bản ghi kèm số lượng
const store = createLocalStore<CancelledProduct[]>("bo-cancelled-products-v4", [], undefined, () => api<CancelledProduct[]>("GET", "/admin/cancelled-products"));

// Hủy đơn đã làm: thêm nến tự phối vào danh sách. Trả về số sản phẩm vừa thêm
export const addFromOrder = (order: Order, reason: string) => {
  const list = store.get();
  const added = fromOrder(order, reason, new Date().toISOString()).filter((c) => !list.some((x) => x.id === c.id));
  store.set([...added, ...list]);
  return added.length;
};

// Chỉ đổi trạng thái: bỏ, hoặc đã tạo sản phẩm trưng bày (kèm displayProductId)
const save = (id: string, changes: Pick<CancelledProduct, "status"> & Partial<Pick<CancelledProduct, "displayProductId">>) =>
  store.sync(
    store.get().map((c) => (c.id === id ? { ...c, ...changes, updatedAt: new Date().toISOString() } : c)),
    async () => upsert(await api<CancelledProduct>("PATCH", `/admin/cancelled-products/${id}`, { status: changes.status, displayProductId: changes.displayProductId })),
  );

const reset = () => store.set(null);
// Tải lại từ BE (sau khi hủy đơn đã làm)
export const reloadCancelled = () => store.reload();

export function useCancelledProducts() {
  const { data: items, loading } = useLocalStore(store);
  return useMemo(() => ({ items, loading, save, reset }), [items, loading]);
}
