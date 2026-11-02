// Lựa chọn của khách trên trình dựng Thủ công (CraftSelection) → giá, mô tả, nguyên liệu tiêu hao, kiểm tra hợp lệ.
// Đúng công thức ở docs/craft-builder.md (mục 6–8) và docs/inventory.md (mục 6) — web và BE dùng cùng cách tính.
import { sizeLabel } from "@/lib/craft/groups";
import { intensityLabels } from "@/lib/craft/steps";
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

// Lượng hương cho 1 hũ so với mức chuẩn
export function scentVolume(step: BlendStep, sel: Extract<StepSelection, { kind: "blend" }>, grams: number) {
  const load = step.intensity && sel.intensity ? step.intensity.load[sel.intensity] : DEFAULT_LOAD;
  const shares = blendShares(sel.items).filter((i) => !optionsOf(step).find((o) => o.id === i.optionId)?.exclusive);
  return { items: shares.length, ml: shares.reduce((s, i) => s + (sel.amounts?.[i.optionId] ?? (grams * load * i.percent) / 100), 0), standard: grams * (step.scentPrice?.standardLoad ?? 0) };
}

// Phụ thu hương: tới mức chuẩn là giá mặc định, vượt thì tăng theo tỉ lệ ml, làm tròn tới nghìn đồng. percent chỉ có khi vượt
function scentCharge(step: BlendStep, sel: Extract<StepSelection, { kind: "blend" }>, grams: number) {
  const base = step.scentPrice?.basePrice;
  const { items, ml, standard } = scentVolume(step, sel, grams);
  if (!base || !items) return null;
  if (!standard || ml <= standard) return { amount: base };
  return { amount: Math.round((base * ml) / standard / 1000) * 1000, percent: Math.round((ml / grams) * 100) };
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

export function selectedSize(config: CraftConfig, selection: CraftSelection) {
  const vessel = vesselStep(config);
  const sel = vessel && selection[vessel.id];
  return vessel && sel?.kind === "vessel" ? vessel.sizes.find((s) => s.id === sel.sizeId) : undefined;
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

export type PriceLine = { stepId: string; label: string; amount: number };

// Giá 1 hũ = giá gốc theo cỡ + phụ thu từng bước
export function priceSelection(config: CraftConfig, selection: CraftSelection): { unit: number; lines: PriceLine[] } {
  const lines: PriceLine[] = [];
  const grams = selectedSize(config, selection)?.grams ?? 0;
  for (const step of activeSteps(config)) {
    const sel = selection[step.id];
    if (!sel) continue;
    if (step.kind === "vessel" && sel.kind === "vessel") {
      const size = step.sizes.find((s) => s.id === sel.sizeId);
      const o = findOption(step, sel.optionId) as VesselOption | undefined;
      if (size) lines.push({ stepId: step.id, label: `Giá gốc ${sizeLabel(size)}`, amount: size.basePrice });
      if (o) lines.push({ stepId: step.id, label: o.name.vi, amount: o.priceDelta });
      if (o?.lid && sel.withLid) lines.push({ stepId: step.id, label: "Nắp", amount: o.lid.priceDelta });
    } else if (step.kind === "blend" && sel.kind === "blend") {
      const shares = blendRatios(step, sel, grams);
      const sum = Math.round(shares.reduce((s, i) => s + (findOption(step, i.optionId)?.priceDelta ?? 0) * i.percent, 0) / 100);
      if (shares.length) lines.push({ stepId: step.id, label: step.title.vi, amount: sum });
      const scent = scentCharge(step, sel, grams);
      if (scent) lines.push({ stepId: step.id, label: scent.percent ? `Hương ${scent.percent}%` : "Hương chuẩn", amount: scent.amount });
      if (step.intensity && sel.intensity) lines.push({ stepId: step.id, label: `Độ đậm ${intensityLabels[sel.intensity].toLowerCase()}`, amount: step.intensity.priceDelta[sel.intensity] });
    } else if (step.kind === "inputs" && sel.kind === "inputs") {
      for (const f of step.fields) if (f.enabled && sel.values[f.id]?.trim()) lines.push({ stepId: step.id, label: f.label.vi, amount: f.priceDelta });
      for (const a of step.addons) if (a.enabled && sel.addons.includes(a.id)) lines.push({ stepId: step.id, label: a.name.vi, amount: a.priceDelta });
    } else if ((step.kind === "cards" || step.kind === "swatches") && (sel.kind === "cards" || sel.kind === "swatches")) {
      // Nhiều loại sáp hoặc màu: phụ thu theo tỉ lệ lượng, làm tròn tới nghìn đồng. Chưa chọn cỡ thì coi như chia đều
      const gramsOf = (id: string) => sel.amounts?.[id] ?? ((grams || 1) * (step.gramsPerGram ?? 1)) / sel.optionIds.length;
      const total = sel.optionIds.reduce((s, id) => s + gramsOf(id), 0);
      for (const id of sel.optionIds) {
        const o = findOption(step, id);
        if (o) lines.push({ stepId: step.id, label: o.name.vi, amount: isMixStep(step) ? Math.round((o.priceDelta * gramsOf(id)) / total / 1000) * 1000 : o.priceDelta });
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
      const o = findOption(step, sel.optionId);
      const size = step.sizes.find((s) => s.id === sel.sizeId);
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
    const stock = sel.sizeId ? o?.sizeMaterials?.[sel.sizeId] : undefined;
    add(stock?.materialId, 1);
    if (o?.lid && sel.withLid) add(stock?.lidMaterialId, 1);
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

