// So bản nháp với bản đã lưu → danh sách thay đổi đọc được cho admin (bước nào, mục nào, trường nào, cũ → mới)
import { formatDelta, shapeLabels, sizeLabel } from "@/lib/craft/groups";
import { intensityLabels, kindMeta, previewRoleMeta } from "@/lib/craft/steps";
import type { AddonDef, CraftConfig, CraftStep, IntensityLevel, SizeOption, StepOption, TextFieldDef, VesselOption } from "@/lib/craft/types";
import { formatMoney } from "@/lib/format";
import type { MaterialMap } from "@/lib/inventory/stock";

export type ChangeKind = "added" | "removed" | "edited";
export type ChangeItem = {
  // Mục bị đổi (vd "Sáp đậu nành", "Cỡ 150ml") — trống = thuộc tính của chính bước
  subject?: string;
  kind: ChangeKind;
  // Mô tả: "Phụ thu: 0 ₫ → 20.000 ₫"
  text: string;
  // Lựa chọn để mở drawer sửa (nếu có)
  optionId?: string;
  // Tab của bước chứa thay đổi
  view?: "sizes" | "settings";
};
export type StepChange = { step: CraftStep; kind: ChangeKind; items: ChangeItem[] };

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const onOff = (v: unknown) => (v ? "Bật" : "Tắt");
const text = (v: unknown) => (v === undefined || v === null || v === "" ? "(trống)" : String(v));
const arrow = (label: string, before: string, after: string) => `${label}: ${before} → ${after}`;

type Ctx = { map: MaterialMap; sizes: SizeOption[] };
const material = (ctx: Ctx, id?: string) => (id ? (ctx.map.get(id)?.name ?? `${id} (đã xóa)`) : "Không theo dõi");

// Trường của lựa chọn: nhãn + cách hiển thị giá trị
const optionFields: { key: keyof VesselOption; label: string; show: (v: never, ctx: Ctx) => string }[] = [
  { key: "name", label: "Tên", show: (v: { vi: string; en: string }) => `${v.vi} / ${v.en}` },
  { key: "description", label: "Mô tả", show: (v?: { vi: string }) => text(v?.vi) },
  { key: "priceDelta", label: "Phụ thu", show: (v: number) => formatMoney(v) },
  { key: "available", label: "Đang bán", show: (v: boolean) => onOff(v) },
  { key: "materialId", label: "Nguyên liệu", show: (v: string | undefined, ctx) => material(ctx, v) },
  { key: "swatch", label: "Màu", show: (v?: string) => v ?? "không màu" },
  { key: "images", label: "Ảnh", show: (v?: string[]) => `${v?.length ?? 0} ảnh` },
  { key: "look", label: "Kiểu minh họa", show: (v?: string) => text(v) },
  { key: "onlyWith", label: "Chỉ dùng với", show: (v?: Record<string, string[]>) => (v ? `${Object.values(v).flat().length} mục` : "tất cả") },
  { key: "maxGrams", label: "Sáp tối đa", show: (v?: number) => (v ? `${v}g` : "không giới hạn") },
  { key: "exclusive", label: "Không phối thêm", show: (v?: boolean) => onOff(v) },
  { key: "shape", label: "Dáng hũ", show: (v: VesselOption["shape"]) => shapeLabels[v] ?? v },
  { key: "translucent", label: "Trong suốt", show: (v?: boolean) => onOff(v) },
  {
    key: "supportedSizeIds",
    label: "Cỡ đổ được",
    show: (v: string[], ctx) => ctx.sizes.filter((s) => v.includes(s.id)).map((s) => sizeLabel(s)).join(", ") || "chưa chọn",
  },
  { key: "lid", label: "Nắp", show: (v: VesselOption["lid"]) => (v ? `có (${formatDelta(v.priceDelta)})` : "không") },
];

function optionChanges(before: StepOption, after: StepOption, ctx: Ctx): string[] {
  const out: string[] = [];
  for (const f of optionFields) {
    const a = before[f.key as keyof StepOption];
    const b = after[f.key as keyof StepOption];
    if (!same(a, b)) out.push(arrow(f.label, f.show(a as never, ctx), f.show(b as never, ctx)));
  }
  // Mã hũ / nắp theo từng cỡ
  const vb = before as VesselOption;
  const va = after as VesselOption;
  if ("sizeMaterials" in va || "sizeMaterials" in vb) {
    for (const size of ctx.sizes) {
      const x = vb.sizeMaterials?.[size.id] ?? {};
      const y = va.sizeMaterials?.[size.id] ?? {};
      if (x.materialId !== y.materialId) out.push(arrow(`Hũ ${sizeLabel(size)}`, material(ctx, x.materialId), material(ctx, y.materialId)));
      if (x.lidMaterialId !== y.lidMaterialId) out.push(arrow(`Nắp ${sizeLabel(size)}`, material(ctx, x.lidMaterialId), material(ctx, y.lidMaterialId)));
    }
  }
  return out;
}

