import type { AromaLevel, AromaType, Product, ProductSize } from "@/lib/products/types";

export const aromaTypeLabels: Record<AromaType, string> = { fruits: "Trái cây", nature: "Thiên nhiên", parfum: "Nước hoa" };
export const aromaLevelLabels: Record<AromaLevel, string> = { soft: "Nhẹ", medium: "Vừa", strong: "Đậm" };
export const sizeLabels: Record<ProductSize, string> = { small: "Nhỏ", medium: "Vừa", big: "Lớn" };

// Màu tag loại hương (tag antd preset — luôn kèm chữ)
export const aromaTypeColors: Record<AromaType, string> = { fruits: "orange", nature: "green", parfum: "purple" };

export const toOptions = <K extends string>(labels: Record<K, string>) =>
  (Object.keys(labels) as K[]).map((value) => ({ value, label: labels[value] }));

// Phần trăm giảm, làm tròn — 0 khi không giảm
export const discountPercent = (p: Pick<Product, "price" | "salePrice">) =>
  p.salePrice && p.salePrice < p.price ? Math.round((1 - p.salePrice / p.price) * 100) : 0;

export const sortOptions = [
  { value: "newest", label: "Mới nhất" },
  { value: "bestseller", label: "Bán chạy" },
  { value: "featured", label: "Nổi bật trước" },
  { value: "price-asc", label: "Giá tăng dần" },
  { value: "price-desc", label: "Giá giảm dần" },
] as const;
export type SortKey = (typeof sortOptions)[number]["value"];

const effectivePrice = (p: Product) => p.salePrice ?? p.price;

export const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  bestseller: (a, b) => b.sold - a.sold,
  featured: (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.sold - a.sold,
  "price-asc": (a, b) => effectivePrice(a) - effectivePrice(b),
  "price-desc": (a, b) => effectivePrice(b) - effectivePrice(a),
};
