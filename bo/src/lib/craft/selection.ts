// Lựa chọn của khách trên trình dựng Thủ công (CraftSelection) → giá, mô tả, nguyên liệu tiêu hao, kiểm tra hợp lệ.
// Đúng công thức ở docs/craft-builder.md (mục 6–8) và docs/inventory.md (mục 6) — web và BE dùng cùng cách tính.
import { sizeLabel } from "@/lib/craft/groups";
import { amountBasis, intensityLabels } from "@/lib/craft/steps";
import type { BlendStep, CraftConfig, CraftStep, IntensityLevel, StepOption, VesselOption, VesselStep } from "@/lib/craft/types";
import { lidLevel, optionLevel, sellable, vesselSizeLevel, type MaterialMap } from "@/lib/inventory/stock";
import type { RecipeLine } from "@/lib/products/types";

// Lượng admin tự điền cho 1 hũ theo id lựa chọn; không có thì dùng lượng mặc định
type Amounts = { amounts?: Record<string, number> };

export type StepSelection =
  | { kind: "vessel"; optionId?: string; sizeId?: string; withLid: boolean }
  | ({ kind: "cards" | "swatches"; optionIds: string[] } & Amounts)
  | ({ kind: "blend"; items: { optionId: string; weight: number }[]; intensity: IntensityLevel | null } & Amounts)
  | ({ kind: "inputs"; values: Record<string, string>; addons: string[] } & Amounts);
export type CraftSelection = Record<string, StepSelection>;

// Tải lượng tinh dầu mặc định khi bước không có độ đậm
const DEFAULT_LOAD = 0.08;

export const activeSteps = (config: CraftConfig) => config.steps.filter((s) => s.enabled);
export const vesselStep = (config: CraftConfig) => config.steps.find((s): s is VesselStep => s.kind === "vessel");

// Lựa chọn trống cho từng bước đang hiện
export function emptySelection(config: CraftConfig): CraftSelection {
  return Object.fromEntries(
    activeSteps(config).map((s): [string, StepSelection] => {
      if (s.kind === "vessel") return [s.id, { kind: "vessel", withLid: false }];
      if (s.kind === "blend") return [s.id, { kind: "blend", items: [], intensity: s.intensity ? "medium" : null }];
      if (s.kind === "inputs") return [s.id, { kind: "inputs", values: {}, addons: [] }];
      return [s.id, { kind: s.kind, optionIds: [] }];
    }),
  );
}

// Tỉ lệ phối quy ra % — làm tròn phần dư lớn nhất để tổng luôn = 100
export function blendShares(items: { optionId: string; weight: number }[]) {
  const total = items.reduce((s, i) => s + Math.max(0, i.weight), 0);
  if (!total) return items.map((i) => ({ ...i, percent: 0 }));
  const raw = items.map((i) => (Math.max(0, i.weight) / total) * 100);
  const out = raw.map(Math.floor);
  const order = raw.map((r, i) => ({ i, frac: r - Math.floor(r) })).sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < 100 - out.reduce((s, p) => s + p, 0); k++) out[order[k % order.length].i]++;
  return items.map((i, k) => ({ ...i, percent: out[k] }));
}

// Tỉ lệ phối thực tế: admin điền ml thì tính theo ml, không thì theo tỉ lệ đã chọn
export function blendRatios(step: BlendStep, sel: Extract<StepSelection, { kind: "blend" }>, grams: number) {
  const shares = blendShares(sel.items);
  if (!sel.items.some((i) => sel.amounts?.[i.optionId])) return shares;
  const load = step.intensity && sel.intensity ? step.intensity.load[sel.intensity] : DEFAULT_LOAD;
  return blendShares(shares.map((i) => ({ optionId: i.optionId, weight: sel.amounts?.[i.optionId] ?? (grams * load * i.percent) / 100 })));
}

