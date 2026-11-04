// E2E 1 — Kho nguyên liệu từ trống: thêm nguyên liệu, nhập / xuất / kiểm kê, phân loại, lọc
import { inventoryFromScratch } from "./flows/inventory-from-scratch.mjs";
import { test } from "./support/harness.mjs";

test("E2E 1 — Kho nguyên liệu từ trống: thêm nguyên liệu, nhập / xuất / kiểm kê, phân loại, lọc", async ({ t }) => {
  await inventoryFromScratch(t);
});
