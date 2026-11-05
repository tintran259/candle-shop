// Giá bán sản phẩm trưng bày so với giá vốn công thức theo giá nhập bình quân hiện tại trong Kho (docs/pages/products.md#giá-vốn)
// Giá nhập đổi sau khi tạo sản phẩm thì trang Sản phẩm báo lại, không tự đổi giá
import { needsCost } from "@/lib/costs";
import { needsReview, type PriceCheck } from "@/lib/craft/pricing";
import type { MaterialMap } from "@/lib/inventory/stock";
import type { Product } from "@/lib/products/types";

// Giá thực bán (giá giảm nếu có) so với giá vốn 1 cây. Chưa có công thức thì null
export function productPriceCheck(p: Pick<Product, "price" | "salePrice" | "recipe">, map: MaterialMap): PriceCheck | null {
  if (!p.recipe?.length) return null;
  const cost = needsCost(new Map(p.recipe.map((r) => [r.materialId, r.quantity])), map);
  const price = p.salePrice || p.price;
  return { price, floor: cost.cost, missing: cost.missing, margin: price > 0 ? (price - cost.cost) / price : null };
}

// Sản phẩm cần xem lại giá: thấp hơn giá vốn hoặc lãi dưới mức tối thiểu ở Cài đặt → { id: kiểm tra giá }
export function productsToReview(products: Product[], map: MaterialMap, minMargin: number) {
  const out = new Map<string, PriceCheck>();
  for (const p of products) {
    const c = productPriceCheck(p, map);
    if (c && c.floor > 0 && needsReview(c, minMargin)) out.set(p.id, c);
  }
  return out;
}