// Chọn hoặc bỏ một mục: mục đứng riêng (Không màu) xóa các mục khác và ngược lại
export function pickOption(ids: string[], option: StepOption, options: StepOption[], multi: boolean, max?: number) {
  if (ids.includes(option.id)) return ids.filter((x) => x !== option.id);
  if (!multi || option.exclusive) return [option.id];
  const rest = ids.filter((x) => !options.find((o) => o.id === x)?.exclusive);
  return [...(max && rest.length >= max ? rest.slice(1) : rest), option.id];
}

const optionsOf = (step: CraftStep) => (step.kind === "inputs" ? [] : (step.options as StepOption[]));
const findOption = (step: CraftStep, id?: string) => optionsOf(step).find((o) => o.id === id);

// Các lựa chọn khách đang chọn ở một bước (để kiểm tra onlyWith)
function chosenIds(sel?: StepSelection): string[] {
  if (!sel) return [];
  if (sel.kind === "vessel") return sel.optionId ? [sel.optionId] : [];
  if (sel.kind === "blend") return sel.items.map((i) => i.optionId);
  if (sel.kind === "inputs") return [];
  return sel.optionIds;
}

// Giá thấp nhất của hũ trong các cỡ đang bán (giá hũ + phụ thu cỡ)
export function jarFrom(o: VesselOption) {
  const deltas = o.sizes.filter((s) => s.available).map((s) => s.priceDelta);
  return o.priceDelta + (deltas.length ? Math.min(...deltas) : 0);
}

// Cỡ đang chọn — cỡ thuộc từng loại hũ nên tìm trong hũ đang chọn
export function selectedSize(config: CraftConfig, selection: CraftSelection) {
  const vessel = vesselStep(config);
  const sel = vessel && selection[vessel.id];
  if (!vessel || sel?.kind !== "vessel") return undefined;
  return vessel.options.find((o) => o.id === sel.optionId)?.sizes.find((s) => s.id === sel.sizeId);
}

// Lựa chọn có dùng được không: còn bán, còn nguyên liệu, hợp quy tắc "chỉ dùng với", không quá lượng sáp tối đa
export function optionBlock(config: CraftConfig, selection: CraftSelection, step: CraftStep, option: StepOption, map: MaterialMap): string | null {
  if (!option.available) return "Tạm ẩn";
  if (!sellable(option, map)) return "Hết nguyên liệu";
  const size = selectedSize(config, selection);
  if (option.maxGrams && size && size.grams > option.maxGrams) return `Tối đa ${option.maxGrams}g sáp`;
  for (const [stepId, allowed] of Object.entries(option.onlyWith ?? {})) {
    const other = config.steps.find((s) => s.id === stepId);
    if (!other?.enabled || other.id === step.id) continue;
    const picked = chosenIds(selection[stepId]);
    if (picked.length && !picked.every((id) => allowed.includes(id))) return `Không hợp với ${other.title.vi.toLowerCase()} đã chọn`;
  }
  return null;
}

// base: dòng giá hũ theo cỡ (không phải phụ thu)
// Lượng nguyên liệu của từng lựa chọn đã chọn ở bước tính theo lượng: { id lựa chọn: g hoặc ml cho 1 hũ }.
// Sáp, màu: lượng sáp đổ × hệ số gram, chia đều khi chọn nhiều (admin điền lượng thì theo lượng đó). Hương: lượng sáp × tỉ lệ hương × % phối
export function stepAmounts(step: CraftStep, sel: StepSelection, grams: number): Map<string, number> {
  const out = new Map<string, number>();
  if (step.kind === "blend" && sel.kind === "blend") {
    const load = step.intensity && sel.intensity ? step.intensity.load[sel.intensity] : DEFAULT_LOAD;
    for (const i of blendShares(sel.items)) out.set(i.optionId, sel.amounts?.[i.optionId] ?? (grams * load * i.percent) / 100);
  } else if ((step.kind === "cards" || step.kind === "swatches") && (sel.kind === "cards" || sel.kind === "swatches")) {
    for (const id of sel.optionIds) out.set(id, sel.amounts?.[id] ?? (grams * (step.gramsPerGram ?? 1)) / Math.max(1, sel.optionIds.length));
  }
  return out;
}

