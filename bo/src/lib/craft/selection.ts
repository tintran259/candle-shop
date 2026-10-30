// Lựa chọn của khách trên trình dựng Thủ công (CraftSelection) → giá, mô tả, nguyên liệu tiêu hao, kiểm tra hợp lệ.
// Đúng công thức ở docs/craft-builder.md (mục 6–8) và docs/inventory.md (mục 6) — web và BE dùng cùng cách tính.
import { sizeLabel } from "@/lib/craft/groups";
import { intensityLabels } from "@/lib/craft/steps";
import type { CraftConfig, CraftStep, IntensityLevel, StepOption, VesselOption, VesselStep } from "@/lib/craft/types";
import { lidLevel, optionLevel, sellable, vesselSizeLevel, type MaterialMap } from "@/lib/inventory/stock";

export type StepSelection =
  | { kind: "vessel"; optionId?: string; sizeId?: string; withLid: boolean }
  | { kind: "cards" | "swatches"; optionIds: string[] }
  | { kind: "blend"; items: { optionId: string; weight: number }[]; intensity: IntensityLevel | null }
  | { kind: "inputs"; values: Record<string, string>; addons: string[] };
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
      const shares = blendShares(sel.items);
      const sum = Math.round(shares.reduce((s, i) => s + (findOption(step, i.optionId)?.priceDelta ?? 0) * i.percent, 0) / 100);
      if (shares.length) lines.push({ stepId: step.id, label: step.title.vi, amount: sum });
      if (step.intensity && sel.intensity) lines.push({ stepId: step.id, label: `Độ đậm ${intensityLabels[sel.intensity].toLowerCase()}`, amount: step.intensity.priceDelta[sel.intensity] });
    } else if (step.kind === "inputs" && sel.kind === "inputs") {
      for (const f of step.fields) if (f.enabled && sel.values[f.id]?.trim()) lines.push({ stepId: step.id, label: f.label.vi, amount: f.priceDelta });
      for (const a of step.addons) if (a.enabled && sel.addons.includes(a.id)) lines.push({ stepId: step.id, label: a.name.vi, amount: a.priceDelta });
    } else if ((step.kind === "cards" || step.kind === "swatches") && (sel.kind === "cards" || sel.kind === "swatches")) {
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
  for (const step of activeSteps(config)) {
    const sel = selection[step.id];
    if (!sel) continue;
    if (step.kind === "vessel" && sel.kind === "vessel") {
      const o = findOption(step, sel.optionId);
      const size = step.sizes.find((s) => s.id === sel.sizeId);
      if (o) parts.push([o.name.vi, size && sizeLabel(size)].filter(Boolean).join(" "));
      if (sel.withLid) parts.push("Có nắp");
    } else if (step.kind === "blend" && sel.kind === "blend" && sel.items.length) {
      const shares = blendShares(sel.items);
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

// Lượng nguyên liệu cho 1 hũ: { materialId: lượng theo đơn vị của nguyên liệu }
export function materialNeeds(config: CraftConfig, selection: CraftSelection, map: MaterialMap) {
  const needs = new Map<string, number>();
  const add = (id: string | undefined, amount: number) => {
    const m = id ? map.get(id) : undefined;
    if (!id || !m?.tracked || amount <= 0) return;
    needs.set(id, (needs.get(id) ?? 0) + amount);
  };
  const grams = selectedSize(config, selection)?.grams ?? 0;
  // Nguyên liệu tính theo cái trừ 1; theo g/ml trừ theo khối lượng
  const byUnit = (id: string | undefined, gramsAmount: number) => add(id, id && map.get(id)?.unit !== "pcs" ? Math.ceil(gramsAmount) : 1);
  for (const step of activeSteps(config)) {
    const sel = selection[step.id];
    if (!sel) continue;
    if (step.kind === "vessel" && sel.kind === "vessel") {
      const o = findOption(step, sel.optionId) as VesselOption | undefined;
      const stock = sel.sizeId ? o?.sizeMaterials?.[sel.sizeId] : undefined;
      add(stock?.materialId, 1);
      if (o?.lid && sel.withLid) add(stock?.lidMaterialId, 1);
    } else if (step.kind === "blend" && sel.kind === "blend") {
      const load = step.intensity && sel.intensity ? step.intensity.load[sel.intensity] : DEFAULT_LOAD;
      for (const i of blendShares(sel.items)) {
        const o = findOption(step, i.optionId);
        if (!o?.exclusive) byUnit(o?.materialId, (grams * load * i.percent) / 100);
      }
    } else if (step.kind === "inputs" && sel.kind === "inputs") {
      for (const a of step.addons) if (sel.addons.includes(a.id)) add(a.materialId, 1);
    } else if ((step.kind === "cards" || step.kind === "swatches") && (sel.kind === "cards" || sel.kind === "swatches")) {
      for (const id of sel.optionIds) byUnit(findOption(step, id)?.materialId, grams * (step.gramsPerGram ?? 1));
    }
  }
  return needs;
}

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

