// Chuyển qua lại giữa lựa chọn (cấu trúc lồng) và giá trị phẳng của antd Form. Tiền là VNĐ.
import { UNLIMITED } from "@/lib/craft/groups";
import { uniqueId } from "@/lib/craft/steps";
import type { OptionStep, StepOption, VesselOption } from "@/lib/craft/types";

export type OptionFormValues = {
  nameVi: string;
  nameEn?: string;
  descVi?: string;
  descEn?: string;
  price: number;
  stock: number;
  unlimited: boolean;
  available: boolean;
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
  lidStock?: number;
};

export function toFormValues(step: OptionStep, item?: StepOption): OptionFormValues {
  const o = (item ?? {}) as Partial<VesselOption>;
  return {
    nameVi: o.name?.vi ?? "",
    nameEn: o.name?.en,
    descVi: o.description?.vi,
    descEn: o.description?.en,
    price: o.priceDelta ?? 0,
    stock: (o.stock ?? 0) >= UNLIMITED ? 0 : (o.stock ?? 0),
    unlimited: (o.stock ?? 0) >= UNLIMITED,
    available: o.available ?? true,
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
      lidStock: o.lid?.stock ?? 0,
    }),
  };
}

export function fromFormValues(step: OptionStep, v: OptionFormValues, previous?: StepOption): StepOption {
  const vi = v.nameVi.trim();
  const descVi = v.descVi?.trim();
  const unit = step.kind === "vessel" ? "pcs" : step.unit;
  const onlyWith = Object.fromEntries(Object.entries(v.onlyWith ?? {}).filter(([, ids]) => ids?.length));
  const base: StepOption = {
    // Id cố định sau khi tạo — đơn hàng và quy tắc tương thích dùng nó
    id: previous?.id ?? uniqueId(v.nameEn?.trim() || vi, (step.options as StepOption[]).map((o) => o.id), "option"),
    name: { vi, en: v.nameEn?.trim() || vi },
    description: descVi ? { vi: descVi, en: v.descEn?.trim() || descVi } : undefined,
    priceDelta: Math.round(v.price ?? 0),
    stock: v.unlimited ? UNLIMITED : Math.round(v.stock ?? 0),
    unit,
    available: v.available,
    swatch: v.hasSwatch ? v.swatch : undefined,
    images: v.images?.length ? v.images : undefined,
    look: v.look || undefined,
    maxGrams: v.maxGrams || undefined,
    exclusive: step.kind === "blend" && v.exclusive ? true : undefined,
    onlyWith: Object.keys(onlyWith).length ? onlyWith : undefined,
  };
  if (step.kind !== "vessel") return base;
  return {
    ...base,
    shape: v.shape ?? "jar",
    supportedSizeIds: v.supportedSizeIds ?? [],
    translucent: v.translucent || undefined,
    lid: v.hasLid ? { priceDelta: Math.round(v.lidPrice ?? 0), stock: Math.round(v.lidStock ?? 0), unit: "pcs" } : null,
  } as VesselOption;
}