// Giá theo lượng làm tròn tới 100 ₫: 120 g × 2.000 ₫/100 g = 2.400 ₫
const round100 = (n: number) => Math.round(n / 100) * 100;
export function amountPrice(step: CraftStep, option: StepOption, amount: number) {
  const basis = amountBasis(step);
  return basis && option.unitPrice ? round100((amount * option.unitPrice) / basis.per) : 0;
}
const amountText = (n: number) => (Math.round(n * 10) / 10).toLocaleString("vi-VN");

export type PriceLine = { stepId: string; label: string; amount: number; base?: boolean };

// Giá 1 hũ = giá hũ + phụ thu cỡ của hũ đó + phụ thu từng bước
export function priceSelection(config: CraftConfig, selection: CraftSelection): { unit: number; lines: PriceLine[] } {
  const lines: PriceLine[] = [];
  const grams = selectedSize(config, selection)?.grams ?? 0;
  for (const step of activeSteps(config)) {
    const sel = selection[step.id];
    if (!sel) continue;
    if (step.kind === "vessel" && sel.kind === "vessel") {
      const o = findOption(step, sel.optionId) as VesselOption | undefined;
      const size = o?.sizes.find((s) => s.id === sel.sizeId);
      if (o) lines.push({ stepId: step.id, label: size ? `${o.name.vi} ${sizeLabel(size)}` : o.name.vi, amount: o.priceDelta + (size?.priceDelta ?? 0), base: true });
      if (o?.lid && sel.withLid) lines.push({ stepId: step.id, label: "Nắp", amount: o.lid.priceDelta });
    } else if (step.kind === "blend" && sel.kind === "blend") {
      // Mỗi mùi: ml dùng cho hũ (lượng sáp × tỉ lệ hương × % phối) × giá mỗi ml
      for (const [id, ml] of stepAmounts(step, sel, grams)) {
        const o = findOption(step, id);
        if (o && !o.exclusive) lines.push({ stepId: step.id, label: `${o.name.vi} ${amountText(ml)} ml`, amount: amountPrice(step, o, ml) });
      }
    } else if (step.kind === "inputs" && sel.kind === "inputs") {
      for (const f of step.fields) if (f.enabled && sel.values[f.id]?.trim()) lines.push({ stepId: step.id, label: f.label.vi, amount: f.priceDelta });
      for (const a of step.addons) if (a.enabled && sel.addons.includes(a.id)) lines.push({ stepId: step.id, label: a.name.vi, amount: a.priceDelta });
    } else if ((step.kind === "cards" || step.kind === "swatches") && (sel.kind === "cards" || sel.kind === "swatches")) {
      const basis = amountBasis(step);
      if (basis) {
        // Sáp, màu: lượng dùng cho hũ (chia theo % khi chọn nhiều) × giá mỗi 100 g / mỗi ml
        for (const [id, amount] of stepAmounts(step, sel, grams)) {
          const o = findOption(step, id);
          if (o) lines.push({ stepId: step.id, label: o.exclusive || !o.unitPrice ? o.name.vi : `${o.name.vi} ${amountText(amount)} ${basis.unit}`, amount: amountPrice(step, o, amount) });
        }
      } else
        for (const id of sel.optionIds) {
          const o = findOption(step, id);
          if (o) lines.push({ stepId: step.id, label: o.name.vi, amount: o.priceDelta });
        }
    }
  }
  return { unit: lines.reduce((s, l) => s + l.amount, 0), lines };
}

