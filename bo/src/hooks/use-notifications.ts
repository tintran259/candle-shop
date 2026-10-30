import { useCraftConfig } from "@/hooks/use-craft-config";
import { useDiscounts } from "@/hooks/use-discounts";
import { useOrders } from "@/hooks/use-orders";
import { createLocalStore, useLocalStore } from "@/lib/local-store";
import { buildNotifications } from "@/lib/notifications";

// Id các thông báo đã đọc — theo từng trình duyệt cho tới khi có API lưu theo tài khoản
const readStore = createLocalStore<string[]>("bo-notifications-read-v1", []);

// Thông báo suy ra từ dữ liệu + trạng thái đã đọc
export function useNotifications() {
  const { orders, loading: l1 } = useOrders();
  const { config: craft, loading: l2 } = useCraftConfig();
  const { discounts, loading: l3 } = useDiscounts();
  const { data: read, loading: l4 } = useLocalStore(readStore);
  const loading = l1 || l2 || l3 || l4;
  const items = loading ? [] : buildNotifications({ orders, craft, discounts });
  const readSet = new Set(read);
  const unread = items.filter((n) => !readSet.has(n.id));

  // Chỉ giữ id của thông báo còn tồn tại để bản lưu không phình mãi
  const markRead = (ids: string[]) => {
    const alive = new Set(items.map((n) => n.id));
    readStore.set([...new Set([...readStore.get(), ...ids])].filter((id) => alive.has(id)));
  };

  return { items, unread, isRead: (id: string) => readSet.has(id), markRead, loading };
}

export type NotificationsApi = ReturnType<typeof useNotifications>;
