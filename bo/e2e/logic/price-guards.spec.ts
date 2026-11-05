// Chỗ có thể bán lỗ âm thầm: phụ thu nắp, ô nhập / tuỳ chọn thêm, sản phẩm sau khi giá nhập đổi, mã giảm giá trên đơn, cọc đơn nhỏ
// (docs/pages/craft.md#giá-bán-và-giá-vốn, docs/pages/products.md#giá-vốn, docs/pages/orders.md#giá-vốn)
import { expect, test } from "@playwright/test";
import { defaultCraftConfig as config } from "@/lib/craft/default-config";
import { belowCost, inputsChecks, itemCheck, lidCheck, lowMargin } from "@/lib/craft/pricing";
import { emptySelection, materialNeeds, validateSelection, type CraftSelection } from "@/lib/craft/selection";
import type { InputsStep, VesselOption, VesselStep } from "@/lib/craft/types";
import { mockInventory } from "@/lib/inventory/mock";
import { toMap } from "@/lib/inventory/stock";
import { depositAmount, goodsCheck, orderTotals } from "@/lib/orders/create";
import { applyFilters, defaultFilters } from "@/lib/products/filters";
import { productPriceCheck, productsToReview } from "@/lib/products/pricing";
import { sampleProducts } from "@/lib/products/sample";

// Giá nhập mẫu: nắp thiếc 5.000 ₫, nắp gốm 12.000 ₫, hộp quà 25.000 ₫, nhãn decal 1.500 ₫
const map = toMap(mockInventory.materials);
const vessel = config.steps.find((s) => s.kind === "vessel") as VesselStep;
const jar = (id: string) => vessel.options.find((o) => o.id === id) as VesselOption;
const inputs = config.steps.find((s) => s.kind === "inputs") as InputsStep;

test.describe("Nắp: phụ thu nắp ≥ giá vốn mã nắp", () => {
  test("Hũ thiếc nắp 0 ₫ mà vốn 5.000 ₫ → thấp hơn vốn; nắp gốm 25.000 ₫ vốn 12.000 ₫ → lãi 52%", () => {
    const tin = lidCheck(jar("tin"), map)!;
    expect(tin).toMatchObject({ price: 0, floor: 5_000 });
    expect(belowCost(tin)).toBe(true);
    const ceramic = lidCheck(jar("ceramic"), map)!;
    expect(ceramic).toMatchObject({ price: 25_000, floor: 12_000 });
    expect(belowCost(ceramic)).toBe(false);
    expect(Math.round(ceramic.margin! * 100)).toBe(52);
  });
  test("Lấy cỡ có nắp đắt nhất; hũ không nắp hoặc nắp không theo dõi tồn thì bỏ qua", () => {
    const ceramic = jar("ceramic");
    const sizes = ceramic.sizes.map((s, i) => (i === 1 ? { ...s, lidMaterialId: "box-gift" } : s));
    expect(lidCheck({ ...ceramic, sizes }, map)).toMatchObject({ floor: 25_000, size: { id: sizes[1].id } });
    expect(lidCheck({ ...ceramic, lid: null }, map)).toBeNull();
    expect(lidCheck({ ...ceramic, sizes: ceramic.sizes.map((s) => ({ ...s, lidMaterialId: undefined })) }, map)).toBeNull();
  });
});

test.describe("Cá nhân hóa: ô nhập và tuỳ chọn thêm gắn nguyên liệu", () => {
  test("Hộp quà 75.000 ₫ so với vốn 25.000 ₫; in nhãn 25.000 ₫ so với nhãn decal 1.500 ₫; ô không gắn nguyên liệu thì bỏ qua", () => {
    expect(inputsChecks(inputs, map).map((x) => [x.id, x.check.price, x.check.floor])).toEqual([
      ["labelText", 25_000, 1_500],
      ["giftBox", 75_000, 25_000],
    ]);
    expect(itemCheck(20_000, "box-gift", map)).toMatchObject({ price: 20_000, floor: 25_000 });
    expect(belowCost(itemCheck(20_000, "box-gift", map)!)).toBe(true);
    expect(itemCheck(20_000, undefined, map)).toBeNull();
  });
  test("Khách nhập chữ in nhãn thì trừ 1 nhãn decal; bỏ trống thì không trừ; hết nhãn thì báo", () => {
    const sel = (text: string): CraftSelection => ({ personalization: { kind: "inputs", values: { labelText: text }, addons: [] } });
    const base = emptySelection(config);
    expect(materialNeeds(config, { ...base, ...sel("Mai") }, map).get("label-decal")).toBe(1);
    expect(materialNeeds(config, { ...base, ...sel("  ") }, map).has("label-decal")).toBe(false);
    const out = toMap(mockInventory.materials.map((m) => (m.id === "label-decal" ? { ...m, stock: 0 } : m)));
    expect(validateSelection(config, { ...base, ...sel("Mai") }, out).map((i) => i.message)).toContain("Chữ in trên nhãn: nguyên liệu đã hết.");
  });
});

test.describe("Sản phẩm trưng bày: giá bán so với giá vốn hiện tại", () => {
  const brown = sampleProducts.find((p) => p.id === "brown-relac")!;
  test("Giá giảm được dùng để so; chưa có công thức thì không kiểm tra", () => {
    const c = productPriceCheck({ ...brown, price: 500_000, salePrice: 1_000 }, map)!;
    expect(c.price).toBe(1_000);
    expect(belowCost(c)).toBe(true);
    expect(productPriceCheck({ ...brown, recipe: undefined }, map)).toBeNull();
  });
  test("Giá nhập tăng sau khi tạo sản phẩm → sản phẩm vào danh sách cần xem lại; lọc chỉ các sản phẩm này", () => {
    expect(productsToReview(sampleProducts, map, 50).size).toBe(0);
    // Giá nhập mọi nguyên liệu tăng 20 lần
    const pricey = toMap(mockInventory.materials.map((m) => (m.unitCost === undefined ? m : { ...m, unitCost: m.unitCost * 20 })));
    const review = productsToReview(sampleProducts, pricey, 50);
    expect(review.size).toBeGreaterThan(0);
    const shown = applyFilters(sampleProducts, { ...defaultFilters, review: true }, review);
    expect(shown.map((p) => p.id).sort()).toEqual([...review.keys()].sort());
  });
});

test.describe("Đơn hàng: tiền hàng sau giảm giá so với giá vốn", () => {
  test("Không tính phí giao; giảm giá làm tiền hàng thấp hơn vốn thì báo", () => {
    const totals = orderTotals([{ kind: "product", price: 300_000, quantity: 1 }], 30_000, "full", 250_000, 50);
    const c = goodsCheck(totals, 80_000);
    expect(c.price).toBe(50_000);
    expect(belowCost(c)).toBe(true);
    const fine = goodsCheck(orderTotals([{ kind: "product", price: 300_000, quantity: 1 }], 30_000, "full", 0, 50), 80_000);
    expect(belowCost(fine)).toBe(false);
    expect(lowMargin(fine, 50)).toBe(false);
    expect(lowMargin(goodsCheck({ subtotal: 100_000, discount: 0 }, 60_000), 50)).toBe(true);
  });
});

test("Cọc: làm tròn tới nghìn, ít nhất 1.000 ₫, không quá tổng", () => {
  expect(depositAmount(765_000, 50)).toBe(383_000);
  expect(depositAmount(1_400, 50)).toBe(1_000);
  expect(depositAmount(900, 50)).toBe(900);
  expect(depositAmount(0, 50)).toBe(0);
  expect(depositAmount(500_000, 0)).toBe(0);
});
