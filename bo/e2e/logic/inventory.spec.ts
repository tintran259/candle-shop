// Kho nguyên liệu: mức tồn, phiếu kho, bộ lọc, sắp xếp (docs/pages/inventory.md, docs/inventory.md)
import { expect, test } from "@playwright/test";
import { applyInventoryFilters, defaultInventoryFilters, type InventoryFilters, type InventoryStatus } from "@/lib/inventory/filters";
import { materialLevel, stockAfter, type Usage } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";

const mat = (id: string, over: Partial<Material> = {}): Material => ({ id, name: id, category: "wax", unit: "g", tracked: true, stock: 1000, lowStock: 500, updatedAt: "2026-11-01", ...over });

test.describe("Mức tồn", () => {
  test("Hết hàng, sắp hết, còn hàng; không theo dõi luôn coi là còn", () => {
    expect(materialLevel(mat("a", { stock: 0 }))).toBe("out");
    expect(materialLevel(mat("a", { stock: -5 }))).toBe("out");
    expect(materialLevel(mat("a", { stock: 499 }))).toBe("low");
    expect(materialLevel(mat("a", { stock: 500 }))).toBe("ok");
    expect(materialLevel(mat("a", { stock: 0, tracked: false }))).toBe("untracked");
  });
});

test.describe("Phiếu kho", () => {
  test("Nhập cộng, xuất trừ, kiểm kê đặt lại", () => {
    expect(stockAfter(100, "in", 50)).toBe(150);
    expect(stockAfter(100, "out", 30)).toBe(70);
    expect(stockAfter(100, "adjust", 42)).toBe(42);
    expect(stockAfter(100, "adjust", 0)).toBe(0);
  });
  test("Không cho xuất quá tồn, số âm, số 0 khi nhập / xuất, ô trống", () => {
    expect(stockAfter(100, "out", 101)).toBeNull();
    expect(stockAfter(100, "out", 100)).toBe(0);
    expect(stockAfter(100, "in", 0)).toBeNull();
    expect(stockAfter(100, "in", -1)).toBeNull();
    expect(stockAfter(100, "in", null)).toBeNull();
  });
});

test.describe("Bộ lọc và sắp xếp", () => {
  const list = [
    mat("sap-dau-nanh", { name: "Sáp đậu nành", sku: "SAP-DN", stock: 300, updatedAt: "2026-11-02" }),
    mat("hu-gom", { name: "Hũ gốm", category: "vessel", unit: "pcs", stock: 0, lowStock: 10, updatedAt: "2026-10-01" }),
    mat("vani", { name: "Tinh dầu vani", category: "oil", unit: "ml", stock: 900, updatedAt: "2026-11-03" }),
    mat("khong-mui", { name: "Không mùi", category: "oil", tracked: false, stock: 0, updatedAt: "2026-09-01" }),
    mat("hop-qua", { name: "Hộp quà", category: "packaging", unit: "pcs", stock: 6, lowStock: 10, updatedAt: "2026-10-20" }),
  ];
  const usage = new Map<string, Usage[]>([
    ["sap-dau-nanh", []],
    ["hu-gom", []],
  ]);
  const run = (status: InventoryStatus, over: Partial<InventoryFilters> = {}) => applyInventoryFilters(list, status, { ...defaultInventoryFilters, ...over }, usage).map((m) => m.id);

  test("Lọc theo trạng thái, gồm Không theo dõi và Chưa dùng trên web", () => {
    expect(run("out")).toEqual(["hu-gom"]);
    expect(run("low").sort()).toEqual(["hop-qua", "sap-dau-nanh"]);
    expect(run("ok")).toEqual(["vani"]);
    expect(run("untracked")).toEqual(["khong-mui"]);
    expect(run("unused").sort()).toEqual(["hop-qua", "khong-mui", "vani"]);
  });
  test("Lọc theo loại, tìm không dấu theo tên hoặc mã", () => {
    expect(run("all", { category: "oil" }).sort()).toEqual(["khong-mui", "vani"]);
    expect(run("all", { q: "sap dau" })).toEqual(["sap-dau-nanh"]);
    expect(run("all", { q: "sap-dn" })).toEqual(["sap-dau-nanh"]);
  });
  test("Cần nhập trước: hết hàng, rồi tồn thấp so với ngưỡng, không theo dõi cuối cùng", () => {
    // Sáp 300/500 và hộp quà 6/10 cùng tỉ lệ 0,6 thì xếp theo tên
    expect(run("all")).toEqual(["hu-gom", "hop-qua", "sap-dau-nanh", "vani", "khong-mui"]);
  });
  test("Tên A–Z theo tiếng Việt, mới cập nhật", () => {
    expect(run("all", { sort: "name" })).toEqual(["hop-qua", "hu-gom", "khong-mui", "sap-dau-nanh", "vani"]);
    expect(run("all", { sort: "updated" })[0]).toBe("vani");
  });
});
