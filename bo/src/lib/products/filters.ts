import { slugify } from "@/lib/craft/groups";
import { sorters, type SortKey } from "@/lib/products/labels";
import type { AromaType, Product, ProductSize } from "@/lib/products/types";

export type ProductFilters = {
  q: string;
  status: "all" | "active" | "hidden";
  aromaType?: AromaType;
  size?: ProductSize;
  sort: SortKey;
};

export const defaultFilters: ProductFilters = { q: "", status: "all", sort: "newest" };
export type ViewMode = "table" | "grid";

// Tìm không phân biệt dấu: "nen moon" khớp "Moon Morning"
export function applyFilters(list: Product[], f: ProductFilters) {
  const q = slugify(f.q);
  return list
    .filter((p) => f.status === "all" || p.status === f.status)
    .filter((p) => !f.aromaType || p.aromaType === f.aromaType)
    .filter((p) => !f.size || p.size === f.size)
    .filter((p) => !q || slugify(p.name).includes(q) || p.slug.includes(q))
    .sort(sorters[f.sort]);
}
