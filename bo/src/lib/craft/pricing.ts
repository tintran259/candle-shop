// Giá bán (cấu hình Thủ công) so với giá vốn (giá nhập bình quân trong Kho): mỗi ô giá phải ≥ giá vốn của phần nó trả (docs/pages/craft.md#giá-bán-và-giá-vốn)
//  - Giá hũ + phụ thu cỡ trả cho mã hũ cỡ đó và mục mặc định ở các bước bắt buộc tính giá cố định (vd bấc cotton).
//  - Sáp, màu, hương tính theo lượng: giá bán mỗi 100 g / mỗi ml ≥ giá nhập bình quân cùng đơn vị.
//  - Phụ thu lựa chọn khác trả giá nguyên liệu của nó, trừ phần giá hũ đã trả cho mục mặc định cùng bước.
import { needsCost } from "@/lib/costs";
import { activeSteps, emptySelection, materialNeeds, priceSelection, vesselStep, type CraftSelection, type StepSelection } from "@/lib/craft/selection";
import type { CraftConfig, CraftStep, InputsStep, OptionStep, StepOption, VesselOption, VesselSize } from "@/lib/craft/types";
import { amountBasis, basisLabel } from "@/lib/craft/steps";
import type { MaterialMap } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";

// price: tiền khách trả cho phần này. floor: giá vốn tối thiểu phần này phải bù. missing: nguyên liệu chưa có giá nhập, floor đang thiếu phần này.
// vessel, size: hũ và cỡ dùng để tính. per: so theo đơn vị (vd "100 g", "ml") khi lựa chọn tính giá theo lượng.
// missingParts: phần trong missing thuộc mục mặc định của bước khác tính gộp vào giá hũ (vd bấc) — hiện tách riêng khỏi nguyên liệu của chính hũ
export type PriceCheck = {
  price: number;
  floor: number;
  missing: Material[];
  margin: number | null;
  vessel?: VesselOption;
  size?: VesselSize;
  per?: string;
  missingParts?: { step: string; material: Material }[];
};

const check = (price: number, floor: number, missing: Material[], vessel?: VesselOption, size?: VesselSize): PriceCheck => ({
  price,
  floor,
  missing,
  margin: price > 0 ? (price - floor) / price : null,
  vessel,
  size,
});

// Giá bán thấp hơn giá vốn tối thiểu
export const belowCost = (c: PriceCheck) => c.price < c.floor;
// Lãi dưới mức tối thiểu (%) trong Cài đặt
export const lowMargin = (c: Pick<PriceCheck, "margin">, minPercent: number) => c.margin !== null && c.margin < minPercent / 100;
// Cần xem lại giá: thấp hơn giá vốn, hoặc lãi dưới mức
export const needsReview = (c: PriceCheck, minPercent: number) => belowCost(c) || lowMargin(c, minPercent);

// Giá gợi ý = giá vốn × hệ số, nhưng không thấp hơn mức đạt lãi tối thiểu; làm tròn lên 5.000 ₫
export function suggestPrice(cost: number, { priceMarkup, minMargin }: { priceMarkup: number; minMargin: number }) {
  const floor = minMargin < 100 ? cost / (1 - minMargin / 100) : Infinity;
  return Math.max(0, Math.ceil(Math.max(cost * priceMarkup, floor) / 5000) * 5000);
}

// Khách chỉ cọc rồi không nhận hàng (mất cọc): cọc − nguyên liệu − phí vận chuyển phải ≥ 0.
// shipping: phí giao của đơn, hoặc phí phương thức mặc định ở Cài đặt › Phí vận chuyển khi chưa có đơn (sản phẩm).
// Áp cho giá trọn một cây / cả đơn (sản phẩm trưng bày, đơn hàng), không áp cho phụ thu lẻ ở Thủ công.
// minPrice: giá thấp nhất để cọc đủ bù, làm tròn lên 5.000 ₫
export type DepositCheck = { deposit: number; cost: number; shipping: number; left: number; minPrice: number };
export function depositCheck(price: number, cost: number, { depositPercent, shipping }: { depositPercent: number; shipping: number }): DepositCheck {
  const rate = depositPercent / 100;
  const deposit = Math.round(price * rate);
  return {
    deposit,
    cost,
    shipping,
    left: deposit - cost - shipping,
    minPrice: rate > 0 ? Math.ceil((cost + shipping) / rate / 5000) * 5000 : Infinity,
  };
}
// Khách bỏ cọc thì shop lỗ
export const depositLoss = (d: DepositCheck) => d.left < 0;

// Giá gợi ý cho trọn một cây: theo hệ số và lãi tối thiểu, và đủ để khách bỏ cọc shop không lỗ
export const suggestFullPrice = (cost: number, settings: { priceMarkup: number; minMargin: number; depositPercent: number; shipping: number }) =>
  Math.max(suggestPrice(cost, settings), depositCheck(0, cost, settings).minPrice);

