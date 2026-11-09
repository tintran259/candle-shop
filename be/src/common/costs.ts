// Giá nhập — giống bo/src/lib/costs.ts (docs/pages/inventory.md#giá-nhập)

// Giá mỗi đơn vị giữ 2 chữ số lẻ: 299.000 ₫ cho 5.000 g = 59,8 ₫/g
const cents = (n: number) => Math.round(n * 100) / 100;

// Giá mỗi đơn vị từ tổng tiền mua: 5.000 g giá 300.000 ₫ → 60 ₫/g
export const unitPrice = (total: number, quantity: number) => (quantity > 0 && total >= 0 ? cents(total / quantity) : undefined);

// Giá bình quân sau một lần nhập: (tồn × giá cũ + lượng nhập × giá mới) ÷ tổng. Chưa có giá hoặc hết tồn thì lấy giá mới
export function averageCost(stock: number, cost: number | null | undefined, quantity: number, price: number) {
  if (cost === null || cost === undefined || stock <= 0) return price;
  return cents((stock * cost + quantity * price) / (stock + quantity));
}

// Lượng cần cho một mẻ: định mức × số lượng
export function batchNeeds(recipe: { materialId: string; quantity: number }[], count: number) {
  const needs = new Map<string, number>();
  for (const r of recipe) if (r.quantity > 0) needs.set(r.materialId, (needs.get(r.materialId) ?? 0) + r.quantity * count);
  return needs;
}