// Mô tả cho xưởng & khách, vd "Hũ gốm 150ml · Có nắp · Sáp đậu nành · Vanilla 70% + Lavender 30% (vừa) · Nhãn “Sun”"
export function describeSelection(config: CraftConfig, selection: CraftSelection) {
  const parts: string[] = [];
  const grams = selectedSize(config, selection)?.grams ?? 0;
  for (const step of activeSteps(config)) {
    const sel = selection[step.id];
    if (!sel) continue;
    if (step.kind === "vessel" && sel.kind === "vessel") {
      const o = findOption(step, sel.optionId) as VesselOption | undefined;
      const size = o?.sizes.find((s) => s.id === sel.sizeId);
      if (o) parts.push([o.name.vi, size && sizeLabel(size)].filter(Boolean).join(" "));
      if (sel.withLid) parts.push("Có nắp");
    } else if (step.kind === "blend" && sel.kind === "blend" && sel.items.length) {
      const shares = blendRatios(step, sel, grams);
      const names = shares.map((i) => `${findOption(step, i.optionId)?.name.vi ?? i.optionId}${shares.length > 1 ? ` ${i.percent}%` : ""}`).join(" + ");
      parts.push(sel.intensity ? `${names} (${intensityLabels[sel.intensity].toLowerCase()})` : names);
    } else if (step.kind === "inputs" && sel.kind === "inputs") {
      for (const f of step.fields) if (f.enabled && sel.values[f.id]?.trim()) parts.push(`${f.label.vi} “${sel.values[f.id].trim()}”`);
      for (const a of step.addons) if (sel.addons.includes(a.id)) parts.push(a.name.vi);
    } else if (sel.kind === "cards" || sel.kind === "swatches") {
      for (const id of sel.optionIds) {
        const o = findOption(step, id);
        if (o) parts.push(o.name.vi);
      }
    }
  }
  return parts.join(" · ");
}

// Một nguyên liệu admin chỉnh được lượng. fallback là lượng mặc định, amount là lượng admin điền
export type MaterialLine = { stepId: string; optionId: string; name: string; materialId: string; fallback: number; amount?: number };

// Bước Sáp và Màu sáp: chọn nhiều loại thì không điền lượng sẽ chia đều, phụ thu theo tỉ lệ lượng
export const isWaxStep = (step: CraftStep) => step.id === "wax";
export const isMixStep = (step: CraftStep) => isWaxStep(step) || step.kind === "swatches";

// Các nguyên liệu theo lựa chọn, không gồm hũ và nắp (luôn 1 cái mỗi hũ)
export function materialLines(config: CraftConfig, selection: CraftSelection, map: MaterialMap) {
  const lines: MaterialLine[] = [];
  const grams = selectedSize(config, selection)?.grams ?? 0;
  // Nguyên liệu tính theo cái trừ 1; theo g/ml trừ theo khối lượng
  const byUnit = (id: string | undefined, gramsAmount: number) => (id && map.get(id)?.unit !== "pcs" ? Math.ceil(gramsAmount) : 1);
  const push = (step: CraftStep, sel: Exclude<StepSelection, { kind: "vessel" }>, optionId: string, name: string, materialId: string | undefined, fallback: number) => {
    if (materialId && map.get(materialId)?.tracked) lines.push({ stepId: step.id, optionId, name, materialId, fallback, amount: sel.amounts?.[optionId] });
  };
  for (const step of activeSteps(config)) {
    const sel = selection[step.id];
    if (!sel) continue;
    if (step.kind === "blend" && sel.kind === "blend") {
      const load = step.intensity && sel.intensity ? step.intensity.load[sel.intensity] : DEFAULT_LOAD;
      for (const i of blendShares(sel.items)) {
        const o = findOption(step, i.optionId);
        if (o && !o.exclusive) push(step, sel, o.id, o.name.vi, o.materialId, byUnit(o.materialId, (grams * load * i.percent) / 100));
      }
    } else if (step.kind === "inputs" && sel.kind === "inputs") {
      for (const a of step.addons) if (sel.addons.includes(a.id)) push(step, sel, a.id, a.name.vi, a.materialId, 1);
    } else if ((step.kind === "cards" || step.kind === "swatches") && (sel.kind === "cards" || sel.kind === "swatches")) {
      const share = isMixStep(step) ? Math.max(1, sel.optionIds.length) : 1;
      for (const id of sel.optionIds) {
        const o = findOption(step, id);
        if (o) push(step, sel, o.id, o.name.vi, o.materialId, byUnit(o.materialId, (grams * (step.gramsPerGram ?? 1)) / share));
      }
    }
  }
  return lines;
}

