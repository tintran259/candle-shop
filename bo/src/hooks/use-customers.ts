import { useMemo } from "react";
import { mockCustomers } from "@/lib/customers/mock";
import type { Customer } from "@/lib/customers/types";
import { createLocalStore, useLocalStore } from "@/lib/local-store";

// Chưa có API: lưu tạm trên trình duyệt. Khi có BE thay bằng /api/customers (GET, PATCH ghi chú/nhãn/chặn).
const store = createLocalStore<Customer[]>("bo-customers-v1", mockCustomers);

// Thao tác chỉ đụng tới store nên để ngoài hook — giữ nguyên tham chiếu, bảng memo không phải render lại
const patch = (id: string, changes: Partial<Customer>) => store.set(store.get().map((c) => (c.id === id ? { ...c, ...changes } : c)));
const setBlocked = (id: string, blocked: boolean, blockReason?: string) => patch(id, { blocked, blockReason: blocked ? blockReason : undefined });
// Khách mới từ đơn tạo tại BO (chưa có hồ sơ cùng số điện thoại)
const add = (customer: Customer) => store.set([customer, ...store.get()]);
const reset = () => store.set(null);

export function useCustomers() {
  const { data: customers, loading } = useLocalStore(store);
  return useMemo(() => ({ customers, loading, add, patch, setBlocked, reset }), [customers, loading]);
}

export type CustomersApi = ReturnType<typeof useCustomers>;
