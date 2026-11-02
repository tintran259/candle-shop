import { useMemo } from "react";
import { createLocalStore, useLocalStore } from "@/lib/local-store";
import { defaultSettings, type ShopSettings } from "@/lib/settings/types";

// Chưa có API: lưu tạm trên trình duyệt. Khi có BE: GET/PUT /api/admin/settings, web đọc GET /api/settings.
const store = createLocalStore<ShopSettings>("bo-settings-v1", defaultSettings);

// Đọc ngay, kể cả khi chưa tải xong — form tạo đơn cần giá trị đúng ngay lúc mở
export const getSettings = () => store.get();

const save = (settings: ShopSettings) => store.set(settings);

export function useSettings() {
  const { data: settings, loading } = useLocalStore(store);
  return useMemo(() => ({ settings, loading, save }), [settings, loading]);
}
