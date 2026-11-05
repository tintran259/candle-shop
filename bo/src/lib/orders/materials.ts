import { materialNeeds, type CraftSelection } from "@/lib/craft/selection";
import type { CraftConfig } from "@/lib/craft/types";
import type { MaterialMap } from "@/lib/inventory/stock";
import type { Order } from "@/lib/orders/types";
import type { Product, RecipeLine } from "@/lib/products/types";

type Line = { productId?: string; craft?: CraftSelection; recipe?: RecipeLine[]; quantity?: number };
type Source = { config: CraftConfig; map: MaterialMap; products: Product[] };

// Nguyên liệu cho 1 cây: nến tự phối theo công thức lưu trên đơn (đơn cũ tính lại từ cấu hình), nến trưng bày theo công thức của sản phẩm
function unitNeeds(line: Line, { config, map, products }: Source) {
  if (!line.recipe && line.craft) return materialNeeds(config, line.craft, map);
  const recipe = line.recipe ?? products.find((p) => p.id === line.productId)?.recipe ?? [];
  return new Map(recipe.filter((r) => map.get(r.materialId)?.tracked).map((r) => [r.materialId, r.quantity]));
}

// Tổng nguyên liệu của nhiều dòng × số lượng
export function linesNeeds(lines: Line[], source: Source) {
  const needs = new Map<string, number>();
  for (const line of lines) for (const [id, n] of unitNeeds(line, source)) needs.set(id, (needs.get(id) ?? 0) + n * (line.quantity ?? 1));
  return needs;
}

export const orderNeeds = (order: Order, source: Source) => linesNeeds(order.items, source);

// Đơn Đã thanh toán đang giữ nguyên liệu: chưa trừ Kho nhưng đơn khác không được dùng. Bắt đầu làm hoặc hủy thì tự nhả
export function heldNeeds(orders: Order[], source: Source) {
  return linesNeeds(
    orders.filter((o) => o.status === "paid").flatMap((o) => o.items),
    source,
  );
}

// Tồn còn dùng được sau khi trừ phần đang giữ
export function availableMap(map: MaterialMap, held: Map<string, number>): MaterialMap {
  return new Map([...map].map(([id, m]) => [id, { ...m, stock: m.stock - (held.get(id) ?? 0) }]));
}

export const shortages = (needs: Map<string, number>, map: MaterialMap) => [...needs].map(([id, need]) => ({ m: map.get(id)!, need })).filter(({ m, need }) => m && m.stock < need);
