import { api } from "@/lib/api";
import { createLocalStore, useLocalStore } from "@/lib/local-store";

// Lời nhắn khách gửi ở form "Gửi lời nhắn" trang chủ web (docs/pages/messages.md) — /admin/messages. BO xem, đánh dấu đã xử lý, xóa
export type ContactMessage = { id: string; name: string; phone: string; email: string; message: string; handled: boolean; createdAt: string };

const store = createLocalStore<ContactMessage[]>("bo-messages-v1", [], undefined, () => api<ContactMessage[]>("GET", "/admin/messages"));

const setHandled = (id: string, handled: boolean) =>
  store.sync(
    store.get().map((m) => (m.id === id ? { ...m, handled } : m)),
    () => api("PATCH", `/admin/messages/${id}`, { handled }),
  );

const remove = (id: string) =>
  store.sync(
    store.get().filter((m) => m.id !== id),
    () => api("DELETE", `/admin/messages/${id}`),
  );

export function useMessages() {
  const { data, loading } = useLocalStore(store);
  return { items: data ?? [], loading, setHandled, remove };
}
