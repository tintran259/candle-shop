// Sản phẩm trưng bày: bộ lọc, sắp xếp, chuyển form, nguyên liệu theo công thức (docs/pages/products.md)
import { expect, test } from "@playwright/test";
import { fromCancelled, fromFormValues, toFormValues } from "@/components/products/product-form";
import { defaultCraftConfig } from "@/lib/craft/default-config";
import type { CancelledProduct } from "@/lib/cancelled/types";
import { toMap, type MaterialMap } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";
import { availableMap, heldNeeds, linesNeeds, shortages } from "@/lib/orders/materials";
import type { Order } from "@/lib/orders/types";
import { applyFilters, defaultFilters } from "@/lib/products/filters";
import { discountPercent } from "@/lib/products/labels";
import { sampleProducts as mockProducts } from "@/lib/products/sample";
import { mockInventory } from "@/lib/inventory/mock";
import { emptyBuild, sizeFromCapacity } from "@/lib/products/build";

const mats = mockInventory.materials;
const cfg = defaultCraftConfig;
const mmap = toMap(mats);
import type { Product } from "@/lib/products/types";

const names = (list: Product[]) => list.map((p) => p.name);
const filter = (over: Partial<typeof defaultFilters>) => names(applyFilters(mockProducts, { ...defaultFilters, ...over }));

test.describe("Bộ lọc và sắp xếp", () => {
  test("Trạng thái Đang bán / Tạm ẩn", () => {
    expect(filter({ status: "hidden" })).toEqual(["Lavender Dream"]);
    expect(filter({ status: "active" })).toHaveLength(7);
  });
  test("Danh mục và kích thước lọc cùng nhau", () => {
    expect(filter({ categoryId: "parfum" }).sort()).toEqual(["Moon Morning", "Moonlight Aurora", "Woman Secret"]);
    expect(filter({ categoryId: "parfum", size: "big" })).toEqual(["Moonlight Aurora"]);
  });
  test("Tìm không dấu theo tên hoặc slug", () => {
    expect(filter({ q: "MOON" }).sort()).toEqual(["Moon Morning", "Moonlight Aurora"]);
    expect(filter({ q: "citrus-bloom" })).toEqual(["Citrus Bloom"]);
  });
  test("5 cách sắp xếp", () => {
    expect(filter({ sort: "newest" })[0]).toBe("Woman Secret");
    expect(filter({ sort: "bestseller" })[0]).toBe("Moon Morning");
    // Giá tăng dần theo giá thực bán (giá giảm nếu có)
    expect(filter({ sort: "price-asc" }).slice(0, 2)).toEqual(["Vanilla Relax", "Citrus Bloom"]);
    expect(filter({ sort: "price-desc" })[0]).toMatch(/Beach Sunshine|Moonlight Aurora/);
    expect(filter({ sort: "featured" }).slice(0, 3).sort()).toEqual(["Brown Relac", "Moon Morning", "Vanilla Relax"]);
  });
  test("Phần trăm giảm làm tròn, không giảm thì 0", () => {
    expect(discountPercent({ price: 925_000, salePrice: 825_000 })).toBe(11);
    expect(discountPercent({ price: 500_000 })).toBe(0);
    expect(discountPercent({ price: 500_000, salePrice: 600_000 })).toBe(0);
  });
});

