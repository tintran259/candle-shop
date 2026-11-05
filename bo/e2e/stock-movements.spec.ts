// Trang Phiếu kho: nằm dưới Kho nguyên liệu trên sidebar, lọc theo loại / nguyên liệu / ngày / tìm kiếm, mã mẻ, ghi phiếu (docs/pages/stock-movements.md)
import { expect, test } from "./support/harness.mjs";
import { filterMovements, movementTotals } from "@/lib/inventory/movements";
import { mockInventory } from "@/lib/inventory/mock";
import type { StockMovement } from "@/lib/inventory/types";

const at = (d: string) => `${d}T10:00:00.000Z`;
const list: StockMovement[] = [
  { id: "a", materialId: "wax-soy", type: "in", change: 1000, after: 1000, totalCost: 90_000, by: "x", at: at("2026-11-01") },
  { id: "b", materialId: "oil-rose", type: "order", change: -10, after: 0, orderCode: "SC261029002", by: "x", at: at("2026-11-02") },
  { id: "c", materialId: "jar-plaster-200", type: "make", change: 5, after: 11, batch: "SX-AB12C", totalCost: 0, by: "x", at: at("2026-11-03") },
  { id: "d", materialId: "wax-soy", type: "make", change: -300, after: 700, batch: "SX-AB12C", note: "Làm hũ", by: "x", at: at("2026-11-03") },
];

test.describe("Lọc và tổng hợp", () => {
  test("Theo loại, nguyên liệu, khoảng ngày, tìm mã đơn / mã mẻ / tên không dấu", () => {
    const m = mockInventory.materials;
    expect(filterMovements(list, m, { type: "make" }).map((x) => x.id)).toEqual(["c", "d"]);
    expect(filterMovements(list, m, { materialId: "wax-soy" }).map((x) => x.id)).toEqual(["a", "d"]);
    expect(filterMovements(list, m, { from: "2026-11-02", to: "2026-11-02" }).map((x) => x.id)).toEqual(["b"]);
    expect(filterMovements(list, m, { q: "sx-ab12c" }).map((x) => x.id)).toEqual(["c", "d"]);
    expect(filterMovements(list, m, { q: "SC261029" }).map((x) => x.id)).toEqual(["b"]);
    expect(filterMovements(list, m, { q: "sap dau nanh" }).map((x) => x.id)).toEqual(["a", "d"]);
  });
  test("Tiền nhập chỉ tính phiếu Nhập thêm; đếm phiếu cộng / trừ tồn", () => {
    expect(movementTotals(list)).toEqual({ count: 4, lotMoney: 90_000, inCount: 2, outCount: 2 });
  });
});

test.beforeEach(async ({ page, t }) => {
  void t;
  await page.goto("/");
});

test("Sidebar: Phiếu kho nằm ngay dưới Kho nguyên liệu, mở trang riêng", async ({ page }) => {
  await expect(page.getByRole("menuitem", { name: /Phiếu kho/ })).toBeVisible();
  const items = (await page.getByRole("menuitem").allInnerTexts()).map((x) => x.replace(/\s+/g, " ").trim());
  const i = items.findIndex((x) => x.startsWith("Kho nguyên liệu"));
  expect(i).toBeGreaterThan(-1);
  expect(items[i + 1]).toBe("Phiếu kho");
  await page.getByRole("menuitem", { name: /Phiếu kho/ }).click();
  await expect(page).toHaveURL(/\/inventory\/movements/);
  await expect(page.getByRole("heading", { name: "Phiếu kho", level: 3 })).toBeVisible();
  // Chỉ Phiếu kho sáng, Kho nguyên liệu không
  await expect(page.locator(".ant-menu-item-selected")).toHaveText(/^\s*Phiếu kho\s*$/);
});

test("Trang Kho không còn khối Phiếu kho gần đây", async ({ page }) => {
  await page.goto("/inventory");
  await expect(page.getByRole("heading", { name: "Kho nguyên liệu", level: 3 })).toBeVisible();
  await expect(page.getByText("Phiếu kho gần đây")).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Phiếu kho" })).toHaveCount(0);
});

test("Lọc theo loại, tìm kiếm trên URL; ghi phiếu ngay trên trang", async ({ page }) => {
  await page.goto("/inventory/movements");
  const list = page.getByRole("list", { name: "Phiếu kho" });
  await expect(list.getByRole("listitem")).toHaveCount(5);
  await page.getByLabel("Loại phiếu").click();
  await page.locator(".ant-select-item-option", { hasText: "Xuất / hao hụt" }).click();
  await expect(page).toHaveURL(/type=out/);
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await expect(list).toContainText("Vỡ khi vận chuyển");
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click();
  await page.getByLabel("Tìm phiếu kho").fill("SC261029002");
  await expect(list.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByText("Không có phiếu khớp bộ lọc.")).toHaveCount(0);
  await page.getByLabel("Tìm phiếu kho").fill("khong co gi");
  await expect(page.getByText("Không có phiếu khớp bộ lọc.")).toBeVisible();

  // Ghi phiếu xuất ngay trên trang
  await page.goto("/inventory/movements");
  await page.getByRole("button", { name: "Ghi phiếu kho" }).click();
  const modal = page.locator(".ant-modal").last();
  await expect(modal).toBeVisible();
  await page.keyboard.press("Escape");
});
