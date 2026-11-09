import { useInventory } from "@/hooks/use-inventory";
import { useDiscounts } from "@/hooks/use-discounts";
import { useOrders } from "@/hooks/use-orders";
import { api } from "@/lib/api";
import { createLocalStore, useLocalStore } from "@/lib/local-store";
import { buildNotifications } from "@/lib/notifications";

// Id các thông báo đã đọc: chế độ BE lưu ở /api/admin/notifications/read, không thì trên trình duyệt này
const readStore = createLocalStore<string[]>("bo-notifications-read-v1", [], undefined, () => api<string[]>("GET", "/admin/notifications/read"));

// Thông báo suy ra từ dữ liệu + trạng thái đã đọc
export function useNotifications() {
  const { orders, loading: l1 } = useOrders();
  const { materials, loading: l2 } = useInventory();
  const { discounts, loading: l3 } = useDiscounts();
  const { data: read, loading: l4 } = useLocalStore(readStore);
  const loading = l1 || l2 || l3 || l4;
  const items = loading ? [] : buildNotifications({ orders, materials, discounts });
  const readSet = new Set(read);
  const unread = items.filter((n) => !readSet.has(n.id));

  // Chỉ giữ id của thông báo còn tồn tại để bản lưu không phình mãi
  const markRead = (ids: string[]) => {
    const alive = new Set(items.map((n) => n.id));
    readStore.sync(
      [...new Set([...readStore.get(), ...ids])].filter((id) => alive.has(id)),
      async () => {
        await api("POST", "/admin/notifications/read", { ids });
      },
    );
  };

  return { items, unread, isRead: (id: string) => readSet.has(id), markRead, loading };
}

export type NotificationsApi = ReturnType<typeof useNotifications>;
