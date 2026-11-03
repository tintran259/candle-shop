import { useEffect } from "react";
import { useCraftConfig } from "@/hooks/use-craft-config";
import { useStockHold } from "@/hooks/use-stock-hold";

const SF_URL = import.meta.env.VITE_SF_URL ?? "http://localhost:3000";
const DEBOUNCE_MS = 400;

// Chưa có BE: BO chạy trên máy thì đẩy cấu hình đã lưu và tồn dùng được sang web (fe/src/app/api/craft-config).
// Web chưa bật thì bỏ qua. Khi có BE: bỏ hook này, nút Lưu gọi PUT /api/admin/shop-config/craft
export function useStorefrontSync() {
  const { config, loading } = useCraftConfig();
  const { available } = useStockHold();

  useEffect(() => {
    if (loading || location.hostname !== "localhost") return;
    const materials = [...available.values()].map(({ id, unit, tracked, stock, lowStock }) => ({ id, unit, tracked, stock, lowStock }));
    const timer = setTimeout(() => {
      fetch(`${SF_URL}/api/craft-config`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config, materials }) }).catch(() => {});
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [config, available, loading]);
}
