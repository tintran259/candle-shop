"use client";

import { useQuery } from "@tanstack/react-query";
import { getShopConfig } from "@/lib/shop-config";

// Cấu hình xưởng (nguyên liệu, công suất, liên hệ) — chỉ tải ở client vì phụ thuộc ngày hiện tại
export function useShopConfig() {
  return useQuery({
    queryKey: ["shop-config"],
    queryFn: getShopConfig,
    staleTime: 60_000,
  });
}
