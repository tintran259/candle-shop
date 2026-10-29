import { mockCatalog } from "@/lib/craft/catalog.mock";
import type { OptionGroup } from "@/lib/craft/groups";
import type { BaseOption, CustomizerCatalog } from "@/lib/craft/types";
import { createLocalStore, useLocalStore } from "@/lib/local-store";

// Chưa có API: lưu tạm cấu hình trên trình duyệt này. Khi có BE thay bằng GET/PUT /api/shop-config.
// v2: tiền chuyển từ cent USD sang VNĐ — bỏ dữ liệu cũ lưu theo USD
const store = createLocalStore<CustomizerCatalog>("bo-craft-catalog-v2", mockCatalog);

export function useCraftCatalog() {
  const { data: catalog, loading } = useLocalStore(store);

  const update = (fn: (c: CustomizerCatalog) => CustomizerCatalog) => store.set(fn(store.get()));

  // Thêm mới hoặc thay mục cùng id trong một nhóm nguyên liệu
  const saveOption = (group: OptionGroup, option: BaseOption, previousId?: string) =>
    update((c) => {
      const list = c[group] as BaseOption[];
      const key = previousId ?? option.id;
      const exists = list.some((o) => o.id === key);
      const next = exists ? list.map((o) => (o.id === key ? option : o)) : [...list, option];
      return { ...c, [group]: next };
    });

  const patchOption = (group: OptionGroup, id: string, patch: Partial<BaseOption>) =>
    update((c) => ({ ...c, [group]: (c[group] as BaseOption[]).map((o) => (o.id === id ? { ...o, ...patch } : o)) }));

  const removeOption = (group: OptionGroup, id: string) =>
    update((c) => ({ ...c, [group]: (c[group] as BaseOption[]).filter((o) => o.id !== id) }));

  return { catalog, loading, update, saveOption, patchOption, removeOption, reset: () => store.set(null) };
}

export type CraftCatalogApi = ReturnType<typeof useCraftCatalog>;
