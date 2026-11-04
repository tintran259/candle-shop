// Sản xuất trong xưởng: định mức × số lượng, thiếu nguyên liệu, thiếu giá, chặn vòng (docs/pages/inventory.md#sản-xuất)
import { expect, test } from "@playwright/test";
import { batchError, batchNeeds, batchPlan, batchTotal, isMade, madeFrom, madeWith } from "@/lib/inventory/production";
import { toMap } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";

const mat = (id: string, over: Partial<Material> = {}): Material => ({ id, name: id, category: "other", unit: "g", tracked: true, stock: 0, lowStock: 0, updatedAt: "2026-11-01", ...over });
const plaster = mat("thach-cao", { name: "Thạch cao", stock: 12_000, unitCost: 40 });
const dye = mat("mau", { name: "Màu pha", unit: "ml", stock: 500, unitCost: 200 });
const jar = mat("hu-gom", { name: "Hũ gốm", unit: "pcs", recipe: [{ materialId: "thach-cao", quantity: 350 }, { materialId: "mau", quantity: 2 }] });

test.describe("Định mức × số lượng", () => {
  test("Cộng dồn từng nguyên liệu, bỏ dòng trống", () => {
    expect([...batchNeeds(jar.recipe!, 20)]).toEqual([["thach-cao", 7000], ["mau", 40]]);
    expect([...batchNeeds([{ materialId: "a", quantity: 1 }, { materialId: "a", quantity: 2 }, { materialId: "", quantity: 5 }], 3)]).toEqual([["a", 9]]);
    expect(isMade(jar)).toBe(true);
    expect(isMade(plaster)).toBe(false);
  });
  test("Tiền nguyên liệu tiêu tốn và giá mẻ", () => {
    const plan = batchPlan(jar.recipe!, 20, toMap([plaster, dye, jar]));
    // 7.000 g × 40 + 40 ml × 200
    expect(plan.cost).toBe(288_000);
    expect(plan.short).toEqual([]);
    expect(batchTotal(plan)).toBe(288_000);
    expect(batchTotal(plan, { manual: true, total: 320_000 })).toBe(320_000);
    expect(batchTotal(plan, { manual: true, total: null })).toBeUndefined();
    expect(batchError(plan, undefined, 20)).toBeNull();
  });
});

test.describe("Chặn mẻ không ghi được", () => {
  test("Thiếu nguyên liệu, thiếu giá, chưa nhập tiền tự nhập, số lượng 0", () => {
    const map = toMap([{ ...plaster, stock: 5000 }, { ...dye, unitCost: undefined }, jar]);
    const plan = batchPlan(jar.recipe!, 20, map);
    expect(plan.short.map((l) => l.material.id)).toEqual(["thach-cao"]);
    expect(batchError(plan, undefined, 20)).toBe("Không đủ Thạch cao (cần 7.000 g, còn 5.000).");
    const enough = batchPlan(jar.recipe!, 10, map);
    expect(batchError(enough, undefined, 10)).toContain("Màu pha chưa có giá nhập");
    expect(batchTotal(enough)).toBeUndefined();
    // Tự nhập giá thì không cần giá nguyên liệu, nhưng phải có số tiền
    expect(batchError(enough, { manual: true, total: null }, 10)).toBe("Nhập tổng chi phí cả mẻ.");
    expect(batchError(enough, { manual: true, total: 150_000 }, 10)).toBeNull();
    expect(batchError(enough, undefined, 0)).toBe("Nhập số lượng sản xuất lớn hơn 0.");
  });
  test("Nguyên liệu trong công thức đã bị xóa khỏi Kho", () => {
    const plan = batchPlan(jar.recipe!, 1, toMap([plaster, jar]));
    expect(plan.gone).toEqual(["mau"]);
    expect(batchError(plan, undefined, 1)).toContain("đã bị xóa khỏi Kho");
    expect(batchTotal(plan)).toBeUndefined();
  });
});

test.describe("Công thức không được vòng", () => {
  test("Phát hiện dùng trực tiếp và qua bán thành phẩm khác", () => {
    const lid = mat("nap", { recipe: [{ materialId: "hu-gom", quantity: 1 }] });
    const map = toMap([plaster, dye, jar, lid]);
    expect(madeFrom(map, "hu-gom", "thach-cao")).toBe(true);
    expect(madeFrom(map, "nap", "thach-cao")).toBe(true);
    expect(madeFrom(map, "thach-cao", "hu-gom")).toBe(false);
    expect(madeWith([plaster, dye, jar, lid], "thach-cao").map((m) => m.id)).toEqual(["hu-gom"]);
  });
});
