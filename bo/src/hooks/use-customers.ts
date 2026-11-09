import { useMemo } from "react";
import { api } from "@/lib/api";
import { REMOTE } from "@/lib/data-mode";
import { mockCustomers } from "@/lib/customers/mock";
import type { Customer } from "@/lib/customers/types";
import { createLocalStore, upsert, useLocalStore } from "@/lib/local-store";

// Khách hàng: /api/admin/customers (docs/api.md#khách-hàng). Số đơn, đã chi, nhóm khách BO tự tính từ đơn
const store = createLocalStore<Customer[]>("bo-customers-v1", REMOTE ? [] : mockCustomers, undefined, () => api<Customer[]>("GET", "/admin/customers"));

// Trường bị xóa (undefined) gửi chuỗi rỗng để BE xóa theo — JSON bỏ qua undefined
const clearable = (changes: Partial<Customer>) => Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v === undefined && (k === "note" || k === "blockReason") ? "" : v]));

// Thao tác chỉ đụng tới store nên để ngoài hook — giữ nguyên tham chiếu, bảng memo không phải render lại
const patch = (id: string, changes: Partial<Customer>) =>
  store.sync(
    store.get().map((c) => (c.id === id ? { ...c, ...changes } : c)),
    async () => upsert(await api<Customer>("PATCH", `/admin/customers/${id}`, clearable(changes))),
  );
const setBlocked = (id: string, blocked: boolean, blockReason?: string) => patch(id, { blocked, blockReason: blocked ? blockReason : undefined });

// Khách mới từ đơn tạo tại BO (chưa có hồ sơ cùng số điện thoại)
const add = (customer: Customer) =>
  store.sync([customer, ...store.get()], async () => {
    const { id, name, phone, email, hasAccount, newsletter, tags, note, createdAt } = customer;
    return upsert(await api<Customer>("POST", "/admin/customers", { id, name, phone, email, hasAccount, newsletter, tags, note, createdAt }), true);
  });
const reset = () => store.set(null);
// Tải lại từ BE (sau thao tác đơn hàng BE tự đổi lượt mã / tạo hồ sơ khách)
export const reloadCustomers = () => store.reload();

export function useCustomers() {
  const { data: customers, loading } = useLocalStore(store);
  return useMemo(() => ({ customers, loading, add, patch, setBlocked, reset }), [customers, loading]);
}

export type CustomersApi = ReturnType<typeof useCustomers>;
