import { useMemo } from "react";
import { api } from "@/lib/api";
import { createLocalStore, upsert, useLocalStore } from "@/lib/local-store";
import type { Taxonomy } from "@/lib/products/taxonomy";

// Kho cho một cách phân loại (Danh mục /admin/categories, Concept /admin/concepts — docs/api.md): thêm, sửa, bật tắt, kéo thả, xóa.
// Thao tác chỉ đụng tới store nên để ngoài hook — giữ nguyên tham chiếu, bảng memo không phải render lại
export function createTaxonomy(key: string, path: string, fallback: Taxonomy[], unnamed: string, onRemove?: (id: string) => void) {
  const store = createLocalStore<Taxonomy[]>(key, fallback, undefined, () => api<Taxonomy[]>("GET", path));

  const save = (item: Taxonomy) => {
    const exists = store.get().some((c) => c.id === item.id);
    return store.sync(upsert(item)(store.get()), async () => {
      const { id, ...body } = item;
      const saved = await (exists ? api<Taxonomy>("PATCH", `${path}/${id}`, body) : api<Taxonomy>("POST", path, { id, ...body }));
      return upsert(saved);
    });
  };

  const patch = (id: string, changes: Partial<Taxonomy>) =>
    store.sync(
      store.get().map((c) => (c.id === id ? { ...c, ...changes } : c)),
      async () => upsert(await api<Taxonomy>("PATCH", `${path}/${id}`, changes)),
    );

  // Kéo thả: đưa mục id vào vị trí của mục to
  const move = (id: string, to: string) => {
    const list = store.get();
    const i = list.findIndex((c) => c.id === id);
    const j = list.findIndex((c) => c.id === to);
    if (i < 0 || j < 0 || i === j) return true;
    const next = [...list];
    next.splice(j, 0, ...next.splice(i, 1));
    return store.sync(next, async () => {
      const saved = await api<Taxonomy[]>("PUT", `${path}/order`, { ids: next.map((c) => c.id) });
      return () => saved;
    });
  };

  const remove = (id: string) => {
    onRemove?.(id);
    return store.sync(
      store.get().filter((c) => c.id !== id),
      () => api("DELETE", `${path}/${id}`),
    );
  };
  const reset = () => store.set(null);

  return function useTaxonomy() {
    const { data: items, loading } = useLocalStore(store);
    return useMemo(() => {
      const byId = new Map(items.map((c) => [c.id, c]));
      // Tên hiển thị; id đã bị xóa (dữ liệu cũ) thì trả chữ mặc định
      const label = (id?: string) => (id && byId.get(id)?.name.vi) || unnamed;
      return { items, loading, byId, label, save, patch, move, remove, reset };
    }, [items, loading]);
  };
}

export type TaxonomyApi = ReturnType<ReturnType<typeof createTaxonomy>>;
