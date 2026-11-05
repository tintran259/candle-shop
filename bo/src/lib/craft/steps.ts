// Danh mục component cho bước + các hàm thao tác/kiểm tra cấu hình trình dựng Thủ công
import { formatDelta, sizeLabel, slugify } from "@/lib/craft/groups";
import { formatMoney } from "@/lib/format";
import type {
  CraftConfig,
  CraftStep,
  IntensityLevel,
  OptionStep,
  PreviewRole,
  StepIcon,
  StepKind,
  StepOption,
} from "@/lib/craft/types";
import { jarsOfType, sellable, toMap, vesselMaterialIds } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";

export const kindMeta: Record<
  StepKind,
  { label: string; description: string; example: string; icon: StepIcon; roles: PreviewRole[]; single?: boolean }
> = {
  vessel: {
    label: "Hũ & kích thước",
    description: "Thẻ hũ có ảnh minh họa dáng hũ, kèm chọn nắp và kích thước. Mỗi hũ có giá riêng và các cỡ lấy từ Kho.",
    example: "Hũ nến",
    icon: "vessel",
    roles: [],
    single: true,
  },
  cards: {
    label: "Thẻ lựa chọn",
    description: "Thẻ có ảnh hoặc màu, tên, mô tả và phụ thu. Chọn một hoặc nhiều.",
    example: "Sáp, Bấc, Trang trí",
    icon: "layers",
    roles: ["waxColor", "wick", "decoration"],
  },
  swatches: {
    label: "Bảng màu",
    description: "Các ô màu tròn kèm tên. Chọn một màu.",
    example: "Màu sáp",
    icon: "palette",
    roles: ["waxColor"],
  },
  blend: {
    label: "Phối tỉ lệ",
    description: "Chọn nhiều mục rồi kéo thanh chỉnh tỉ lệ %. Có thể cho chọn độ đậm.",
    example: "Mùi hương",
    icon: "flower",
    roles: [],
  },
  inputs: {
    label: "Ô nhập & tuỳ chọn thêm",
    description: "Ô nhập chữ (khắc nhãn, lời nhắn) và các mục bật/tắt (hộp quà).",
    example: "Cá nhân hóa",
    icon: "pen",
    roles: [],
  },
};

export const previewRoleMeta: Record<PreviewRole, { label: string; hint: string; looks?: { value: string; label: string }[] }> = {
  waxColor: { label: "Màu sáp", hint: "Màu của lựa chọn tô lên phần sáp trong ảnh minh họa." },
  wick: {
    label: "Kiểu bấc",
    hint: "Ảnh minh họa vẽ bấc theo kiểu của lựa chọn.",
    looks: [
      { value: "cotton", label: "Bấc sợi" },
      { value: "wood", label: "Bấc gỗ" },
    ],
  },
  decoration: {
    label: "Trang trí",
    hint: "Ảnh minh họa vẽ thêm kiểu trang trí của lựa chọn.",
    looks: [
      { value: "flowers", label: "Hoa khô" },
      { value: "pattern", label: "Họa tiết" },
      { value: "topper", label: "Topping" },
    ],
  },
};

export const intensityLabels: Record<IntensityLevel, string> = { light: "Nhẹ", medium: "Vừa", strong: "Đậm" };
export const DEFAULT_INTENSITY: NonNullable<Extract<CraftStep, { kind: "blend" }>["intensity"]> = {
  load: { light: 0.06, medium: 0.08, strong: 0.1 },
};

