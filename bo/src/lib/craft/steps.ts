// Danh mục component cho bước + các hàm thao tác/kiểm tra cấu hình trình dựng Thủ công
import { sizeLabel, slugify } from "@/lib/craft/groups";
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
import { sellable, toMap, vesselMaterialIds } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";

export const kindMeta: Record<
  StepKind,
  { label: string; description: string; example: string; icon: StepIcon; roles: PreviewRole[]; single?: boolean }
> = {
  vessel: {
    label: "Hũ & kích thước",
    description: "Thẻ hũ có ảnh minh họa dáng hũ, kèm chọn nắp và kích thước. Quyết định giá gốc của cây nến.",
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
  priceDelta: { light: 0, medium: 0, strong: 10_000 },
  load: { light: 0.06, medium: 0.08, strong: 0.1 },
};

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
      return { ...base, kind, options: [], sizes: [] };
    case "cards":
      return { ...base, kind, options: [], multiple: false };
    case "swatches":
      return { ...base, kind, options: [] };
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
  if (vessels.length !== 1) issues.push({ level: "error", message: "Cần đúng 1 bước “Hũ & kích thước” để tính giá gốc." });

  const ids = config.steps.map((s) => s.id);
  ids.filter((id, i) => ids.indexOf(id) !== i).forEach((id) => issues.push({ stepId: id, level: "error", message: `Trùng mã bước “${id}”.` }));
  if (!config.steps.some((s) => s.enabled)) issues.push({ level: "error", message: "Chưa bật bước nào cho khách." });

  for (const step of config.steps) {
    const name = step.title.vi;
    if (step.kind === "vessel") {
      if (!step.enabled) issues.push({ stepId: step.id, level: "error", message: `${name}: bước hũ phải luôn bật.` });
      if (!step.sizes.some((s) => s.available)) issues.push({ stepId: step.id, level: "error", message: `${name}: chưa có kích thước nào đang bán.` });
      for (const o of step.options) {
        if (o.available && !o.supportedSizeIds.length)
          issues.push({ stepId: step.id, level: "warning", message: `${name}: “${o.name.vi}” chưa chọn kích thước đổ được.` });
        if (vesselMaterialIds(o).some(missing)) issues.push({ stepId: step.id, level: "warning", message: `${name}: “${o.name.vi}” có cỡ gắn với mã hũ/nắp đã xóa khỏi kho.` });
        // Theo dõi tồn vài cỡ nhưng quên gắn mã cho cỡ khác → cỡ đó bán không giới hạn
        const sizes = step.sizes.filter((s) => o.supportedSizeIds.includes(s.id));
        const untracked = sizes.filter((s) => !o.sizeMaterials?.[s.id]?.materialId);
        if (untracked.length && untracked.length < sizes.length)
          issues.push({ stepId: step.id, level: "warning", message: `${name}: “${o.name.vi}” chưa gắn mã hũ cho cỡ ${untracked.map((s) => sizeLabel(s)).join(", ")} — cỡ này bán không giới hạn.` });
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
