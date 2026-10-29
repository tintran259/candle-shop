// Chuyển qua lại giữa Product và giá trị phẳng của antd Form
import { slugify } from "@/lib/craft/groups";
import type { AromaLevel, AromaType, Product, ProductSize } from "@/lib/products/types";

export type ProductFormValues = {
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  images: string[];
  aromaType: AromaType;
  aromaLevel: AromaLevel;
  size: ProductSize;
  scent?: string;
  waxType?: string;
  burnTime?: number | null;
  active: boolean;
  isNew: boolean;
  isFeatured: boolean;
};

export function toFormValues(p?: Product): ProductFormValues {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    description: p?.description,
    price: p?.price ?? 0,
    salePrice: p?.salePrice ?? null,
    images: p?.images ?? [],
    aromaType: p?.aromaType ?? "nature",
    aromaLevel: p?.aromaLevel ?? "medium",
    size: p?.size ?? "medium",
    scent: p?.scent,
    waxType: p?.waxType,
    burnTime: p?.burnTime ?? null,
    active: (p?.status ?? "active") === "active",
    isNew: p?.isNew ?? true,
    isFeatured: p?.isFeatured ?? false,
  };
}

const clean = (s?: string) => s?.trim() || undefined;

export function fromFormValues(v: ProductFormValues, previous?: Product): Product {
  const slug = slugify(v.slug || v.name);
  return {
    // Sản phẩm mới lấy slug làm id; sửa thì giữ id cũ dù đổi slug
    id: previous?.id ?? slug,
    name: v.name.trim(),
    slug,
    description: clean(v.description),
    price: Math.round(v.price ?? 0),
    salePrice: v.salePrice ? Math.round(v.salePrice) : undefined,
    images: v.images ?? [],
    aromaType: v.aromaType,
    aromaLevel: v.aromaLevel,
    size: v.size,
    scent: clean(v.scent),
    waxType: v.waxType || undefined,
    burnTime: v.burnTime || undefined,
    status: v.active ? "active" : "hidden",
    isNew: v.isNew,
    isFeatured: v.isFeatured,
    rating: previous?.rating ?? 0,
    reviewCount: previous?.reviewCount ?? 0,
    sold: previous?.sold ?? 0,
    createdAt: previous?.createdAt ?? new Date().toISOString().slice(0, 10),
    updatedAt: previous?.updatedAt ?? new Date().toISOString().slice(0, 10),
  };
}
