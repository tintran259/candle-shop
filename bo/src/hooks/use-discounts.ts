import { mockDiscounts } from "@/lib/discounts/mock";
import type { Discount } from "@/lib/discounts/types";
import { createLocalStore, useLocalStore } from "@/lib/local-store";

// Chưa có API: lưu tạm trên trình duyệt. Khi có BE thay bằng /api/discounts (GET/POST/PATCH/DELETE).
const store = createLocalStore<Discount[]>("bo-discounts-v1", mockDiscounts);

export function useDiscounts() {
  const { data: discounts, loading } = useLocalStore(store);
  const update = (fn: (list: Discount[]) => Discount[]) => store.set(fn(store.get()));

  const save = (discount: Discount) =>
    update((list) => (list.some((x) => x.id === discount.id) ? list.map((x) => (x.id === discount.id ? discount : x)) : [discount, ...list]));

  const patch = (id: string, changes: Partial<Discount>) => update((list) => list.map((x) => (x.id === id ? { ...x, ...changes } : x)));

  const remove = (id: string) => update((list) => list.filter((x) => x.id !== id));

  return { discounts, loading, save, patch, remove, reset: () => store.set(null) };
}

export type DiscountsApi = ReturnType<typeof useDiscounts>;
