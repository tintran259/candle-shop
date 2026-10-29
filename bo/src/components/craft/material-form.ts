// Chuyển qua lại giữa dữ liệu nguyên liệu (cấu trúc lồng) và giá trị phẳng của antd Form. Tiền là VNĐ.
import { optionGroups, slugify, UNLIMITED, type OptionGroup } from "@/lib/craft/groups";
import type { BaseOption, ContainerOption, DecorationOption, WickOption } from "@/lib/craft/types";

export type MaterialFormValues = {
  nameVi: string;
  nameEn?: string;
  descVi?: string;
  descEn?: string;
  price: number;
  stock: number;
  unlimited: boolean;
  available: boolean;
  swatch?: string;
  images: string[];
  // Hũ
  shape?: ContainerOption["shape"];
  supportedSizeIds?: string[];
  translucent?: boolean;
  hasLid?: boolean;
  lidPrice?: number;
  lidStock?: number;
  // Bấc
  containerIds?: string[];
  waxIds?: string[];
  maxGrams?: number | null;
  // Mùi / màu / trang trí
  unscented?: boolean;
  natural?: boolean;
  approved?: boolean;
  look?: DecorationOption["look"] | "none";
};

type Any = BaseOption & Partial<ContainerOption & WickOption & DecorationOption> & { unscented?: boolean; natural?: boolean };

export function toFormValues(group: OptionGroup, item?: BaseOption): MaterialFormValues {
  const o = (item ?? {}) as Partial<Any>;
  return {
    nameVi: o.name?.vi ?? "",
    nameEn: o.name?.en,
    descVi: o.description?.vi,
    descEn: o.description?.en,
    price: o.priceDelta ?? 0,
    stock: (o.stock ?? 0) >= UNLIMITED ? 0 : (o.stock ?? 0),
    unlimited: (o.stock ?? 0) >= UNLIMITED,
    available: o.available ?? true,
    swatch: o.swatch,
    images: o.images ?? [],
    ...(group === "containers" && {
      shape: o.shape ?? "jar",
      supportedSizeIds: o.supportedSizeIds ?? [],
      translucent: !!o.translucent,
      hasLid: !!o.lid,
      lidPrice: o.lid?.priceDelta ?? 0,
      lidStock: o.lid?.stock ?? 0,
    }),
    ...(group === "wicks" && { containerIds: o.containerIds ?? [], waxIds: o.waxIds ?? [], maxGrams: o.maxGrams ?? null }),
    ...(group === "fragrances" && { unscented: !!o.unscented }),
    ...(group === "colors" && { natural: !!o.natural }),
    ...(group === "decorations" && { approved: !!o.approved, look: o.look ?? "none" }),
  };
}

// Danh sách rỗng = dùng được với tất cả (web hiểu undefined là không giới hạn)
const orAll = (ids?: string[]) => (ids?.length ? ids : undefined);
const orUndef = <T,>(v: T | false | undefined) => (v ? v : undefined);

export function fromFormValues(group: OptionGroup, v: MaterialFormValues, previous?: BaseOption): BaseOption {
  const vi = v.nameVi.trim();
  const descVi = v.descVi?.trim();
  const base: BaseOption = {
    id: previous?.id ?? slugify(v.nameEn?.trim() || vi),
    name: { vi, en: v.nameEn?.trim() || vi },
    description: descVi ? { vi: descVi, en: v.descEn?.trim() || descVi } : undefined,
    priceDelta: Math.round(v.price ?? 0),
    stock: v.unlimited ? UNLIMITED : Math.round(v.stock ?? 0),
    unit: optionGroups[group].unit,
    available: v.available,
    swatch: optionGroups[group].swatch ? v.swatch : undefined,
    images: v.images?.length ? v.images : undefined,
  };
  switch (group) {
    case "containers":
      return {
        ...base,
        shape: v.shape ?? "jar",
        supportedSizeIds: v.supportedSizeIds ?? [],
        translucent: orUndef(v.translucent),
        lid: v.hasLid ? { priceDelta: Math.round(v.lidPrice ?? 0), stock: Math.round(v.lidStock ?? 0), unit: "pcs" } : null,
      } as ContainerOption;
    case "wicks":
      return { ...base, containerIds: orAll(v.containerIds), waxIds: orAll(v.waxIds), maxGrams: v.maxGrams || undefined } as WickOption;
    case "fragrances":
      return { ...base, unscented: orUndef(v.unscented) } as BaseOption;
    case "colors":
      return { ...base, natural: orUndef(v.natural) } as BaseOption;
    case "decorations":
      return { ...base, approved: !!v.approved, look: v.look === "none" ? undefined : v.look } as DecorationOption;
    default:
      return base;
  }
}