// So hai danh sách theo id: thêm / xóa / sửa từng phần tử
function listChanges<T extends { id: string }>(before: T[], after: T[], name: (x: T) => string, fields: (a: T, b: T) => string[], extra?: (x: T) => Partial<ChangeItem>) {
  const items: ChangeItem[] = [];
  const old = new Map(before.map((x) => [x.id, x]));
  const now = new Set(after.map((x) => x.id));
  for (const x of after) {
    const prev = old.get(x.id);
    if (!prev) items.push({ subject: name(x), kind: "added", text: "Thêm mới", ...extra?.(x) });
    else if (!same(prev, x)) {
      const diffs = fields(prev, x);
      for (const d of diffs.length ? diffs : ["Đã đổi"]) items.push({ subject: name(x), kind: "edited", text: d, ...extra?.(x) });
    }
  }
  for (const x of before) if (!now.has(x.id)) items.push({ subject: name(x), kind: "removed", text: "Đã xóa" });
  const order = (l: T[]) => l.filter((x) => old.has(x.id) && now.has(x.id)).map((x) => x.id);
  if (!same(order(before), order(after))) items.push({ kind: "edited", text: "Đổi thứ tự" });
  return items;
}

const sizeFields = (a: SizeOption, b: SizeOption) =>
  [
    a.ml !== b.ml && arrow("Dung tích", `${a.ml}ml`, `${b.ml}ml`),
    a.grams !== b.grams && arrow("Sáp đổ", `${a.grams}g`, `${b.grams}g`),
    a.basePrice !== b.basePrice && arrow("Giá gốc", formatMoney(a.basePrice), formatMoney(b.basePrice)),
    a.burnHours !== b.burnHours && arrow("Thời gian cháy", a.burnHours ? `${a.burnHours} giờ` : "chưa đo", b.burnHours ? `${b.burnHours} giờ` : "chưa đo"),
    a.available !== b.available && arrow("Đang bán", onOff(a.available), onOff(b.available)),
  ].filter(Boolean) as string[];

const fieldFields = (a: TextFieldDef, b: TextFieldDef) =>
  [
    !same(a.label, b.label) && arrow("Nhãn", a.label.vi, b.label.vi),
    !same(a.placeholder, b.placeholder) && arrow("Chữ gợi ý", text(a.placeholder?.vi), text(b.placeholder?.vi)),
    a.maxLength !== b.maxLength && arrow("Tối đa", `${a.maxLength} ký tự`, `${b.maxLength} ký tự`),
    a.priceDelta !== b.priceDelta && arrow("Phụ thu", formatMoney(a.priceDelta), formatMoney(b.priceDelta)),
    a.enabled !== b.enabled && arrow("Hiện trên web", onOff(a.enabled), onOff(b.enabled)),
    !!a.multiline !== !!b.multiline && arrow("Nhiều dòng", onOff(a.multiline), onOff(b.multiline)),
    !!a.onLabel !== !!b.onLabel && arrow("In lên nhãn", onOff(a.onLabel), onOff(b.onLabel)),
  ].filter(Boolean) as string[];

const addonFields = (ctx: Ctx) => (a: AddonDef, b: AddonDef) =>
  [
    !same(a.name, b.name) && arrow("Tên", a.name.vi, b.name.vi),
    !same(a.description, b.description) && arrow("Mô tả", text(a.description?.vi), text(b.description?.vi)),
    a.priceDelta !== b.priceDelta && arrow("Phụ thu", formatMoney(a.priceDelta), formatMoney(b.priceDelta)),
    a.materialId !== b.materialId && arrow("Nguyên liệu", material(ctx, a.materialId), material(ctx, b.materialId)),
    a.available !== b.available && arrow("Đang bán", onOff(a.available), onOff(b.available)),
    a.enabled !== b.enabled && arrow("Hiện trên web", onOff(a.enabled), onOff(b.enabled)),
  ].filter(Boolean) as string[];

