// Giá bán (Thủ công) so với giá vốn (Kho): giá hũ + phụ thu cỡ, sáp / màu / hương tính theo lượng, phụ thu lựa chọn, giá gợi ý, chuyển cấu hình cũ (docs/pages/craft.md#giá-bán-và-giá-vốn)
import { expect, test } from "@playwright/test";
import { costBasis } from "@/lib/costs";
import { defaultCraftConfig } from "@/lib/craft/default-config";
import { splitSharedSizes, toAmountPricing } from "@/lib/craft/legacy";
import { belowCost, lowMargin, needsReview, optionCheck, sizeCheck, suggestPrice, suggestUnitPrice } from "@/lib/craft/pricing";
import { priceSelection, type CraftSelection } from "@/lib/craft/selection";
import type { CraftConfig, CraftStep, OptionStep, StepOption, VesselOption, VesselStep } from "@/lib/craft/types";
import { guessJar, jarsOfType, toMap } from "@/lib/inventory/stock";
import { mockInventory } from "@/lib/inventory/mock";

// Giá nhập mẫu: bát thạch cao 35.000 ₫, sáp đậu nành 90 ₫/g, sáp ong 220 ₫/g, bấc cotton 1.500 ₫, tinh dầu Vanilla 1.800 ₫/ml, Rose 3.500 ₫/ml
// Giá bán mẫu: sáp đậu nành 18.000 ₫/100 g, sáp ong 44.000 ₫/100 g, Vanilla 3.600 ₫/ml, Rose 7.000 ₫/ml, màu 800 ₫/ml
const config = defaultCraftConfig;
const map = toMap(mockInventory.materials);
const step = (id: string) => config.steps.find((s) => s.id === id) as OptionStep;
const option = (stepId: string, id: string) => (step(stepId).options as StepOption[]).find((o) => o.id === id)!;
const plaster = option("container", "plaster") as VesselOption;
const s200 = plaster.sizes.find((s) => s.ml === 200)!;
// Bát thạch cao 200ml = 160 g sáp
const jar200 = { container: { kind: "vessel" as const, optionId: "plaster", sizeId: s200.id, withLid: false } };
const total = (cfg: CraftConfig, extra: CraftSelection) => priceSelection(cfg, { ...jar200, ...extra }).unit - priceSelection(cfg, jar200).unit;
const lines = (extra: CraftSelection) => priceSelection(config, { ...jar200, ...extra }).lines.slice(1);

test.describe("Hũ: giá hũ + phụ thu cỡ", () => {
  test("Giá khách trả = giá hũ + phụ thu cỡ của chính hũ đó", () => {
    const sel = { container: { ...jar200.container, sizeId: plaster.sizes[1].id } };
    // 575.000 + 150.000 cho cỡ 250ml
    expect(priceSelection(config, sel).unit).toBe(725_000);
    expect(priceSelection(config, sel).lines[0]).toMatchObject({ label: "Hũ thạch cao 250ml", amount: 725_000, base: true });
  });
  test("≥ vốn hũ cỡ đó + mục mặc định tính giá cố định (bấc); sáp, màu, hương khách trả riêng theo lượng", () => {
    const c = sizeCheck(config, plaster, s200, map);
    expect(c.parts).toEqual([
      { step: "Hũ", name: "Bát thạch cao 200ml", cost: 35_000 },
      { step: "Bấc", name: "Bấc cotton", cost: 1_500 },
    ]);
    expect(c.floor).toBe(36_500);
    expect(c.price).toBe(575_000);
    expect(lowMargin(c, 95)).toBe(true);
    expect(lowMargin(c, 50)).toBe(false);
  });
  test("Giá thấp hơn vốn; cột hũ lấy cỡ thiếu nhiều nhất", () => {
    expect(needsReview(sizeCheck(config, { ...plaster, priceDelta: 30_000 }, s200, map), 0)).toBe(true);
    const c = optionCheck(config, step("container"), { ...plaster, priceDelta: 30_000, sizes: plaster.sizes.map((s) => ({ ...s, priceDelta: 0 })) }, map)!;
    expect(c.size?.ml).toBe(200);
    expect(belowCost(c)).toBe(true);
  });
});

