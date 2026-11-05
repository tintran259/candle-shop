import { slugify } from "@/lib/craft/groups";
import { sorters, type SortKey } from "@/lib/products/labels";
import type { Product, ProductSize } from "@/lib/products/types";

export type ProductFilters = {
  q: string;
  status: "all" | "active" | "hidden";
  categoryId?: string;
  size?: ProductSize;
  sort: SortKey;
  // Chỉ sản phẩm cần xem lại giá (thấp hơn vốn / lãi dưới mức)
  review?: boolean;
};

export const defaultFilters: ProductFilters = { q: "", status: "all", sort: "newest" };
export type ViewMode = "table" | "grid";

// Tìm không phân biệt dấu: "nen moon" khớp "Moon Morning". review: id các sản phẩm cần xem lại giá
export function applyFilters(list: Product[], f: ProductFilters, review?: ReadonlyMap<string, unknown>) {
  const q = slugify(f.q);
  return list
    .filter((p) => f.status === "all" || p.status === f.status)
    .filter((p) => !f.categoryId || p.categoryId === f.categoryId)
    .filter((p) => !f.size || p.size === f.size)
    .filter((p) => !f.review || !!review?.has(p.id))
    .filter((p) => !q || slugify(p.name).includes(q) || p.slug.includes(q))
    .sort(sorters[f.sort]);
}
