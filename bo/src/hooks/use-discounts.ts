import { useMemo } from "react";
import { api } from "@/lib/api";
import { REMOTE } from "@/lib/data-mode";
import { mockDiscounts } from "@/lib/discounts/mock";
import type { Discount } from "@/lib/discounts/types";
import { createLocalStore, upsert, useLocalStore } from "@/lib/local-store";

// Mã giảm giá: /api/admin/discounts (docs/api.md#mã-giảm-giá)
const store = createLocalStore<Discount[]>("bo-discounts-v1", REMOTE ? [] : mockDiscounts, undefined, () => api<Discount[]>("GET", "/admin/discounts"));

// Thao tác chỉ đụng tới store nên để ngoài hook — giữ nguyên tham chiếu, bảng memo không phải render lại
const save = (discount: Discount) => {
  const exists = store.get().some((x) => x.id === discount.id);
  return store.sync(upsert(discount, true)(store.get()), async () =>
    upsert(await api<Discount>(exists ? "PUT" : "POST", exists ? `/admin/discounts/${discount.id}` : "/admin/discounts", discount), true),
  );
};

// Đổi nhanh trên bảng: bật / tạm dừng, số lượt đã dùng
const patch = (id: string, changes: Partial<Pick<Discount, "active" | "used">>) =>
  store.sync(
    store.get().map((x) => (x.id === id ? { ...x, ...changes } : x)),
    async () => upsert(await api<Discount>("PATCH", `/admin/discounts/${id}`, { active: changes.active, used: changes.used })),
  );

// Hủy đơn: trả lại lượt mã đã dùng
export const releaseDiscount = (code: string) => {
  const d = store.get().find((x) => x.code === code);
  return d ? patch(d.id, { used: Math.max(0, d.used - 1) }) : true;
};

const remove = (id: string) =>
  store.sync(
    store.get().filter((x) => x.id !== id),
    () => api("DELETE", `/admin/discounts/${id}`),
  );
const reset = () => store.set(null);
// Tải lại từ BE (sau thao tác đơn hàng BE tự đổi lượt mã / tạo hồ sơ khách)
export const reloadDiscounts = () => store.reload();

export function useDiscounts() {
  const { data: discounts, loading } = useLocalStore(store);
  return useMemo(() => ({ discounts, loading, save, patch, remove, reset }), [discounts, loading]);
}

export type DiscountsApi = ReturnType<typeof useDiscounts>;
