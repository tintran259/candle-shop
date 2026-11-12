import { useMemo } from "react";
import { api } from "@/lib/api";
import { createLocalStore, upsert, useLocalStore } from "@/lib/local-store";
import type { Product } from "@/lib/products/types";

// Sản phẩm trưng bày: /api/admin/products (docs/api.md#sản-phẩm-trưng-bày).
// Bản lưu cũ trên trình duyệt dùng aromaType (fruits/nature/parfum) — chính là id danh mục mặc định
const migrate = (list: Product[]) =>
  list.map((p) => {
    const { aromaType, ...rest } = p as Product & { aromaType?: string };
    return p.categoryId ? p : { ...rest, categoryId: aromaType ?? "" };
  });
const store = createLocalStore<Product[]>("bo-products-v2", [], migrate, () => api<Product[]>("GET", "/admin/products"));

const today = () => new Date().toISOString().slice(0, 10);

// Thao tác chỉ đụng tới store nên để ngoài hook — giữ nguyên tham chiếu, bảng memo không phải render lại.
// Thêm mới hoặc thay sản phẩm cùng id; trả false khi bộ nhớ trình duyệt đầy (chế độ lưu trên trình duyệt)
const save = (product: Product) => {
  const exists = store.get().some((p) => p.id === product.id);
  const next = { ...product, updatedAt: today() };
  return store.sync(upsert(next, true)(store.get()), async () => upsert(await api<Product>(exists ? "PUT" : "POST", exists ? `/admin/products/${product.id}` : "/admin/products", product), true));
};

// Bật / tắt bán, nổi bật, nhãn Mới cho một hoặc nhiều sản phẩm
const patch = (ids: string[], changes: Partial<Pick<Product, "status" | "isNew" | "isFeatured">>) =>
  store.sync(
    store.get().map((p) => (ids.includes(p.id) ? { ...p, ...changes, updatedAt: today() } : p)),
    async () => {
      const saved = await api<Product[]>("PATCH", "/admin/products", { ids, ...changes });
      return (list) => saved.reduce((acc, p) => upsert(p)(acc), list);
    },
  );

const remove = (ids: string[]) =>
  store.sync(
    store.get().filter((p) => !ids.includes(p.id)),
    () => api("POST", "/admin/products/delete", { ids }),
  );
const reset = () => store.set(null);

// Concept bị xóa: gỡ khỏi các sản phẩm (BE tự gỡ — chỉ cập nhật bản đang hiển thị / bản lưu trên trình duyệt)
export const forgetConcept = (id: string) => store.set(store.get().map((p) => (p.conceptIds?.includes(id) ? { ...p, conceptIds: p.conceptIds.filter((c) => c !== id) } : p)));

export function useProducts() {
  const { data: products, loading } = useLocalStore(store);
  return useMemo(() => ({ products, loading, save, patch, remove, reset }), [products, loading]);
}

export type ProductsApi = ReturnType<typeof useProducts>;