// Giá theo lượng gợi ý (mỗi 100 g / mỗi ml): cùng quy tắc nhưng làm tròn lên 100 ₫
export function suggestUnitPrice(cost: number, { priceMarkup, minMargin }: { priceMarkup: number; minMargin: number }) {
  const floor = minMargin < 100 ? cost / (1 - minMargin / 100) : Infinity;
  return Math.max(0, Math.ceil(Math.max(cost * priceMarkup, floor) / 100) * 100);
}

// Chỉ chọn một lựa chọn ở bước
function only(prev: StepSelection, optionId: string): StepSelection {
  if (prev.kind === "blend") return { ...prev, items: [{ optionId, weight: 1 }] };
  if (prev.kind === "inputs" || prev.kind === "vessel") return prev;
  return { ...prev, optionIds: [optionId] };
}

const costOf = (config: CraftConfig, sel: CraftSelection, map: MaterialMap) => needsCost(materialNeeds(config, sel, map), map);

// Chỉ hũ ở một cỡ, chưa chọn gì khác
const bare = (config: CraftConfig, vessel: VesselOption, size: VesselSize): CraftSelection => ({
  [vesselStep(config)!.id]: { kind: "vessel", optionId: vessel.id, sizeId: size.id, withLid: false },
});

// Một lựa chọn (không phải hũ) trên hũ, cỡ cho trước: giá vốn và tiền khách trả thêm vì nó (phụ thu, phụ thu hương…)
function part(config: CraftConfig, step: OptionStep, option: StepOption, vessel: VesselOption, size: VesselSize, map: MaterialMap) {
  const base = bare(config, vessel, size);
  const sel = { ...base, [step.id]: only(emptySelection(config)[step.id], option.id) };
  const before = costOf(config, base, map);
  const after = costOf(config, sel, map);
  const known = new Set(before.missing.map((m) => m.id));
  return {
    option,
    cost: after.cost - before.cost,
    missing: after.missing.filter((m) => !known.has(m.id)),
    revenue: priceSelection(config, sel).unit - priceSelection(config, base).unit,
  };
}

// Mục mặc định của bước: phụ thu thấp nhất, bằng nhau thì giá vốn thấp hơn
function defaultPart(config: CraftConfig, step: OptionStep, vessel: VesselOption, size: VesselSize, map: MaterialMap) {
  return (step.options as StepOption[])
    .filter((o) => o.available)
    .map((o) => part(config, step, o, vessel, size, map))
    .sort((a, b) => a.revenue - b.revenue || a.cost - b.cost)[0];
}

// Bước có mục mặc định nằm trong giá hũ: bắt buộc, không phải bước hũ, không tính theo lượng (sáp, màu, hương khách trả riêng)
const coveredByJar = (s: CraftStep): s is OptionStep => s.kind !== "vessel" && s.kind !== "inputs" && s.required && !amountBasis(s);
// Phần giá vốn mục mặc định chưa có phụ thu bù
const uncovered = (d?: { cost: number; revenue: number }) => (d ? Math.max(0, d.cost - Math.max(0, d.revenue)) : 0);

export type SizeCheck = PriceCheck & { parts: { step: string; name: string; cost: number }[] };

// Giá hũ + phụ thu cỡ ≥ giá vốn mã hũ cỡ đó + các mục mặc định chưa có phụ thu bù
export function sizeCheck(config: CraftConfig, vessel: VesselOption, size: VesselSize, map: MaterialMap): SizeCheck {
  const jar = costOf(config, bare(config, vessel, size), map);
  const name = (size.materialId && map.get(size.materialId)?.name) || `${vessel.name.vi} ${size.ml}ml`;
  const parts: SizeCheck["parts"] = jar.cost > 0 ? [{ step: "Hũ", name, cost: jar.cost }] : [];
  const missing = [...jar.missing];
  const missingParts: { step: string; material: Material }[] = [];
  for (const step of activeSteps(config).filter(coveredByJar)) {
    const d = defaultPart(config, step, vessel, size, map);
    if (!d) continue;
    missing.push(...d.missing);
    missingParts.push(...d.missing.map((material) => ({ step: step.title.vi, material })));
    if (uncovered(d) > 0) parts.push({ step: step.title.vi, name: d.option.name.vi, cost: uncovered(d) });
  }
  const price = vessel.priceDelta + size.priceDelta;
  return {
    ...check(
      price,
      parts.reduce((s, p) => s + p.cost, 0),
      missing,
      vessel,
      size,
    ),
    missingParts,
    parts,
  };
}

// Nắp: phụ thu nắp ≥ giá vốn mã nắp của từng cỡ đang bán. Lấy cỡ thiếu nhiều nhất; không có nắp hoặc nắp không theo dõi tồn thì null
export function lidCheck(vessel: VesselOption, map: MaterialMap): PriceCheck | null {
  if (!vessel.lid) return null;
  let worst: PriceCheck | null = null;
  for (const size of vessel.sizes.filter((s) => s.available && s.lidMaterialId)) {
    const m = map.get(size.lidMaterialId!);
    if (!m?.tracked) continue;
    const cost = needsCost(new Map([[m.id, 1]]), map);
    const c = check(vessel.lid.priceDelta, cost.cost, cost.missing, vessel, size);
    if (worse(worst, c)) worst = c;
  }
  return worst;
}