// Lượng nguyên liệu cho 1 hũ: { materialId: lượng theo đơn vị của nguyên liệu }
export function materialNeeds(config: CraftConfig, selection: CraftSelection, map: MaterialMap) {
  const needs = new Map<string, number>();
  const add = (id: string | undefined, amount: number) => {
    const m = id ? map.get(id) : undefined;
    if (!id || !m?.tracked || amount <= 0) return;
    needs.set(id, (needs.get(id) ?? 0) + amount);
  };
  const vessel = vesselStep(config);
  const sel = vessel?.enabled ? selection[vessel.id] : undefined;
  if (vessel && sel?.kind === "vessel") {
    const o = findOption(vessel, sel.optionId) as VesselOption | undefined;
    const size = o?.sizes.find((s) => s.id === sel.sizeId);
    add(size?.materialId, 1);
    if (o?.lid && sel.withLid) add(size?.lidMaterialId, 1);
  }
  for (const line of materialLines(config, selection, map)) add(line.materialId, line.amount ?? line.fallback);
  return needs;
}

// Bản chụp công thức 1 hũ lưu vào đơn
export const toRecipe = (needs: Map<string, number>): RecipeLine[] => [...needs].map(([materialId, quantity]) => ({ materialId, quantity }));

// Số hũ tối đa làm được với tồn kho hiện tại (Infinity = không nguyên liệu nào theo dõi)
export function maxJars(needs: Map<string, number>, map: MaterialMap) {
  let n = Infinity;
  for (const [id, need] of needs) n = Math.min(n, Math.floor((map.get(id)?.stock ?? 0) / need));
  return n;
}

export type SelectionIssue = { stepId: string; message: string };

// Kiểm tra trước khi thêm vào đơn — giống BE kiểm tra lúc tạo đơn (docs/craft-builder.md mục 9.5)
export function validateSelection(config: CraftConfig, selection: CraftSelection, map: MaterialMap): SelectionIssue[] {
  const issues: SelectionIssue[] = [];
  for (const step of activeSteps(config)) {
    const sel = selection[step.id];
    const push = (message: string) => issues.push({ stepId: step.id, message });
    if (step.kind === "vessel" && sel?.kind === "vessel") {
      const o = findOption(step, sel.optionId) as VesselOption | undefined;
      if (!o) push("Chọn hũ.");
      else if (!sel.sizeId) push("Chọn kích thước.");
      else if (vesselSizeLevel(o, sel.sizeId, map) === "out") push("Cỡ này đã hết hũ.");
      else if (sel.withLid && lidLevel(o, sel.sizeId, map) === "out") push("Nắp cỡ này đã hết.");
      continue;
    }
    if (step.kind === "inputs" && sel?.kind === "inputs") {
      if (step.required && !Object.values(sel.values).some((v) => v.trim()) && !sel.addons.length) push("Nhập ít nhất một ô hoặc chọn tuỳ chọn.");
      for (const f of step.fields) if ((sel.values[f.id]?.trim().length ?? 0) > f.maxLength) push(`${f.label.vi} quá ${f.maxLength} ký tự.`);
      for (const a of step.addons) if (sel.addons.includes(a.id) && (!a.available || optionLevel(a.materialId, map) === "out")) push(`${a.name.vi} đã hết.`);
      continue;
    }
    const ids = chosenIds(sel);
    if (step.required && !ids.length) push("Chưa chọn.");
    for (const id of ids) {
      const o = findOption(step, id);
      const block = o ? optionBlock(config, selection, step, o, map) : "Không còn";
      if (block) push(`${o?.name.vi ?? id}: ${block.toLowerCase()}.`);
    }
    if (step.kind === "blend" && sel?.kind === "blend" && sel.items.length > 1 && sel.items.some((i) => findOption(step, i.optionId)?.exclusive))
      push("Mục “không phối thêm” phải chọn riêng.");
  }
  return issues;
}

