// Sản phẩm trưng bày dựng giống nến tự phối: chọn theo các bước Thủ công (hũ + cỡ + nắp, sáp, hương, bấc, màu, trang trí),
// cộng phụ kiện khác lấy thẳng từ Kho. Công thức trừ Kho, cỡ trên web, loại sáp, giờ cháy đều suy ra từ đây (docs/pages/products.md#công-thức-theo-thủ-công)
import { activeSteps, emptySelection, materialNeeds, priceSelection, selectedSize, type CraftSelection } from "@/lib/craft/selection";
import { validateSelection } from "@/lib/craft/validate";
import { amountBasis } from "@/lib/craft/steps";
import type { CraftConfig, StepOption } from "@/lib/craft/types";
import type { MaterialMap } from "@/lib/inventory/stock";
import type { ProductSize, RecipeLine } from "@/lib/products/types";

// price: giá bán của lượng phụ kiện này trên 1 cây (cộng vào giá gợi ý); không nhập thì không tính tiền
export type ExtraLine = {
  materialId: string;
  quantity: number;
  price?: number;
};

export type ProductBuild = {
  // Lựa chọn theo các bước Thủ công (không gồm bước Cá nhân hóa)
  selection: CraftSelection;
  // Nguyên liệu không có ở Thủ công (phụ kiện, bao bì…), hoặc công thức có sẵn của nến hủy đơn / sản phẩm cũ
  extras: ExtraLine[];
};

// Bước dùng cho sản phẩm: các bước Thủ công đang hiện, bỏ bước ô nhập (khắc chữ, lời nhắn là của từng khách)
export const productSteps = (config: CraftConfig) => activeSteps(config).filter((s) => s.kind !== "inputs");

export const emptyBuild = (config: CraftConfig): ProductBuild => {
  const sel = emptySelection(config);
  return {
    selection: Object.fromEntries(productSteps(config).map((s) => [s.id, sel[s.id]])),
    extras: [],
  };
};

// Công thức 1 cây: nguyên liệu theo lựa chọn + phụ kiện khác, cùng nguyên liệu thì cộng
export function recipeFromBuild(b: ProductBuild, config: CraftConfig, map: MaterialMap): RecipeLine[] {
  const out = materialNeeds(config, b.selection, map);
  for (const e of b.extras) if (e.materialId && e.quantity > 0) out.set(e.materialId, (out.get(e.materialId) ?? 0) + e.quantity);
  return [...out].map(([materialId, quantity]) => ({ materialId, quantity }));
}

// Cỡ trên web (bộ lọc Nhỏ / Vừa / Lớn) suy ra từ dung tích hũ
export function sizeFromCapacity(capacity?: number): ProductSize {
  if (!capacity || capacity <= 150) return "small";
  return capacity <= 220 ? "medium" : "big";
}

export const buildSize = (b: ProductBuild, config: CraftConfig) => selectedSize(config, b.selection);

// Loại sáp hiện trên web: tên các loại sáp đã chọn (bước tính theo gram), nhiều loại thì nối "+"
export function waxTypeOf(b: ProductBuild, config: CraftConfig) {
  const names = productSteps(config)
    .filter((s) => amountBasis(s)?.unit === "g")
    .flatMap((s) => {
      const sel = b.selection[s.id];
      const ids = sel && "optionIds" in sel ? sel.optionIds : [];
      return ids.map((id) => (s.options as StepOption[]).find((o) => o.id === id)?.name.vi).filter(Boolean) as string[];
    });
  return names.join(" + ") || undefined;
}

// Giá theo Thủ công cho đúng cấu hình này
export const craftPrice = (b: ProductBuild, config: CraftConfig) => priceSelection(config, b.selection).unit;

// Tổng giá bán phụ kiện khác trên 1 cây
export const extrasPrice = (b: ProductBuild) => b.extras.reduce((s, e) => s + (e.price ?? 0), 0);

// Lỗi chọn theo từng bước (giống khi thêm nến tự phối vào đơn); bỏ bước ô nhập
export const buildIssues = (b: ProductBuild, config: CraftConfig, map: MaterialMap) => validateSelection({ ...config, steps: productSteps(config) }, b.selection, map);
