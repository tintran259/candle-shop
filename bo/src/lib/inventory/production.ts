// Sản xuất trong xưởng: thành phẩm (vd hũ gốm) làm từ nguyên liệu khác trong Kho (thạch cao, màu…)
// theo định mức cho 1 đơn vị (docs/pages/inventory.md#sản-xuất)
import { needsCost } from "@/lib/costs";
import { unitLabel } from "@/lib/craft/groups";
import { formatNumber } from "@/lib/format";
import type { MaterialMap } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";
import type { RecipeLine } from "@/lib/products/types";

export const isMade = (m?: Pick<Material, "recipe">) => !!m?.recipe?.length;

// Lượng cần cho một mẻ: định mức × số lượng làm
export function batchNeeds(recipe: RecipeLine[], count: number) {
  const needs = new Map<string, number>();
  for (const r of recipe) if (r?.materialId && r.quantity > 0) needs.set(r.materialId, (needs.get(r.materialId) ?? 0) + r.quantity * count);
  return needs;
}

export type BatchLine = { material: Material; need: number; short: boolean };

// Một mẻ cần gì: từng nguyên liệu cần bao nhiêu, có thiếu không; tiền nguyên liệu tiêu tốn (missing: chưa có giá).
// gone: nguyên liệu trong công thức đã bị xóa khỏi Kho
export function batchPlan(recipe: RecipeLine[], count: number, map: MaterialMap) {
  const needs = batchNeeds(recipe, count);
  const lines: BatchLine[] = [];
  const gone: string[] = [];
  for (const [id, need] of needs) {
    const m = map.get(id);
    if (m) lines.push({ material: m, need, short: m.tracked && need > m.stock });
    else gone.push(id);
  }
  const { cost, missing } = needsCost(needs, map);
  return { lines, cost, missing, gone, short: lines.filter((l) => l.short) };
}
export type BatchPlan = ReturnType<typeof batchPlan>;

// Giá mẻ: theo tiền nguyên liệu tiêu tốn, hoặc tự nhập tổng chi phí (thêm điện nung, tiền công…)
export type BatchPrice = { manual?: boolean; total?: number | null };

export const batchTotal = (plan: BatchPlan, price?: BatchPrice) =>
  price?.manual ? (price.total ?? undefined) : plan.missing.length || plan.gone.length ? undefined : plan.cost;

// Lý do chưa ghi được mẻ (null = ghi được)
export function batchError(plan: BatchPlan, price: BatchPrice | undefined, count: number | null | undefined) {
  if (!count || count <= 0) return "Nhập số lượng sản xuất lớn hơn 0.";
  if (plan.gone.length) return "Công thức có nguyên liệu đã bị xóa khỏi Kho — sửa phần Sản xuất từ.";
  if (plan.short.length)
    return `Không đủ ${plan.short.map((l) => `${l.material.name} (cần ${formatNumber(l.need)} ${unitLabel[l.material.unit]}, còn ${formatNumber(l.material.stock)})`).join(", ")}.`;
  if (!price?.manual && plan.missing.length) return `${plan.missing.map((m) => m.name).join(", ")} chưa có giá nhập — đặt giá trong Kho, hoặc chọn Tự nhập giá.`;
  if (price?.manual && (price.total === null || price.total === undefined)) return "Nhập tổng chi phí cả mẻ.";
  return null;
}

// Nguyên liệu `id` có dùng `target` trong công thức (trực tiếp hoặc qua bán thành phẩm khác) không — chặn vòng
export function madeFrom(map: MaterialMap, id: string, target: string, seen = new Set<string>()): boolean {
  if (seen.has(id)) return false;
  seen.add(id);
  return (map.get(id)?.recipe ?? []).some((r) => r.materialId === target || madeFrom(map, r.materialId, target, seen));
}

// Thành phẩm đang dùng nguyên liệu này trong công thức
export const madeWith = (materials: Material[], id: string) => materials.filter((m) => m.recipe?.some((r) => r.materialId === id));
