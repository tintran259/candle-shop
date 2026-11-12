"use client";
// Bộ lọc trang Sản phẩm nằm trên URL (?q=&concept=&category=&sort=&page=) — tải lại / gửi link / bấm Quay lại từ trang chi tiết vẫn giữ đúng bộ lọc và trang.
// Đổi bộ lọc dùng history.replaceState (Next đồng bộ với useSearchParams, không tải lại trang, không thêm mục lịch sử — Quay lại không phải lùi qua từng lần bấm).
// Chỉ ghi giá trị khác mặc định; giá trị lạ trên URL (concept / danh mục không còn, trang âm…) thì về mặc định
import { useSearchParams } from "next/navigation";
import type { ShopData } from "@/lib/shop";

export type Sort = "featured" | "priceAsc" | "priceDesc";
// Giá trị sort trên URL dễ đọc
const SORT_URL: Record<Exclude<Sort, "featured">, string> = { priceAsc: "gia-tang", priceDesc: "gia-giam" };

export function useListParams(data: ShopData | null) {
  const params = useSearchParams();
  const pick = (key: string, valid: (v: string) => boolean | undefined) => {
    const v = params.get(key);
    return v && valid(v) ? v : "all";
  };
  const sortRaw = params.get("sort");
  const state = {
    query: params.get("q")?.trim() ?? "",
    concept: pick("concept", (v) => data?.concepts.some((c) => c.id === v)),
    category: pick("category", (v) => data?.categories.some((c) => c.id === v)),
    sort: ((Object.entries(SORT_URL).find(([, u]) => u === sortRaw)?.[0] as Sort | undefined) ?? "featured") as Sort,
    page: Math.max(1, Math.floor(Number(params.get("page"))) || 1),
  };

  // undefined / mặc định → bỏ khỏi URL
  const update = (changes: { concept?: string; category?: string; sort?: Sort; page?: number }) => {
    const next = new URLSearchParams(params.toString());
    const set = (key: string, value: string | undefined, fallback: string) => (value === undefined || value === fallback ? next.delete(key) : next.set(key, value));
    if ("concept" in changes) set("concept", changes.concept, "all");
    if ("category" in changes) set("category", changes.category, "all");
    if ("sort" in changes) set("sort", changes.sort === "featured" || !changes.sort ? undefined : SORT_URL[changes.sort], "");
    if ("page" in changes) set("page", changes.page === undefined ? undefined : String(changes.page), "1");
    const qs = next.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  };

  return { ...state, update };
}
