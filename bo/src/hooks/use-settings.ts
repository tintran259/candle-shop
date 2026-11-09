import { useMemo } from "react";
import { api } from "@/lib/api";
import { createLocalStore, useLocalStore } from "@/lib/local-store";
import { defaultSettings, type ShopSettings } from "@/lib/settings/types";

// Cài đặt cửa hàng: GET / PUT /api/admin/settings (docs/api.md#cài-đặt).
// Thiếu trường (bản lưu cũ, BE chưa có trường mới) thì điền giá trị mặc định
const store = createLocalStore<ShopSettings>(
  "bo-settings-v1",
  defaultSettings,
  (s) => ({ ...defaultSettings, ...s }),
  () => api<ShopSettings>("GET", "/admin/settings"),
);

// Đọc ngay, kể cả khi chưa tải xong — form tạo đơn cần giá trị đúng ngay lúc mở
export const getSettings = () => store.get();

const save = (settings: ShopSettings) =>
  store.sync(settings, async () => {
    const saved = await api<ShopSettings>("PUT", "/admin/settings", settings);
    return () => ({ ...defaultSettings, ...saved });
  });

export function useSettings() {
  const { data: settings, loading } = useLocalStore(store);
  return useMemo(() => ({ settings, loading, save }), [settings, loading]);
}
