import { createLocalStore, useLocalStore } from "@/lib/local-store";
import { mockProducts } from "@/lib/products/mock";
import type { Product } from "@/lib/products/types";

// Chưa có API: lưu tạm trên trình duyệt. Khi có BE thay bằng /api/products (GET/POST/PATCH/DELETE).
const store = createLocalStore<Product[]>("bo-products-v1", mockProducts);

const today = () => new Date().toISOString().slice(0, 10);

export function useProducts() {
  const { data: products, loading } = useLocalStore(store);
  const update = (fn: (list: Product[]) => Product[]) => store.set(fn(store.get()));

  // Thêm mới hoặc thay sản phẩm cùng id; trả false khi bộ nhớ trình duyệt đầy
  const save = (product: Product) =>
    update((list) => {
      const next = { ...product, updatedAt: today() };
      return list.some((p) => p.id === product.id) ? list.map((p) => (p.id === product.id ? next : p)) : [next, ...list];
    });

  const patch = (ids: string[], changes: Partial<Product>) =>
    update((list) => list.map((p) => (ids.includes(p.id) ? { ...p, ...changes, updatedAt: today() } : p)));

  const remove = (ids: string[]) => update((list) => list.filter((p) => !ids.includes(p.id)));

  return { products, loading, save, patch, remove, reset: () => store.set(null) };
}

export type ProductsApi = ReturnType<typeof useProducts>;
