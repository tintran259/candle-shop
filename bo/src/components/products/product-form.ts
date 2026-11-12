// Chuyển qua lại giữa Product và giá trị phẳng của antd Form
import { slugify } from "@/lib/craft/groups";
import type { CancelledProduct } from "@/lib/cancelled/types";
import type { CraftConfig } from "@/lib/craft/types";
import type { MaterialMap } from "@/lib/inventory/stock";
import { buildSize, emptyBuild, recipeFromBuild, sizeFromCapacity, waxTypeOf, type ExtraLine, type ProductBuild } from "@/lib/products/build";
import type { AromaLevel, Product, RecipeLine } from "@/lib/products/types";

// Trong form: dòng phụ kiện có thể đang trống
export type BuildValues = {
  selection: ProductBuild["selection"];
  extras: Partial<ExtraLine>[];
};

export type ProductFormValues = {
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number | null;
  images: string[];
  categoryId?: string;
  conceptIds: string[];
  aromaLevel: AromaLevel;
  scent?: string;
  burnTime?: number | null;
  // Chọn theo các bước Thủ công + phụ kiện khác — công thức suy ra từ đây
  build: BuildValues;
  active: boolean;
  isNew: boolean;
  isFeatured: boolean;
};

// Sản phẩm đã có: dùng lựa chọn đã lưu. Sản phẩm cũ chỉ có công thức (hoặc bản dựng kiểu cũ) thì giữ công thức ở phần phụ kiện khác
function buildOf(p: Product | undefined, config: CraftConfig): BuildValues {
  if (p?.build && "selection" in p.build)
    return {
      selection: { ...emptyBuild(config).selection, ...p.build.selection },
      extras: p.build.extras,
    };
  return { ...emptyBuild(config), extras: p?.recipe ?? [] };
}

export function toFormValues(p: Product | undefined, config: CraftConfig): ProductFormValues {
  return {
    name: p?.name ?? "",
    slug: p?.slug ?? "",
    description: p?.description,
    price: p?.price ?? 0,
    salePrice: p?.salePrice ?? null,
    images: p?.images ?? [],
    categoryId: p?.categoryId,
    conceptIds: p?.conceptIds ?? [],
    aromaLevel: p?.aromaLevel ?? "medium",
    scent: p?.scent,
    burnTime: p?.burnTime ?? null,
    build: buildOf(p, config),
    active: (p?.status ?? "active") === "active",
    isNew: p?.isNew ?? true,
    isFeatured: p?.isFeatured ?? false,
  };
}

// Điền sẵn form từ nến hủy đơn; slug tự tránh slug đã dùng, công thức của nến tự phối giữ ở phần phụ kiện khác
export function fromCancelled(item: CancelledProduct, products: Product[], recipe: RecipeLine[], config: CraftConfig): ProductFormValues {
  const base = slugify(item.name);
  const taken = (slug: string) => products.some((p) => p.slug === slug || p.id === slug);
  let slug = base;
  for (let i = 2; taken(slug); i++) slug = `${base}-${i}`;
  return {
    ...toFormValues(undefined, config),
    name: item.name,
    slug,
    description: item.custom,
    price: item.price,
    images: item.images,
    build: { ...emptyBuild(config), extras: recipe },
  };
}

const clean = (s?: string) => s?.trim() || undefined;

// Bỏ dòng phụ kiện trống
export const cleanBuild = (b: BuildValues): ProductBuild => ({
  selection: b.selection ?? {},
  extras: (b.extras ?? [])
    .filter((e) => e?.materialId && e.quantity)
    .map((e) => ({
      materialId: e.materialId!,
      quantity: Math.round(e.quantity! * 10) / 10,
      ...(e.price ? { price: Math.round(e.price) } : {}),
    })),
});

// config, map: để tính công thức, cỡ trên web (dung tích hũ), loại sáp, giờ cháy theo cỡ
export function fromFormValues(v: ProductFormValues, previous: Product | undefined, config: CraftConfig, map: MaterialMap): Product {
  const slug = slugify(v.slug || v.name);
  const build = cleanBuild(v.build);
  const recipe = recipeFromBuild(build, config, map);
  const size = buildSize(build, config);
  // Chưa chọn hũ theo bước (công thức cũ ở phụ kiện khác): lấy dung tích của mã hũ trong công thức
  const capacity = size?.ml ?? build.extras.map((e) => map.get(e.materialId)).find((m) => m?.jarType)?.capacity;
  return {
    // Sản phẩm mới lấy slug làm id; sửa thì giữ id cũ dù đổi slug
    id: previous?.id ?? slug,
    name: v.name.trim(),
    slug,
    description: clean(v.description),
    price: Math.round(v.price ?? 0),
    salePrice: v.salePrice ? Math.round(v.salePrice) : undefined,
    images: v.images ?? [],
    categoryId: v.categoryId ?? "",
    conceptIds: v.conceptIds ?? [],
    aromaLevel: v.aromaLevel,
    size: capacity ? sizeFromCapacity(capacity) : (previous?.size ?? "medium"),
    scent: clean(v.scent),
    waxType: waxTypeOf(build, config) ?? previous?.waxType,
    // Để trống thì theo giờ cháy đã đo của cỡ hũ
    burnTime: v.burnTime || size?.burnHours || undefined,
    recipe: recipe.length ? recipe : undefined,
    build,
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
