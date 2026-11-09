import { useMemo } from "react";
import { api } from "@/lib/api";
import { REMOTE } from "@/lib/data-mode";
import { createLocalStore, upsert, useLocalStore } from "@/lib/local-store";
import { defaultCategories, UNCATEGORIZED, type Category } from "@/lib/products/categories";

// Danh mục: /api/admin/categories (docs/api.md#danh-mục)
const store = createLocalStore<Category[]>("bo-categories-v1", REMOTE ? [] : defaultCategories, undefined, () => api<Category[]>("GET", "/admin/categories"));

// Thao tác chỉ đụng tới store nên để ngoài hook — giữ nguyên tham chiếu, bảng memo không phải render lại
const save = (category: Category) => {
  const exists = store.get().some((c) => c.id === category.id);
  return store.sync(upsert(category)(store.get()), async () => {
    const { id, name, color, hidden } = category;
    const saved = await (exists ? api<Category>("PATCH", `/admin/categories/${id}`, { name, color, hidden }) : api<Category>("POST", "/admin/categories", { id, name, color, hidden }));
    return upsert(saved);
  });
};

const patch = (id: string, changes: Partial<Category>) =>
  store.sync(
    store.get().map((c) => (c.id === id ? { ...c, ...changes } : c)),
    async () => upsert(await api<Category>("PATCH", `/admin/categories/${id}`, changes)),
  );

// Kéo thả: đưa danh mục id vào vị trí của danh mục to
const move = (id: string, to: string) => {
  const list = store.get();
  const i = list.findIndex((c) => c.id === id);
  const j = list.findIndex((c) => c.id === to);
  if (i < 0 || j < 0 || i === j) return true;
  const next = [...list];
  next.splice(j, 0, ...next.splice(i, 1));
  return store.sync(next, async () => {
    const saved = await api<Category[]>("PUT", "/admin/categories/order", { ids: next.map((c) => c.id) });
    return () => saved;
  });
};

// Trang gọi chỉ khi danh mục không còn sản phẩm nào
const remove = (id: string) =>
  store.sync(
    store.get().filter((c) => c.id !== id),
    () => api("DELETE", `/admin/categories/${id}`),
  );
const reset = () => store.set(null);

export function useCategories() {
  const { data: categories, loading } = useLocalStore(store);
  return useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    // Tên hiển thị; id đã bị xóa (dữ liệu cũ) thì báo chưa phân loại
    const label = (id?: string) => (id && byId.get(id)?.name.vi) || UNCATEGORIZED;
    return { categories, loading, byId, label, save, patch, move, remove, reset };
  }, [categories, loading]);
}

export type CategoriesApi = ReturnType<typeof useCategories>;
