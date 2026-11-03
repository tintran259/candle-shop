import { useMemo } from "react";
import { createLocalStore, useLocalStore } from "@/lib/local-store";
import { defaultCategories, UNCATEGORIZED, type Category } from "@/lib/products/categories";

// Chưa có API: lưu tạm trên trình duyệt. Khi có BE thay bằng /api/categories (GET/POST/PATCH/DELETE).
const store = createLocalStore<Category[]>("bo-categories-v1", defaultCategories);

// Thao tác chỉ đụng tới store nên để ngoài hook — giữ nguyên tham chiếu, bảng memo không phải render lại
const update = (fn: (list: Category[]) => Category[]) => store.set(fn(store.get()));

const save = (category: Category) =>
  update((list) => (list.some((c) => c.id === category.id) ? list.map((c) => (c.id === category.id ? category : c)) : [...list, category]));

const patch = (id: string, changes: Partial<Category>) => update((list) => list.map((c) => (c.id === id ? { ...c, ...changes } : c)));

// Kéo thả: đưa danh mục id vào vị trí của danh mục to
const move = (id: string, to: string) =>
  update((list) => {
    const i = list.findIndex((c) => c.id === id);
    const j = list.findIndex((c) => c.id === to);
    if (i < 0 || j < 0 || i === j) return list;
    const next = [...list];
    next.splice(j, 0, ...next.splice(i, 1));
    return next;
  });

// Trang gọi chỉ khi danh mục không còn sản phẩm nào
const remove = (id: string) => update((list) => list.filter((c) => c.id !== id));
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