test.describe("Chuyển form ↔ sản phẩm", () => {
  test("Sản phẩm mới: slug từ tên, làm tròn giá, bỏ khoảng trắng, chưa có công thức thì không lưu mảng rỗng", () => {
    const p = fromFormValues({ ...toFormValues(undefined, cfg), name: "  Nến Hoa Nhài ", slug: "", price: 500_400.6, salePrice: null, images: ["a.png"], scent: "  ", categoryId: "nature" }, undefined, cfg, mmap);
    expect(p).toMatchObject({ id: "nen-hoa-nhai", slug: "nen-hoa-nhai", name: "Nến Hoa Nhài", price: 500_401, salePrice: undefined, scent: undefined, recipe: undefined, status: "active", sold: 0 });
  });
  test("Sửa sản phẩm giữ id và số liệu dù đổi slug", () => {
    const old = mockProducts[0];
    const p = fromFormValues({ ...toFormValues(old, cfg), slug: "brown-relac-2" }, old, cfg, mmap);
    expect(p).toMatchObject({ id: old.id, slug: "brown-relac-2", sold: old.sold, rating: old.rating, createdAt: old.createdAt });
  });
  test("Tạm ẩn khi tắt Đang bán", () => {
    expect(fromFormValues({ ...toFormValues(mockProducts[0], cfg), active: false }, mockProducts[0], cfg, mmap).status).toBe("hidden");
  });
  test("Sản phẩm cũ chỉ có công thức: công thức giữ ở phụ kiện khác, lưu lại không mất", () => {
    const old = mockProducts[0];
    const v = toFormValues(old, cfg);
    expect(v.build.extras).toEqual(old.recipe);
    expect(fromFormValues(v, old, cfg, mmap).recipe).toEqual(old.recipe);
  });
  test("Tạo từ nến hủy đơn: slug tự tránh slug đã có, điền công thức", () => {
    const item = { name: "Brown Relac", price: 700_000, images: ["x.png"], custom: "Hũ thủy tinh · Sáp dừa" } as CancelledProduct;
    const recipe = [{ materialId: "jar-clear-glass-150", quantity: 1 }, { materialId: "wax-soy", quantity: 100 }];
    const v = fromCancelled(item, mockProducts, recipe, cfg);
    // Công thức của nến tự phối giữ ở phần phụ kiện khác
    expect(v).toMatchObject({ slug: "brown-relac-2", price: 700_000, description: "Hũ thủy tinh · Sáp dừa", build: { extras: recipe } });
  });
  test("Chọn giống nến tự phối: công thức theo lựa chọn + phụ kiện, cỡ theo dung tích, loại sáp, giờ cháy theo cỡ", () => {
    const build = emptyBuild(cfg);
    expect(Object.keys(build.selection)).not.toContain("personalization");
    const selection = {
      ...build.selection,
      container: { kind: "vessel" as const, optionId: "clear-glass", sizeId: "s200", withLid: false },
      wax: { kind: "cards" as const, optionIds: ["soy", "coconut"] },
      fragrance: { kind: "blend" as const, items: [{ optionId: "vanilla", weight: 1 }], intensity: "medium" as const },
      wick: { kind: "cards" as const, optionIds: ["cotton"] },
    };
    const v = { ...toFormValues(undefined, cfg), name: "A", images: ["a.png"], categoryId: "nature", build: { selection, extras: [{ materialId: "box-gift", quantity: 1 }, {}] } };
    const p = fromFormValues(v, undefined, cfg, mmap);
    expect(p.recipe).toEqual([
      { materialId: "jar-clear-glass-200", quantity: 1 },
      { materialId: "wax-soy", quantity: 80 },
      { materialId: "wax-coconut", quantity: 80 },
      { materialId: "oil-vanilla", quantity: 13 },
      { materialId: "wick-cotton", quantity: 1 },
      { materialId: "box-gift", quantity: 1 },
    ]);
    expect(p).toMatchObject({ size: "medium", waxType: "Sáp đậu nành + Sáp dừa", burnTime: 35 });
    expect(p.build?.extras).toEqual([{ materialId: "box-gift", quantity: 1 }]);
    expect(sizeFromCapacity(150)).toBe("small");
    expect(sizeFromCapacity(250)).toBe("big");
  });
});

test.describe("Nguyên liệu theo công thức", () => {
  const mat = (id: string, stock: number, tracked = true) => ({ id, name: id, category: "wax", unit: "g", tracked, stock, lowStock: 0, updatedAt: "" }) as Material;
  const map: MaterialMap = toMap([mat("wax-soy", 1000), mat("jar", 5), mat("no-scent", 0, false)]);
  const products = [
    { id: "a", recipe: [{ materialId: "wax-soy", quantity: 200 }, { materialId: "jar", quantity: 1 }, { materialId: "no-scent", quantity: 1 }] },
    { id: "old" },
  ] as Product[];
  const source = { config: defaultCraftConfig, map, products };

  test("Trừ theo công thức × số lượng, bỏ nguyên liệu không theo dõi tồn", () => {
    expect([...linesNeeds([{ productId: "a", quantity: 3 }], source)]).toEqual([
      ["wax-soy", 600],
      ["jar", 3],
    ]);
  });
  test("Sản phẩm chưa có công thức không giữ, không trừ Kho", () => {
    expect(linesNeeds([{ productId: "old", quantity: 5 }], source).size).toBe(0);
  });
  test("Công thức lưu trên đơn được dùng thay cho công thức hiện tại của sản phẩm", () => {
    expect(linesNeeds([{ productId: "a", recipe: [{ materialId: "wax-soy", quantity: 50 }], quantity: 2 }], source).get("wax-soy")).toBe(100);
  });
  test("Chỉ đơn Đã thanh toán giữ nguyên liệu, phần còn lại là số dùng được", () => {
    const order = (status: Order["status"]) => ({ status, items: [{ productId: "a", quantity: 2 }] }) as unknown as Order;
    const held = heldNeeds([order("paid"), order("pending"), order("producing"), order("cancelled")], source);
    expect(held.get("wax-soy")).toBe(400);
    const usable = availableMap(map, held);
    expect(usable.get("wax-soy")?.stock).toBe(600);
    expect(map.get("wax-soy")?.stock).toBe(1000);
    // 4 cây cần 800g sáp, 4 hũ; dùng được 600g sáp, 3 hũ
    expect(shortages(linesNeeds([{ productId: "a", quantity: 4 }], source), usable).map((s) => [s.m.id, s.need])).toEqual([
      ["wax-soy", 800],
      ["jar", 4],
    ]);
    expect(shortages(linesNeeds([{ productId: "a", quantity: 3 }], source), usable)).toEqual([]);
  });
});
