// Tìm sản phẩm phía trình duyệt (danh sách nhỏ, đã có sẵn): không phân biệt hoa / thường và dấu ("hoa hong" khớp "Hồng Nhung"),
// mọi từ gõ vào phải khớp ĐẦU một từ trong tên / nốt hương / mô tả / danh mục ("hong" khớp "Hồng", không khớp "phong"). Khớp tên xếp trước
import type { ShopCategory, ShopProduct } from "@/lib/shop";

export const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

// concepts: tên dịp lễ cũng khớp (gõ "noel" ra các mẫu thuộc concept Noel)
export function searchProducts(products: ShopProduct[], categories: ShopCategory[], query: string, concepts: ShopCategory[] = []) {
  const terms = fold(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return products;
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const conceptName = new Map(concepts.map((c) => [c.id, c.name]));
  return products
    .map((p) => {
      // Thêm khoảng trắng đầu + đổi dấu câu thành khoảng trắng để "khớp đầu từ" = chứa " " + từ gõ
      const words = (v: string) => ` ${fold(v).replace(/[^\p{L}\p{N}]+/gu, " ")}`;
      const name = words(p.name);
      const rest = words([p.scent, p.description, p.waxType, catName.get(p.categoryId), ...p.conceptIds.map((c) => conceptName.get(c))].filter(Boolean).join(" "));
      if (!terms.every((t) => name.includes(` ${t}`) || rest.includes(` ${t}`))) return null;
      const score = terms.reduce((s, t) => s + (name.includes(` ${t}`) ? 3 : 0), 0);
      return { p, score };
    })
    .filter((r): r is { p: ShopProduct; score: number } => !!r)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.p);
}