// Ô nhập chữ, tuỳ chọn thêm (hộp quà, in nhãn…): phụ thu ≥ giá vốn 1 cái nguyên liệu gắn kèm. Không gắn nguyên liệu thì null
export function itemCheck(price: number, materialId: string | undefined, map: MaterialMap): PriceCheck | null {
  const m = materialId ? map.get(materialId) : undefined;
  if (!m?.tracked) return null;
  const cost = needsCost(new Map([[m.id, 1]]), map);
  return check(price, cost.cost, cost.missing);
}

// Các ô nhập và tuỳ chọn đang hiện của bước Cá nhân hóa: { tên, kiểm tra giá }
export function inputsChecks(step: InputsStep, map: MaterialMap) {
  return [
    ...step.fields.filter((f) => f.enabled).map((f) => ({ id: f.id, name: f.label.vi, check: itemCheck(f.priceDelta, f.materialId, map) })),
    ...step.addons.filter((a) => a.enabled && a.available).map((a) => ({ id: a.id, name: a.name.vi, check: itemCheck(a.priceDelta, a.materialId, map) })),
  ].filter((x): x is { id: string; name: string; check: PriceCheck } => !!x.check);
}

// Bản cấu hình có lựa chọn này (lựa chọn đang sửa trong drawer chưa nằm trong cấu hình), bước coi như đang hiện
function withOption(config: CraftConfig, step: OptionStep, option: StepOption): CraftConfig {
  const list = step.options as StepOption[];
  const options = list.some((o) => o.id === option.id) ? list.map((o) => (o.id === option.id ? option : o)) : [...list, option];
  return { ...config, steps: config.steps.map((s) => (s.id === step.id ? ({ ...s, enabled: true, options } as CraftStep) : s)) };
}

const gap = (c: PriceCheck) => c.floor - c.price;
// Chọn cỡ thiếu nhiều nhất, không thiếu thì cỡ tốn nhất
const worse = (a: PriceCheck | null, b: PriceCheck) => !a || gap(b) > gap(a) || (gap(b) === gap(a) && b.floor > a.floor);

export type OptionCheck = PriceCheck & { isDefault: boolean };

// Mọi cỡ đang bán của các hũ đang bán — để so lựa chọn tính theo gram (sáp, màu, hương)
const jarSizes = (config: CraftConfig) => (vesselStep(config)?.options ?? []).filter((v) => v.available).flatMap((v) => v.sizes.filter((s) => s.available).map((size) => ({ vessel: v, size })));

// Hũ: giá hũ + phụ thu cỡ so với vốn từng cỡ. Lựa chọn khác: phụ thu ≥ giá vốn của nó (trừ phần mục mặc định đã tính trong giá hũ)
export function optionCheck(config: CraftConfig, step: OptionStep, option: StepOption, map: MaterialMap): OptionCheck | null {
  const cfg = withOption(config, step, option);
  let worst: OptionCheck | null = null;
  if (step.kind === "vessel") {
    const v = option as VesselOption;
    for (const size of v.sizes.filter((s) => s.available)) {
      const c = { ...sizeCheck(cfg, v, size, map), isDefault: false };
      if (worse(worst, c)) worst = c;
    }
    return worst;
  }
  // Tính theo lượng: giá bán mỗi 100 g / mỗi ml so với giá nhập bình quân cùng đơn vị
  const basis = amountBasis(step);
  if (basis) {
    const m = option.materialId ? map.get(option.materialId) : undefined;
    const floor = m?.unitCost !== undefined ? Math.round(m.unitCost * basis.per) : 0;
    return { ...check(option.unitPrice ?? 0, floor, m && m.unitCost === undefined ? [m] : []), per: basisLabel(basis), isDefault: false };
  }
  const s = cfg.steps.find((x) => x.id === step.id) as OptionStep;
  for (const { vessel, size } of jarSizes(cfg)) {
    const p = part(cfg, s, option, vessel, size, map);
    const d = coveredByJar(s) ? defaultPart(cfg, s, vessel, size, map) : undefined;
    const c = { ...check(p.revenue, Math.max(0, p.cost - uncovered(d)), p.missing, vessel, size), isDefault: d?.option.id === option.id };
    if (worse(worst, c)) worst = c;
  }
  return worst;
}

// Từng cỡ của một hũ (kể cả hũ đang sửa trong drawer, chưa nằm trong cấu hình): { id cỡ: kiểm tra giá }
export function vesselSizeChecks(config: CraftConfig, step: OptionStep, vessel: VesselOption, map: MaterialMap) {
  const cfg = withOption(config, step, vessel);
  return new Map(vessel.sizes.map((size) => [size.id, sizeCheck(cfg, vessel, size, map)]));
}
