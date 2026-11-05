// Chuyển cấu hình Thủ công lưu theo cấu trúc cũ sang cấu trúc hiện tại (docs/craft-builder.md)
import { amountBasis } from "@/lib/craft/steps";
import type { CraftStep, StepOption, VesselOption, VesselSize } from "@/lib/craft/types";

// Bản lưu trước khi cỡ thuộc từng hũ: bước có kích thước chung (giá bán gốc theo cỡ) + phụ thu hũ.
// Chuyển thành mỗi hũ có giá hũ (= phụ thu cũ + giá bán gốc của cỡ nhỏ nhất) và phụ thu cỡ (phần chênh) — giá khách trả không đổi
type LegacySize = { id: string; ml: number; grams: number; burnHours?: number; basePrice: number; available: boolean };
type LegacyVessel = VesselOption & { supportedSizeIds?: string[]; sizeMaterials?: Record<string, { materialId?: string; lidMaterialId?: string }> };
export function splitSharedSizes(step: CraftStep): CraftStep {
  if (step.kind !== "vessel" || !("sizes" in step)) return step;
  const { sizes: shared, ...rest } = step as typeof step & { sizes: LegacySize[] };
  const options = (step.options as LegacyVessel[]).map(({ supportedSizeIds = [], sizeMaterials = {}, ...o }) => {
    const own = shared.filter((x) => supportedSizeIds.includes(x.id));
    const min = own.length ? Math.min(...own.map((x) => x.basePrice)) : 0;
    const sizes: VesselSize[] = own.map(({ basePrice, ...x }) => ({ ...x, priceDelta: basePrice - min, ...sizeMaterials[x.id] }));
    return { ...o, priceDelta: o.priceDelta + min, sizes };
  });
  return { ...rest, options };
}

// Bản lưu trước khi sáp, màu, hương tính theo lượng: phụ thu cố định (và phụ thu hương) đổi ra giá mỗi 100 g / mỗi ml,
// lấy theo lượng của hũ 160 g sáp — gần đúng, admin xem lại ở trang Thủ công. Bỏ phụ thu hương và phụ thu độ đậm
const REF_GRAMS = 160;
type LegacyBlend = { scentPrice?: { basePrice: number; standardLoad: number }; intensity?: { priceDelta?: unknown; load: Record<string, number> } | null };
export function toAmountPricing(step: CraftStep): CraftStep {
  const basis = amountBasis(step);
  if (!basis || step.kind === "vessel" || step.kind === "inputs") return step;
  const legacy = step as typeof step & LegacyBlend;
  const scent = step.kind === "blend" ? (legacy.scentPrice?.basePrice ?? 0) : 0;
  const ref = step.kind === "blend" ? REF_GRAMS * (legacy.scentPrice?.standardLoad ?? 0.08) : REF_GRAMS * (step.gramsPerGram ?? 1);
  const options = (step.options as StepOption[]).map((o) =>
    "unitPrice" in o || o.exclusive || !o.materialId ? o : { ...o, priceDelta: 0, unitPrice: Math.round(((o.priceDelta + scent) * basis.per) / ref / 100) * 100 },
  );
  const { scentPrice: _scent, ...rest } = legacy;
  void _scent;
  const intensity = rest.intensity ? { load: rest.intensity.load } : rest.intensity;
  return { ...rest, options, ...(step.kind === "blend" ? { intensity } : {}) } as CraftStep;
}