test.describe("Sáp, màu, hương: giá theo lượng dùng cho hũ đã chọn", () => {
  test("Ví dụ: sáp 2.000 ₫/100 g, hũ 150ml dùng 120 g → 2.400 ₫", () => {
    const cfg = { ...config, steps: config.steps.map((s) => (s.id === "wax" ? { ...s, options: (s as OptionStep).options.map((o) => (o.id === "soy" ? { ...o, unitPrice: 2_000 } : o)) } : s)) } as CraftConfig;
    const sel = { container: { kind: "vessel" as const, optionId: "ceramic", sizeId: "s150", withLid: false }, wax: { kind: "cards" as const, optionIds: ["soy"] } };
    expect(priceSelection(cfg, sel).lines[1]).toEqual({ stepId: "wax", label: "Sáp đậu nành 120 g", amount: 2_400 });
  });
  test("Một loại sáp: 160 g × 18.000 ₫/100 g", () => {
    expect(lines({ wax: { kind: "cards", optionIds: ["soy"] } })).toEqual([{ stepId: "wax", label: "Sáp đậu nành 160 g", amount: 28_800 }]);
  });
  test("Nhiều loại sáp: chia lượng theo %, cộng lại; admin điền lượng thì theo lượng đó", () => {
    expect(total(config, { wax: { kind: "cards", optionIds: ["soy", "beeswax"] } })).toBe(80 * 180 + 80 * 440);
    expect(total(config, { wax: { kind: "cards", optionIds: ["soy", "beeswax"], amounts: { soy: 120, beeswax: 40 } } })).toBe(120 * 180 + 40 * 440);
  });
  test("Hương: lượng sáp × tỉ lệ độ đậm × % phối; đậm hơn thì nhiều ml hơn, giá tự tăng", () => {
    // 160 g × 8% = 12,8 ml × 3.600 = 46.080 → 46.100
    expect(lines({ fragrance: { kind: "blend", items: [{ optionId: "vanilla", weight: 1 }], intensity: "medium" } })).toEqual([{ stepId: "fragrance", label: "Vanilla 12,8 ml", amount: 46_100 }]);
    // Đậm 10%: 16 ml × 3.600
    expect(total(config, { fragrance: { kind: "blend", items: [{ optionId: "vanilla", weight: 1 }], intensity: "strong" } })).toBe(57_600);
    // 50/50 Vanilla + Rose: 6,4 ml mỗi mùi
    expect(total(config, { fragrance: { kind: "blend", items: [{ optionId: "vanilla", weight: 50 }, { optionId: "rose", weight: 50 }], intensity: "medium" } })).toBe(23_000 + 44_800);
    // Không mùi: không tính
    expect(total(config, { fragrance: { kind: "blend", items: [{ optionId: "none", weight: 1 }], intensity: null } })).toBe(0);
  });
  test("Màu: lượng sáp × 1 ml/100 g × giá mỗi ml", () => {
    // 1,6 ml × 800 = 1.280 → 1.300
    expect(total(config, { color: { kind: "swatches", optionIds: ["cream"] } })).toBe(1_300);
    expect(total(config, { color: { kind: "swatches", optionIds: ["natural"] } })).toBe(0);
  });
  test("So giá vốn theo đơn vị: giá bán mỗi 100 g / mỗi ml ≥ giá nhập cùng đơn vị", () => {
    expect(optionCheck(config, step("wax"), option("wax", "beeswax"), map)).toMatchObject({ price: 44_000, floor: 22_000, per: "100 g" });
    expect(optionCheck(config, step("fragrance"), option("fragrance", "rose"), map)).toMatchObject({ price: 7_000, floor: 3_500, per: "ml" });
    const cheap = optionCheck(config, step("wax"), { ...option("wax", "soy"), unitPrice: 5_000 }, map)!;
    expect(belowCost(cheap)).toBe(true);
    expect(suggestUnitPrice(cheap.floor, { priceMarkup: 2.5, minMargin: 50 })).toBe(22_500);
  });
});

test.describe("Phụ thu lựa chọn tính giá cố định", () => {
  test("Bước bắt buộc: chỉ bù phần đắt hơn mục mặc định đã tính trong giá hũ", () => {
    // Bấc gỗ 4.500 − bấc cotton 1.500
    expect(optionCheck(config, step("wick"), option("wick", "wood"), map)!.floor).toBe(3_000);
    expect(optionCheck(config, step("wick"), option("wick", "cotton"), map)).toMatchObject({ floor: 0, isDefault: true });
  });
});

