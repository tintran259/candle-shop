// Chuyển qua lại giữa lựa chọn (cấu trúc lồng) và giá trị phẳng của antd Form. Tiền là VNĐ.
import { amountBasis, uniqueId } from "@/lib/craft/steps";
import type { OptionStep, StepOption, Unit, VesselOption, VesselSize } from "@/lib/craft/types";
import { jarsOfType } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";

// Giá trị đặc biệt của ô chọn nguyên liệu
export const NO_MATERIAL = "";
export const NEW_MATERIAL = "__new";

// Một cỡ của hũ trong form: bán hay không, phụ thu cỡ, sáp đổ, giờ cháy, nắp (id nguyên liệu, "" = không theo dõi)
export type SizeValues = { on: boolean; price?: number | null; grams?: number | null; burnHours?: number | null; lid?: string };

// Một dòng cỡ: cỡ hũ đang có, hoặc mã hũ cùng loại trong Kho chưa thêm. key = id cỡ (cỡ mới dùng mã hũ)
export type SizeRow = { key: string; ml: number; materialId?: string; existing?: VesselSize };

// Các cỡ của hũ theo loại hũ đang chọn: cỡ đã có (giữ cài đặt) + mã hũ cùng loại trong Kho chưa thêm, xếp theo dung tích.
// Đổi sang loại hũ khác thì chỉ còn các mã của loại mới
export function vesselRows(option: VesselOption | undefined, jarType: string | undefined, materials: Material[]): SizeRow[] {
  const jars = jarsOfType(materials, jarType);
  const own = option?.sizes ?? [];
  const sameType = (option?.jarType ?? inferJarType(option, materials) ?? "") === (jarType ?? "");
  const kept = own.filter((s) => (s.materialId && jars.some((j) => j.id === s.materialId)) || sameType);
  const ml = (s: VesselSize) => jars.find((j) => j.id === s.materialId)?.capacity ?? s.ml;
  const rows: SizeRow[] = [
    ...kept.map((s) => ({ key: s.id, ml: ml(s), materialId: s.materialId, existing: s })),
    ...jars.filter((j) => !own.some((s) => s.materialId === j.id)).map((j) => ({ key: j.id, ml: j.capacity ?? 0, materialId: j.id })),
  ];
  return rows.sort((a, b) => a.ml - b.ml);
}

// Hũ lưu trước khi có loại hũ: lấy theo mã hũ của các cỡ
export const inferJarType = (option: VesselOption | undefined, materials: Material[]) =>
  option?.jarType ?? option?.sizes.map((s) => materials.find((m) => m.id === s.materialId)?.jarType).find(Boolean);

// Giá trị mặc định của một dòng cỡ. Cỡ mới của hũ đang bán để tắt — admin đặt giá rồi mới bật
export const rowDefaults = (row: SizeRow, isNew: boolean): SizeValues =>
  row.existing
    ? { on: row.existing.available, price: row.existing.priceDelta, grams: row.existing.grams, burnHours: row.existing.burnHours ?? null, lid: row.existing.lidMaterialId ?? NO_MATERIAL }
    : { on: isNew, price: 0, grams: Math.round(row.ml * 0.8), burnHours: null, lid: NO_MATERIAL };

// Các cỡ của hũ từ form
export function sizesFromForm(rows: SizeRow[], values: Record<string, SizeValues> | undefined, hasLid: boolean, isNew: boolean): VesselSize[] {
  return rows.map((row) => {
    const v = { ...rowDefaults(row, isNew), ...values?.[row.key] };
    return {
      id: row.existing?.id ?? row.key,
      ml: row.ml,
      grams: Math.max(0, Math.round(v.grams ?? 0)),
      burnHours: v.burnHours || undefined,
      priceDelta: Math.round(v.price ?? 0),
      available: !!v.on,
      materialId: row.materialId,
      lidMaterialId: hasLid && v.lid ? v.lid : undefined,
    };
  });
}

export type OptionFormValues = {
  nameVi: string;
  nameEn?: string;
  descVi?: string;
  descEn?: string;
  price: number;
  available: boolean;
  // Nguyên liệu trong Kho: id có sẵn, NO_MATERIAL = không theo dõi, NEW_MATERIAL = tạo mới trong Kho
  materialId: string;
  // Khi tạo nguyên liệu mới
  newUnit?: Unit;
  newStock?: number;
  // Không có màu = ô sọc (swatches: "không pha màu")
  hasSwatch: boolean;
  swatch?: string;
  images: string[];
  look?: string;
  maxGrams?: number | null;
  exclusive?: boolean;
  // Giới hạn theo bước khác: { [stepId]: optionId[] } — mảng rỗng = không giới hạn
  onlyWith: Record<string, string[]>;
  // Hũ
  shape?: VesselOption["shape"];
  // Loại hũ trong Kho — các mã hũ cùng loại là các cỡ
  jarType?: string;
  translucent?: boolean;
  hasLid?: boolean;
  lidPrice?: number;
  // { [key dòng cỡ]: cài đặt cỡ }
  sizes?: Record<string, SizeValues>;
};