const intensityText = (v: { priceDelta: Record<IntensityLevel, number>; load: Record<IntensityLevel, number> } | null) =>
  v ? (Object.keys(intensityLabels) as IntensityLevel[]).map((l) => `${intensityLabels[l]} ${Math.round(v.load[l] * 1000) / 10}%`).join(" · ") : "tắt";

// Thuộc tính của chính bước (tab Cài đặt)
function stepFields(a: CraftStep, b: CraftStep): string[] {
  const x = a as Record<string, unknown>;
  const y = b as Record<string, unknown>;
  const rows: [string, string, (v: never) => string][] = [
    ["title", "Tên bước", (v: { vi: string; en: string }) => `${v.vi} / ${v.en}`],
    ["hint", "Mô tả", (v?: { vi: string }) => text(v?.vi)],
    ["icon", "Icon", (v: string) => v],
    ["enabled", "Hiện trên web", (v: boolean) => onOff(v)],
    ["required", "Bắt buộc", (v: boolean) => onOff(v)],
    ["multiple", "Chọn nhiều", (v?: boolean) => onOff(v)],
    ["maxSelect", "Chọn tối đa", (v?: number) => (v ? String(v) : "không giới hạn")],
    ["previewRole", "Ảnh minh họa", (v?: keyof typeof previewRoleMeta) => (v ? previewRoleMeta[v].label : "không")],
    ["gramsPerGram", "Hệ số gram", (v?: number) => String(v ?? 1)],
    ["maxBlend", "Phối tối đa", (v: number) => `${v} mục`],
    ["intensity", "Độ đậm", (v: never) => intensityText(v)],
  ];
  return rows.filter(([k]) => !same(x[k], y[k])).map(([k, label, show]) => arrow(label, show(x[k] as never), show(y[k] as never)));
}

function stepItems(before: CraftStep, after: CraftStep, map: MaterialMap): ChangeItem[] {
  const ctx: Ctx = { map, sizes: after.kind === "vessel" ? [...(before.kind === "vessel" ? before.sizes : []), ...after.sizes.filter((s) => before.kind !== "vessel" || !before.sizes.some((x) => x.id === s.id))] : [] };
  const items: ChangeItem[] = stepFields(before, after).map((t) => ({ kind: "edited", text: t, view: "settings" }));
  if (before.kind === "vessel" && after.kind === "vessel")
    items.push(...listChanges(before.sizes, after.sizes, (s) => `Cỡ ${sizeLabel(s)}`, sizeFields, () => ({ view: "sizes" })));
  if (before.kind === "inputs" && after.kind === "inputs") {
    items.push(...listChanges(before.fields, after.fields, (f) => `Ô “${f.label.vi}”`, fieldFields));
    items.push(...listChanges(before.addons, after.addons, (a) => `Tuỳ chọn “${a.name.vi}”`, addonFields(ctx)));
  } else if (before.kind !== "inputs" && after.kind !== "inputs") {
    items.push(...listChanges(before.options as StepOption[], after.options as StepOption[], (o) => o.name.vi, (a, b) => optionChanges(a, b, ctx), (o) => ({ optionId: o.id })));
  }
  return items;
}

const summary = (s: CraftStep) =>
  s.kind === "inputs" ? `${s.fields.length} ô nhập · ${s.addons.length} tuỳ chọn` : `${kindMeta[s.kind].label} · ${s.options.length} lựa chọn`;

// Danh sách thay đổi theo thứ tự bước trên bản nháp (bước bị xóa xếp cuối)
export function describeChanges(saved: CraftConfig, draft: CraftConfig, map: MaterialMap): StepChange[] {
  const old = new Map(saved.steps.map((s) => [s.id, s]));
  const now = new Set(draft.steps.map((s) => s.id));
  const out: StepChange[] = [];
  for (const step of draft.steps) {
    const prev = old.get(step.id);
    if (!prev) out.push({ step, kind: "added", items: [{ kind: "added", text: `Bước mới — ${summary(step)}` }] });
    else if (!same(prev, step)) out.push({ step, kind: "edited", items: stepItems(prev, step, map) });
  }
  for (const step of saved.steps) if (!now.has(step.id)) out.push({ step, kind: "removed", items: [{ kind: "removed", text: `Xóa bước — ${summary(step)}` }] });
  return out;
}

// Thứ tự bước có đổi không (tính riêng, không thuộc bước nào)
export function orderChanged(saved: CraftConfig, draft: CraftConfig) {
  const both = (c: CraftConfig, other: CraftConfig) => c.steps.map((s) => s.id).filter((id) => other.steps.some((x) => x.id === id));
  return !same(both(saved, draft), both(draft, saved));
}
