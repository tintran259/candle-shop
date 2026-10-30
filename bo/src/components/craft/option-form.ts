// Chuyển qua lại giữa lựa chọn (cấu trúc lồng) và giá trị phẳng của antd Form. Tiền là VNĐ.
import { uniqueId } from "@/lib/craft/steps";
import type { OptionStep, StepOption, Unit, VesselOption, VesselSizeStock } from "@/lib/craft/types";

// Giá trị đặc biệt của ô chọn nguyên liệu
export const NO_MATERIAL = "";
export const NEW_MATERIAL = "__new";

// Một dòng trong bảng "Kích cỡ & tồn kho" của hũ — jar/lid giống ô chọn nguyên liệu (id | NO_ | NEW_)
export type SizeStockValues = { jar: string; jarStock?: number; lid: string; lidStock?: number };

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
  supportedSizeIds?: string[];
  translucent?: boolean;
  hasLid?: boolean;
  lidPrice?: number;
  // { [sizeId]: mã hũ / nắp trong Kho của cỡ đó }
  sizeStock?: Record<string, SizeStockValues>;
};

// Nguyên liệu đã chốt sau khi drawer tạo xong các nguyên liệu mới
export type ResolvedMaterials = { materialId?: string; sizeMaterials?: Record<string, VesselSizeStock> };

// Đơn vị gợi ý khi tạo nguyên liệu mới từ một bước
export const suggestedUnit = (step: OptionStep): Unit => (step.kind === "blend" ? "ml" : step.kind === "cards" && step.gramsPerGram ? "g" : "pcs");

export function toFormValues(step: OptionStep, item?: StepOption): OptionFormValues {
  const o = (item ?? {}) as Partial<VesselOption>;
  return {
    nameVi: o.name?.vi ?? "",
    nameEn: o.name?.en,
    descVi: o.description?.vi,
    descEn: o.description?.en,
    price: o.priceDelta ?? 0,
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
      supportedSizeIds: o.supportedSizeIds ?? step.sizes.map((s) => s.id),
      translucent: !!o.translucent,
      hasLid: !!o.lid,
      lidPrice: o.lid?.priceDelta ?? 0,
      // Hũ mới: mặc định tạo luôn mã hũ cho từng cỡ trong Kho
      sizeStock: Object.fromEntries(
        step.sizes.map((size) => {
          const stock = o.sizeMaterials?.[size.id];
          const fallback = item ? NO_MATERIAL : NEW_MATERIAL;
          return [size.id, { jar: stock?.materialId ?? fallback, jarStock: 0, lid: stock?.lidMaterialId ?? fallback, lidStock: 0 }];
        }),
      ),
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
    priceDelta: Math.round(v.price ?? 0),
    available: v.available,
    materialId: step.kind === "vessel" ? undefined : resolved.materialId,
    swatch: v.hasSwatch ? v.swatch : undefined,
    images: v.images?.length ? v.images : undefined,
    look: v.look || undefined,
    maxGrams: v.maxGrams || undefined,
    exclusive: step.kind === "blend" && v.exclusive ? true : undefined,
    onlyWith: Object.keys(onlyWith).length ? onlyWith : undefined,
  };
  if (step.kind !== "vessel") return base;
  const supported = v.supportedSizeIds ?? [];
  // Chỉ giữ mã của các cỡ đổ được; không có nắp thì bỏ mã nắp
  const sizeMaterials = Object.fromEntries(
    supported.map((id) => {
      const stock = resolved.sizeMaterials?.[id] ?? {};
      return [id, { materialId: stock.materialId, lidMaterialId: v.hasLid ? stock.lidMaterialId : undefined }];
    }),
  );
  return {
    ...base,
    shape: v.shape ?? "jar",
    supportedSizeIds: supported,
    sizeMaterials,
    translucent: v.translucent || undefined,
    lid: v.hasLid ? { priceDelta: Math.round(v.lidPrice ?? 0) } : null,
  } as VesselOption;
}