// Màu nhuộm mặc định: 1 ml cho mỗi 100 g sáp
export const DYE_RATIO = 0.01;
// Bước tính giá theo lượng nguyên liệu dùng cho hũ: sáp (cards có hệ số gram) theo 100 g, màu và tinh dầu theo ml
export function amountBasis(step: CraftStep): { unit: "g" | "ml"; per: number } | null {
  if (step.kind === "blend" || step.kind === "swatches") return { unit: "ml", per: 1 };
  if (step.kind === "cards" && step.gramsPerGram) return { unit: "g", per: 100 };
  return null;
}
export const basisLabel = (b: { unit: string; per: number }) => (b.per > 1 ? `${b.per} ${b.unit}` : b.unit);
// Giá của lựa chọn để hiện: tính theo lượng "18.000 ₫/100 g", còn lại phụ thu "+25.000 ₫"
export function optionPriceText(step: CraftStep, o: StepOption) {
  const basis = amountBasis(step);
  if (!basis) return formatDelta(o.priceDelta);
  return o.unitPrice ? `${formatMoney(o.unitPrice)}/${basisLabel(basis)}` : "Đã gồm";
}

export const isOptionStep = (s: CraftStep): s is OptionStep => s.kind !== "inputs";

// Id duy nhất: slug từ tên, trùng thì thêm -2, -3…
export function uniqueId(name: string, taken: string[], fallback = "item") {
  const base = slugify(name) || fallback;
  let id = base;
  for (let i = 2; taken.includes(id); i++) id = `${base}-${i}`;
  return id;
}

// Bước mới với nội dung trống (bước inputs có sẵn 1 ô nhập để admin sửa)
export function newStep(kind: StepKind, title: string, takenIds: string[]): CraftStep {
  const base = {
    id: uniqueId(title, takenIds, "step"),
    title: { vi: title, en: title },
    icon: kindMeta[kind].icon,
    // Bước mới ẩn với khách cho tới khi admin cấu hình xong rồi bật (riêng bước hũ luôn bật)
    enabled: kind === "vessel",
    required: kind !== "inputs",
  };
  switch (kind) {
    case "vessel":
      return { ...base, kind, options: [] };
    case "cards":
      return { ...base, kind, options: [], multiple: false };
    case "swatches":
      return { ...base, kind, options: [], multiple: false, gramsPerGram: DYE_RATIO };
    case "blend":
      return { ...base, kind, options: [], maxBlend: 3, intensity: null };
    case "inputs":
      return {
        ...base,
        kind,
        fields: [{ id: "text", label: { vi: "Nội dung", en: "Text" }, maxLength: 30, priceDelta: 0, enabled: true }],
        addons: [],
      };
  }
}

// Tất cả lựa chọn kèm bước của nó — cho thống kê, tìm kiếm, cảnh báo tồn kho
export type OptionRow = { step: OptionStep; option: StepOption };
export const optionRows = (config: CraftConfig): OptionRow[] =>
  config.steps.filter(isOptionStep).flatMap((step) => (step.options as StepOption[]).map((option) => ({ step, option })));

export type ConfigIssue = { stepId?: string; level: "error" | "warning"; message: string };