test.describe("Hũ trong Kho: loại hũ và dung tích", () => {
  test("Các mã cùng loại hũ là các cỡ, xếp theo dung tích; nắp không có loại hũ", () => {
    expect(jarsOfType(mockInventory.materials, "Bát thạch cao").map((m) => [m.id, m.capacity])).toEqual([
      ["jar-plaster-200", 200],
      ["jar-plaster-250", 250],
    ]);
    expect(mockInventory.materials.find((m) => m.id === "lid-tin-150")).toMatchObject({ jarType: undefined, capacity: 150 });
  });
  test("Bản lưu cũ: đoán loại hũ và dung tích theo tên", () => {
    expect(guessJar("Hũ thạch cao 150ml")).toEqual({ jarType: "Hũ thạch cao", capacity: 150 });
    expect(guessJar("Nắp gỗ hũ gốm 200 ml")).toEqual({ jarType: undefined, capacity: 200 });
    expect(guessJar("Sáp đậu nành")).toEqual({});
  });
});

test.describe("Chuyển cấu hình cũ", () => {
  test("Kích thước chung + phụ thu hũ → giá hũ + phụ thu cỡ, giá khách trả không đổi", () => {
    const legacy = {
      id: "container",
      kind: "vessel",
      sizes: [
        { id: "s150", ml: 150, grams: 120, basePrice: 400_000, available: true },
        { id: "s200", ml: 200, grams: 160, basePrice: 500_000, available: true },
      ],
      options: [{ id: "a", priceDelta: 40_000, supportedSizeIds: ["s150", "s200"], sizeMaterials: { s150: { materialId: "jar-a-150" } } }],
    } as unknown as CraftStep;
    const v = splitSharedSizes(legacy) as VesselStep;
    expect("sizes" in v).toBe(false);
    expect(v.options[0].priceDelta).toBe(440_000);
    expect(v.options[0].sizes).toEqual([
      { id: "s150", ml: 150, grams: 120, priceDelta: 0, available: true, materialId: "jar-a-150" },
      { id: "s200", ml: 200, grams: 160, priceDelta: 100_000, available: true },
    ]);
  });
  test("Phụ thu cố định của sáp, hương → giá theo lượng (theo hũ 160 g); bỏ phụ thu hương, phụ thu độ đậm", () => {
    const wax = { id: "wax", kind: "cards", gramsPerGram: 1, options: [{ id: "b", priceDelta: 48_000, materialId: "wax-beeswax" }] } as unknown as CraftStep;
    expect((toAmountPricing(wax) as OptionStep).options[0]).toMatchObject({ priceDelta: 0, unitPrice: 30_000 });
    const blend = {
      id: "fragrance",
      kind: "blend",
      scentPrice: { basePrice: 10_000, standardLoad: 0.1 },
      intensity: { priceDelta: { light: 0, medium: 0, strong: 10_000 }, load: { light: 0.06, medium: 0.08, strong: 0.1 } },
      options: [{ id: "v", priceDelta: 6_000, materialId: "oil-vanilla" }, { id: "none", priceDelta: 0, exclusive: true }],
    } as unknown as CraftStep;
    const b = toAmountPricing(blend) as OptionStep & { scentPrice?: unknown; intensity: { priceDelta?: unknown } };
    // (6.000 + 10.000) ÷ (160 g × 10%) = 1.000 ₫/ml
    expect(b.options[0]).toMatchObject({ priceDelta: 0, unitPrice: 1_000 });
    expect(b.options[1]).not.toHaveProperty("unitPrice");
    expect(b.scentPrice).toBeUndefined();
    expect(b.intensity).toEqual({ load: { light: 0.06, medium: 0.08, strong: 0.1 } });
  });
});

test("Giá gợi ý = vốn × hệ số, không thấp hơn mức lãi tối thiểu, làm tròn lên 5.000 ₫", () => {
  expect(suggestPrice(26_000, { priceMarkup: 2.5, minMargin: 50 })).toBe(65_000);
  expect(suggestPrice(36_500, { priceMarkup: 2.5, minMargin: 95 })).toBe(730_000);
  expect(suggestPrice(0, { priceMarkup: 2.5, minMargin: 50 })).toBe(0);
});

test("Bảng Kho: gram tính theo 100 g, ml và cái theo 1 đơn vị", () => {
  expect(costBasis).toEqual({ g: 100, ml: 1, pcs: 1 });
});
