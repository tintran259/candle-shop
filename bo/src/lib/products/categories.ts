// Danh mục sản phẩm (loại hương): admin tự thêm, sửa, sắp xếp ở trang Danh mục. Mỗi sản phẩm thuộc đúng 1 danh mục.
// Web dùng làm bộ lọc chính; danh mục ẩn không hiện trong bộ lọc của web.
import type { Taxonomy, TaxonomyKind } from "@/lib/products/taxonomy";

export type Category = Taxonomy;

// Giữ đúng id cũ (fruits/nature/parfum) để sản phẩm và web hiện tại vẫn khớp
export const defaultCategories: Category[] = [
  { id: "nature", name: { vi: "Thiên nhiên", en: "Nature" }, color: "green", hidden: false },
  { id: "parfum", name: { vi: "Nước hoa", en: "Parfum" }, color: "purple", hidden: false },
  { id: "fruits", name: { vi: "Trái cây", en: "Fruits" }, color: "orange", hidden: false },
];

export const UNCATEGORIZED = "Chưa phân loại";

export const categoryKind: TaxonomyKind = {
  noun: "danh mục",
  placeholder: "VD: Hương gỗ",
  fallbackId: "danh-muc",
  productsHref: (id) => `/products?category=${encodeURIComponent(id)}`,
  removeWhenUsed: false,
};