// Kiểm tra cấu hình trước khi lên web. error = web không dựng được / khách không đặt được; warning = nên xem lại.
// Cần kho nguyên liệu để biết lựa chọn nào còn hàng. BE dùng cùng quy tắc khi nhận PUT (docs/craft-builder.md).
export function validateConfig(config: CraftConfig, materials: Material[]): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const map = toMap(materials);
  const missing = (materialId: string | undefined) => !!materialId && !map.has(materialId);
  const vessels = config.steps.filter((s) => s.kind === "vessel");
  if (vessels.length !== 1) issues.push({ level: "error", message: "Cần đúng 1 bước “Hũ & kích thước” để tính giá hũ." });

  const ids = config.steps.map((s) => s.id);
  ids.filter((id, i) => ids.indexOf(id) !== i).forEach((id) => issues.push({ stepId: id, level: "error", message: `Trùng mã bước “${id}”.` }));
  if (!config.steps.some((s) => s.enabled)) issues.push({ level: "error", message: "Chưa bật bước nào cho khách." });

  for (const step of config.steps) {
    const name = step.title.vi;
    if (step.kind === "vessel") {
      if (!step.enabled) issues.push({ stepId: step.id, level: "error", message: `${name}: bước hũ phải luôn bật.` });
      if (step.options.length && !step.options.some((o) => o.available && o.sizes.some((s) => s.available)))
        issues.push({ stepId: step.id, level: "error", message: `${name}: chưa có hũ nào có kích thước đang bán.` });
      for (const o of step.options) {
        if (o.available && !o.sizes.some((s) => s.available))
          issues.push({ stepId: step.id, level: "warning", message: `${name}: “${o.name.vi}” chưa có kích thước nào đang bán.` });
        if (vesselMaterialIds(o).some(missing)) issues.push({ stepId: step.id, level: "warning", message: `${name}: “${o.name.vi}” có cỡ gắn với mã hũ/nắp đã xóa khỏi kho.` });
        // Theo dõi tồn vài cỡ nhưng quên gắn mã cho cỡ khác → cỡ đó bán không giới hạn
        const untracked = o.sizes.filter((s) => !s.materialId);
        if (untracked.length && untracked.length < o.sizes.length)
          issues.push({ stepId: step.id, level: "warning", message: `${name}: “${o.name.vi}” chưa gắn mã hũ cho cỡ ${untracked.map((s) => sizeLabel(s)).join(", ")} — cỡ này bán không giới hạn.` });
        // Kho có thêm cỡ của loại hũ này mà hũ chưa có
        const added = jarsOfType(materials, o.jarType).filter((m) => !o.sizes.some((s) => s.materialId === m.id));
        if (added.length)
          issues.push({ stepId: step.id, level: "warning", message: `${name}: Kho có cỡ mới của “${o.name.vi}” (${added.map((m) => (m.capacity ? `${m.capacity}ml` : m.name)).join(", ")}) — mở hũ để đặt giá và bán.` });
      }
    }
    if (step.kind === "inputs") {
      for (const a of step.addons)
        if (missing(a.materialId)) issues.push({ stepId: step.id, level: "warning", message: `${name}: “${a.name.vi}” gắn với nguyên liệu đã xóa khỏi kho.` });
      if (step.enabled && !step.fields.some((f) => f.enabled) && !step.addons.some((a) => a.enabled))
        issues.push({ stepId: step.id, level: "warning", message: `${name}: chưa bật ô nhập hay tuỳ chọn nào.` });
      continue;
    }
    // Chưa có lựa chọn nào → một thông báo duy nhất (bắt buộc thì là lỗi), không báo trùng "không còn lựa chọn bán được"
    const onSale = (step.options as StepOption[]).filter((o) => sellable(o, map));
    if (step.enabled && !step.options.length)
      issues.push({ stepId: step.id, level: step.required ? "error" : "warning", message: `${name}: chưa có lựa chọn nào.` });
    else if (step.enabled && step.required && !onSale.length)
      issues.push({ stepId: step.id, level: "error", message: `${name}: bước bắt buộc nhưng không còn lựa chọn nào bán được.` });
    for (const o of step.options as StepOption[]) {
      if (missing(o.materialId)) issues.push({ stepId: step.id, level: "warning", message: `${name}: “${o.name.vi}” gắn với nguyên liệu đã xóa khỏi kho.` });
      for (const [ref, optionIds] of Object.entries(o.onlyWith ?? {})) {
        const target = config.steps.find((s) => s.id === ref);
        if (!target || !isOptionStep(target)) {
          issues.push({ stepId: step.id, level: "warning", message: `${name}: “${o.name.vi}” giới hạn theo bước đã xóa (${ref}).` });
          continue;
        }
        const missing = optionIds.filter((id) => !(target.options as StepOption[]).some((t) => t.id === id));
        if (missing.length)
          issues.push({ stepId: step.id, level: "warning", message: `${name}: “${o.name.vi}” nhắc tới lựa chọn không còn trong ${target.title.vi}.` });
      }
    }
  }
  return issues;
}
