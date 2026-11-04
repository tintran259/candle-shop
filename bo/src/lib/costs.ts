// Giá vốn nguyên liệu và lãi gộp (docs/pages/inventory.md#giá-nhập, docs/pages/orders.md#giá-vốn)
import type { Unit } from "@/lib/craft/types";
import type { MaterialMap } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";
import { orderNeeds } from "@/lib/orders/materials";
import type { Order } from "@/lib/orders/types";

// Giá mỗi đơn vị giữ 2 chữ số lẻ: 299.000 ₫ cho 5.000 g = 59,8 ₫/g, làm tròn tới đồng sẽ lệch khi nhân với lượng lớn
const cents = (n: number) => Math.round(n * 100) / 100;

// Giá mỗi đơn vị từ tổng tiền mua: 5.000 g giá 300.000 ₫ → 60 ₫/g
export const unitPrice = (total: number, quantity: number) => (quantity > 0 && total >= 0 ? cents(total / quantity) : undefined);

// Đơn vị lúc mua quy về đơn vị Kho: mua theo kg, lít thì × 1.000
export const purchaseUnits: Record<Unit, { value: string; label: string; factor: number }[]> = {
  g: [
    { value: "kg", label: "kg", factor: 1000 },
    { value: "g", label: "g", factor: 1 },
  ],
  ml: [
    { value: "l", label: "lít", factor: 1000 },
    { value: "ml", label: "ml", factor: 1 },
  ],
  pcs: [{ value: "pcs", label: "cái", factor: 1 }],
};

// Giá nhập bình quân sau một lần nhập: (tồn × giá cũ + lượng nhập × giá mới) ÷ tổng. Chưa có giá hoặc hết tồn thì lấy giá mới
export function averageCost(stock: number, cost: number | undefined, quantity: number, price: number) {
  if (cost === undefined || stock <= 0) return price;
  return cents((stock * cost + quantity * price) / (stock + quantity));
}

// Một lần mua ghi theo đơn vị lúc mua: "Mua 5 kg giá 300.000 ₫"
export type Purchase = { qty?: number | null; unit: string; price?: number | null };

// Giá mỗi đơn vị Kho từ một lần mua; thiếu lượng hoặc giá thì chưa tính được
export function purchaseCost(unit: Unit, p?: Purchase) {
  const factor = purchaseUnits[unit].find((u) => u.value === p?.unit)?.factor ?? 1;
  return p?.price === null || p?.price === undefined || !p.qty ? undefined : unitPrice(p.price, p.qty * factor);
}

// Điền sẵn từ giá đang có, hiện theo 1 kg, 1 lít hoặc 1 cái cho dễ đọc
export function purchaseFrom(unit: Unit, unitCost?: number): Purchase {
  const big = purchaseUnits[unit][0];
  return { qty: 1, unit: big.value, price: unitCost === undefined ? null : Math.round(unitCost * big.factor) };
}

// Tiền lô nhập: tổng đã trả, hoặc hàng không mất tiền (tặng, mẫu thử) = 0 ₫. Thiếu cả hai thì chưa ghi phiếu được
export type LotPrice = { total?: number | null; free?: boolean };
export const lotTotal = (lot?: LotPrice) => (lot?.free ? 0 : (lot?.total ?? undefined));

// Xem trước phiếu nhập: giá mỗi đơn vị của lô và giá bình quân sau phiếu
export function lotPreview(stock: number, cost: number | undefined, quantity: number | null | undefined, lot?: LotPrice) {
  const total = lotTotal(lot);
  if (total === undefined || !quantity) return undefined;
  const price = unitPrice(total, quantity);
  return price === undefined ? undefined : { price, average: averageCost(stock, cost, quantity, price) };
}

// Tiền nguyên liệu cho một bộ nhu cầu (id → lượng). missing: nguyên liệu chưa có giá nhập, không tính vào cost
export function needsCost(needs: Map<string, number>, map: MaterialMap) {
  let cost = 0;
  const missing: Material[] = [];
  for (const [id, quantity] of needs) {
    const m = map.get(id);
    if (!m) continue;
    if (m.unitCost === undefined) missing.push(m);
    else cost += quantity * m.unitCost;
  }
  return { cost: Math.round(cost), missing };
}

type Source = Parameters<typeof orderNeeds>[1];

// Giá vốn đơn: đã Bắt đầu làm thì lấy số đã chốt, chưa làm thì ước tính theo công thức và giá nhập hiện tại
export function orderCost(order: Order, source: Source) {
  if (order.materialCost !== undefined) return { cost: order.materialCost, missing: [] as Material[], final: true };
  return { ...needsCost(orderNeeds(order, source), source.map), final: false };
}

// Giá trị hàng của đơn để tính lãi: tạm tính − giảm giá − tiền hoàn do khiếu nại. Không tính phí giao.
// Hoàn phần thu dư (sau khi sửa đơn) chỉ là trả lại tiền khách trả thừa, không làm giảm giá trị hàng
export const goodsValue = (o: Order) => o.subtotal - o.discount - (o.complaints ?? []).reduce((s, c) => s + (c.refundAmount ?? 0), 0);

export function margin(value: number, cost: number) {
  const profit = value - cost;
  return { profit, percent: value > 0 ? profit / value : null };
}
