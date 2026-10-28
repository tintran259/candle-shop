import { matches } from "@/lib/search";
import {
  aromaLevels,
  aromaTypes,
  productSizes,
  type Product,
} from "@/lib/data";

export const sortOptions = ["featured", "newest", "price-asc", "price-desc", "rating"] as const;
export type SortOption = (typeof sortOptions)[number];

export const PRICE_MIN = 0;
export const PRICE_MAX = 50;

export type ProductFilters = {
  q: string;
  level: string[];
  type: string[];
  size: string[];
  rating: number;
  price: [number, number];
  sale: boolean;
  isNew: boolean;
  sort: SortOption;
};

const list = (value: string | null, allowed: readonly string[]) =>
  (value ?? "").split(",").filter((v) => allowed.includes(v));

const clamp = (n: number, fallback: number) =>
  Number.isFinite(n) ? Math.min(Math.max(n, PRICE_MIN), PRICE_MAX) : fallback;

/** Đọc bộ lọc từ query string, ví dụ ?level=soft,medium&min=10&sort=newest */
export function parseFilters(params: URLSearchParams): ProductFilters {
  const sort = params.get("sort") as SortOption;
  return {
    q: (params.get("q") ?? "").trim(),
    level: list(params.get("level"), aromaLevels),
    type: list(params.get("type"), aromaTypes),
    size: list(params.get("size"), productSizes),
    rating: Number(params.get("rating")) || 0,
    price: [
      clamp(Number(params.get("min") ?? PRICE_MIN), PRICE_MIN),
      clamp(Number(params.get("max") ?? PRICE_MAX), PRICE_MAX),
    ],
    sale: params.get("sale") === "1",
    isNew: params.get("new") === "1",
    sort: sortOptions.includes(sort) ? sort : "featured",
  };
}

/** Ghi bộ lọc ra query object, bỏ qua giá trị mặc định cho URL gọn */
export function toQuery(f: ProductFilters): Record<string, string> {
  const q: Record<string, string> = {};
  if (f.q) q.q = f.q;
  if (f.level.length) q.level = f.level.join(",");
  if (f.type.length) q.type = f.type.join(",");
  if (f.size.length) q.size = f.size.join(",");
  if (f.rating) q.rating = String(f.rating);
  if (f.price[0] !== PRICE_MIN) q.min = String(f.price[0]);
  if (f.price[1] !== PRICE_MAX) q.max = String(f.price[1]);
  if (f.sale) q.sale = "1";
  if (f.isNew) q.new = "1";
  if (f.sort !== "featured") q.sort = f.sort;
  return q;
}

export const finalPrice = (p: Product) => p.salePrice ?? p.price;

/** `text` trả về chuỗi tìm kiếm của sản phẩm (đã dịch) cho tham số ?q= */
export function applyFilters(
  products: Product[],
  f: ProductFilters,
  text: (p: Product) => string = (p) => p.name,
): Product[] {
  const result = products.filter(
    (p) =>
      (!f.q || matches(text(p), f.q)) &&
      (!f.level.length || f.level.includes(p.aromaLevel)) &&
      (!f.type.length || f.type.includes(p.aromaType)) &&
      (!f.size.length || f.size.includes(p.size)) &&
      p.rating >= f.rating &&
      finalPrice(p) >= f.price[0] &&
      finalPrice(p) <= f.price[1] &&
      (!f.sale || p.salePrice !== undefined) &&
      (!f.isNew || p.isNew),
  );

  const sorters: Record<SortOption, (a: Product, b: Product) => number> = {
    featured: (a, b) => a.featured - b.featured,
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    "price-asc": (a, b) => finalPrice(a) - finalPrice(b),
    "price-desc": (a, b) => finalPrice(b) - finalPrice(a),
    rating: (a, b) => b.rating - a.rating,
  };
  return result.sort(sorters[f.sort]);
}

export function countActive(f: ProductFilters) {
  return (
    f.level.length +
    f.type.length +
    f.size.length +
    (f.rating ? 1 : 0) +
    (f.price[0] !== PRICE_MIN || f.price[1] !== PRICE_MAX ? 1 : 0) +
    (f.sale ? 1 : 0) +
    (f.isNew ? 1 : 0)
  );
}