// Nguyên liệu đã chốt sau khi drawer tạo xong các nguyên liệu mới; hũ: các cỡ dựng từ form
export type ResolvedMaterials = { materialId?: string; sizes?: VesselSize[] };

// Đơn vị gợi ý khi tạo nguyên liệu mới từ một bước
export const suggestedUnit = (step: OptionStep): Unit => (step.kind === "blend" || step.kind === "swatches" ? "ml" : step.kind === "cards" && step.gramsPerGram ? "g" : "pcs");

export function toFormValues(step: OptionStep, item?: StepOption, materials: Material[] = []): OptionFormValues {
  const o = (item ?? {}) as Partial<VesselOption>;
  return {
    nameVi: o.name?.vi ?? "",
    nameEn: o.name?.en,
    descVi: o.description?.vi,
    descEn: o.description?.en,
    // Bước tính theo lượng (sáp, màu, hương): ô giá là giá bán mỗi 100 g / mỗi ml
    price: (amountBasis(step) ? o.unitPrice : o.priceDelta) ?? 0,
    available: o.available ?? true,
    // Lựa chọn mới mặc định tạo luôn nguyên liệu trong Kho
    materialId: item ? (o.materialId ?? NO_MATERIAL) : NEW_MATERIAL,
    newUnit: suggestedUnit(step),
    newStock: 0,
    hasSwatch: item ? !!o.swatch : true,
    swatch: o.swatch ?? "#e8dccb",
    images: o.images ?? [],
    look: o.look,
    maxGrams: o.maxGrams ?? null,
    exclusive: !!o.exclusive,
    onlyWith: o.onlyWith ?? {},
    ...(step.kind === "vessel" && {
      shape: o.shape ?? "jar",
      jarType: inferJarType(item as VesselOption | undefined, materials),
      translucent: !!o.translucent,
      hasLid: !!o.lid,
      lidPrice: o.lid?.priceDelta ?? 0,
      sizes: Object.fromEntries((o.sizes ?? []).map((s) => [s.id, rowDefaults({ key: s.id, ml: s.ml, materialId: s.materialId, existing: s }, false)])),
    }),
  };
}

// resolved: id nguyên liệu đã chốt (drawer tự tạo nguyên liệu mới trước khi gọi hàm này)
export function fromFormValues(step: OptionStep, v: OptionFormValues, resolved: ResolvedMaterials, previous?: StepOption): StepOption {
  const vi = v.nameVi.trim();
  const descVi = v.descVi?.trim();
  const onlyWith = Object.fromEntries(Object.entries(v.onlyWith ?? {}).filter(([, ids]) => ids?.length));
  const base: StepOption = {
    // Id cố định sau khi tạo — đơn hàng và quy tắc tương thích dùng nó
    id: previous?.id ?? uniqueId(v.nameEn?.trim() || vi, (step.options as StepOption[]).map((o) => o.id), "option"),
    name: { vi, en: v.nameEn?.trim() || vi },
    description: descVi ? { vi: descVi, en: v.descEn?.trim() || descVi } : undefined,
    priceDelta: amountBasis(step) ? 0 : Math.round(v.price ?? 0),
    unitPrice: amountBasis(step) ? Math.round(v.price ?? 0) : undefined,
    available: v.available,
    materialId: step.kind === "vessel" ? undefined : resolved.materialId,
    swatch: v.hasSwatch ? v.swatch : undefined,
    images: v.images?.length ? v.images : undefined,
    look: v.look || undefined,
    maxGrams: v.maxGrams || undefined,
    exclusive: step.kind !== "vessel" && v.exclusive ? true : undefined,
    onlyWith: Object.keys(onlyWith).length ? onlyWith : undefined,
  };
  if (step.kind !== "vessel") return base;
  return {
    ...base,
    jarType: v.jarType?.trim() || undefined,
    shape: v.shape ?? "jar",
    sizes: resolved.sizes ?? [],
    translucent: v.translucent || undefined,
    lid: v.hasLid ? { priceDelta: Math.round(v.lidPrice ?? 0) } : null,
  } as VesselOption;
}
