// Kho › Sản xuất: thành phẩm xưởng tự làm (hũ gốm) từ nguyên liệu khác trong Kho (thạch cao, màu)
// — tạo mới kèm mẻ đầu, làm mẻ sau ở thẻ tồn kho, chuyển nguyên liệu mua về sang sản xuất (docs/pages/inventory.md#sản-xuất)
import { expect, test } from "./support/harness.mjs";

const now = new Date().toISOString();
const mat = (id: string, over: Record<string, unknown>) => ({ id, name: id, category: "other", unit: "g", tracked: true, stock: 0, lowStock: 0, updatedAt: now, ...over });
const plaster = (stock = 12_000) => mat("thach-cao", { name: "Thạch cao", stock, unitCost: 40 });
const dye = mat("mau-thach-cao", { name: "Màu pha thạch cao", unit: "ml", category: "dye", stock: 500, unitCost: 200 });

const seed = async (page, materials: unknown[]) => {
  await page.goto("/");
  await page.evaluate((list) => localStorage.setItem("bo-inventory-v2", JSON.stringify({ materials: list, movements: [] })), materials);
};
const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("bo-inventory-v2") ?? "null"));
const drawer = (page) => page.locator(".ant-drawer-open");
const card = (page) => drawer(page).getByRole("region", { name: "Tồn kho hiện tại" });
const chooseMade = (page) => drawer(page).locator(".ant-form-item").filter({ hasText: "Nguồn" }).first().locator(".ant-segmented-item").filter({ hasText: "Sản xuất" }).click();

// Danh sách lọc lại sau khi gõ có lúc làm cú bấm trượt khỏi option — thử lại tới khi ô hiện đúng lựa chọn.
// Khớp đúng tên ("Thạch cao" không lấy nhầm "Màu pha thạch cao")
const pickOption = async (page, select, text) => {
  const field = select.locator("xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' ant-select ')][1]");
  await expect(async () => {
    if (!(await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden)").count())) await select.click();
    await select.fill("");
    await page.keyboard.type(text);
    await page
      .locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option")
      .filter({ has: page.getByText(text, { exact: true }) })
      .first()
      .click({ timeout: 2000 });
    await expect(field.getByText(text, { exact: true })).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });
};

test.beforeEach(async ({ t }) => {
  void t;
});

test("Thêm thành phẩm Sản xuất: công thức, làm mẻ đầu, trừ từng nguyên liệu, giá theo nguyên liệu", async ({ page }) => {
  await seed(page, [plaster(), dye]);
  await page.goto("/inventory?material=new");
  const d = drawer(page);
  await chooseMade(page);
  await d.locator("#name").fill("Hũ gốm 150ml");
  // Sản xuất luôn theo dõi tồn — không có công tắc, không có ô tiền mua
  await expect(d.getByRole("switch", { name: "Theo dõi tồn kho" })).toHaveCount(0);
  await expect(d.getByLabel("Tổng tiền đã trả")).toHaveCount(0);
  const recipe = d.locator("section").filter({ hasText: "Sản xuất từ" });
  await expect(recipe).toContainText("Lượng nguyên liệu cho 1 cái");
  await pickOption(page, d.getByLabel("Nguyên liệu dòng 1"), "Thạch cao");
  await d.getByLabel("Lượng dòng 1").fill("350");
  await recipe.getByRole("button", { name: "Thêm nguyên liệu" }).click();
  await pickOption(page, d.getByLabel("Nguyên liệu dòng 2"), "Màu pha thạch cao");
  await d.getByLabel("Lượng dòng 2").fill("2");

  await d.getByLabel("Số lượng sản xuất").fill("20");
  const needs = d.getByRole("list", { name: "Nguyên liệu cần cho mẻ" });
  await expect(needs.getByRole("listitem").filter({ hasText: /^Thạch cao/ })).toContainText("trừ 7.000 g · còn 12.000");
  await expect(needs.getByRole("listitem").filter({ hasText: "Màu pha" })).toContainText("trừ 40 ml · còn 500");
  // 7.000 g × 40 ₫ + 40 ml × 200 ₫ = 288.000 ₫ cho 20 hũ
  await expect(d).toContainText("Tiền nguyên liệu tiêu tốn: 288.000");
  await expect(d).toContainText("Chi phí mẻ 288.000 ₫ = 14.400 ₫/cái");
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Thêm vào kho" }).click();
  await expect(drawer(page)).toHaveCount(0);

  const inv = await stored(page);
  const jar = inv.materials.find((m) => m.name === "Hũ gốm 150ml");
  expect(jar).toMatchObject({ unit: "pcs", tracked: true, stock: 20, unitCost: 14_400, recipe: [{ materialId: "thach-cao", quantity: 350 }, { materialId: "mau-thach-cao", quantity: 2 }] });
  expect(inv.materials.find((m) => m.id === "thach-cao").stock).toBe(5000);
  expect(inv.materials.find((m) => m.id === "mau-thach-cao").stock).toBe(460);
  // Mỗi nguyên liệu một phiếu, chung mã mẻ với phiếu thành phẩm
  const [output, ...uses] = inv.movements;
  expect(output).toMatchObject({ materialId: jar.id, type: "make", change: 20, after: 20, totalCost: 288_000, unitCost: 14_400, note: "Mẻ đầu tiên" });
  expect(uses).toHaveLength(2);
  for (const mv of uses) expect(mv).toMatchObject({ type: "make", batch: output.batch, note: "Làm Hũ gốm 150ml · 20 cái" });
  expect(uses.map((mv) => mv.change).sort()).toEqual([-40, -7000]);

  // Bảng ghi Tự sản xuất; lịch sử thạch cao ghi dùng để làm hũ
  await expect(page.locator("main tr.ant-table-row").filter({ hasText: "Hũ gốm 150ml" })).toContainText("Tự sản xuất");
  await page.goto("/inventory?material=thach-cao");
  const history = drawer(page).locator("section").filter({ hasText: "Lịch sử kho" });
  await expect(history).toContainText("Sản xuất");
  await expect(history).toContainText("Làm Hũ gốm 150ml · 20 cái");
  await expect(history).toContainText(`Mẻ ${output.batch}`);
  await expect(history).toContainText("-7.000 g");
});

test("Tạo mới: thiếu nguyên liệu thì chặn, Tự nhập giá thì bắt buộc tổng chi phí", async ({ page }) => {
  await seed(page, [plaster(5000)]);
  await page.goto("/inventory?material=new");
  const d = drawer(page);
  await chooseMade(page);
  await d.locator("#name").fill("Hũ gốm trụ");
  await pickOption(page, d.getByLabel("Nguyên liệu dòng 1"), "Thạch cao");
  await d.getByLabel("Lượng dòng 1").fill("350");
  await d.getByLabel("Số lượng sản xuất").fill("20");
  await expect(d.getByRole("list", { name: "Nguyên liệu cần cho mẻ" })).toContainText("trừ 7.000 g · chỉ còn 5.000");
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Thêm vào kho" }).click();
  await expect(d).toContainText("Không đủ Thạch cao (cần 7.000 g, còn 5.000).");
  expect((await stored(page)).materials).toHaveLength(1);

  await d.getByLabel("Số lượng sản xuất").fill("10");
  await expect(d).not.toContainText("Không đủ Thạch cao");
  // Có thêm tiền điện nung: tự nhập tổng chi phí
  await d.locator(".ant-segmented-item").filter({ hasText: "Tự nhập" }).click();
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Thêm vào kho" }).click();
  await expect(d).toContainText("Nhập tổng chi phí cả mẻ.");
  await d.getByLabel("Tổng chi phí mẻ").fill("200000");
  await expect(d).not.toContainText("Nhập tổng chi phí cả mẻ.");
  await expect(d).toContainText("Chi phí mẻ 200.000 ₫ = 20.000 ₫/cái");
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Thêm vào kho" }).click();
  await expect(drawer(page)).toHaveCount(0);
  const inv = await stored(page);
  expect(inv.materials.find((m) => m.name === "Hũ gốm trụ")).toMatchObject({ stock: 10, unitCost: 20_000 });
  expect(inv.materials.find((m) => m.id === "thach-cao").stock).toBe(1500);
});

test("Mẻ sau: tab Sản xuất trên thẻ tồn kho, gộp giá bình quân, thiếu nguyên liệu thì chặn", async ({ page }) => {
  await seed(page, [plaster(), mat("hu-gom", { name: "Hũ gốm", unit: "pcs", category: "vessel", stock: 2, unitCost: 15_000, recipe: [{ materialId: "thach-cao", quantity: 350 }] })]);
  await page.goto("/inventory?material=hu-gom");
  const c = card(page);
  await c.locator(".ant-segmented-item").filter({ hasText: "Sản xuất" }).click();
  await c.getByLabel("Số lượng sản xuất").fill("40");
  // 40 × 350 g = 14.000 g > 12.000 g
  await expect(c.getByRole("status")).toContainText("Không đủ Thạch cao (cần 14.000 g, còn 12.000)");
  await c.getByRole("button", { name: "Ghi nhận" }).click();
  await expect(c.getByRole("status")).toContainText("Không đủ Thạch cao");
  await expect(c.locator(".big-number")).toContainText("2");

  await c.getByLabel("Số lượng sản xuất").fill("10");
  await expect(c.getByRole("list", { name: "Nguyên liệu cần cho mẻ" })).toContainText("trừ 3.500 g · còn 12.000");
  // 3.500 g × 40 ₫ = 140.000 ₫ → 14.000 ₫/cái; bình quân (2 × 15.000 + 10 × 14.000) ÷ 12
  await expect(c.getByRole("status")).toContainText("Sau phiếu: 12 cái · chi phí mẻ 140.000 ₫ = 14.000 ₫/cái");
  // Bình quân 14.166,67 ₫ hiện làm tròn tới 100 ₫
  await expect(c.getByRole("status")).toContainText("14.200 ₫");
  await c.getByLabel("Ghi chú phiếu").fill("Mẻ tuần 45");
  await c.getByRole("button", { name: "Ghi nhận" }).click();
  await expect(c.locator(".big-number")).toContainText("12");
  const inv = await stored(page);
  expect(inv.materials.find((m) => m.id === "hu-gom")).toMatchObject({ stock: 12, unitCost: 14_166.67 });
  expect(inv.materials.find((m) => m.id === "thach-cao").stock).toBe(8500);
  const history = drawer(page).locator("section").filter({ hasText: "Lịch sử kho" });
  await expect(history).toContainText("Mẻ tuần 45");
  await expect(history).toContainText("Chi phí mẻ 140.000");
});

test("Chuyển nguyên liệu mua về sang Sản xuất; công thức không chọn được chính nó; xóa nguyên liệu đang dùng để làm thì cảnh báo", async ({ page }) => {
  await seed(page, [plaster(), mat("hu-gom", { name: "Hũ gốm", unit: "pcs", category: "vessel", stock: 5, unitCost: 18_000 })]);
  await page.goto("/inventory?material=hu-gom");
  const d = drawer(page);
  // Mua về: thẻ tồn kho chưa có tab Sản xuất
  await expect(card(page).locator(".ant-segmented-item").filter({ hasText: "Sản xuất" })).toHaveCount(0);
  await chooseMade(page);
  await d.getByLabel("Nguyên liệu dòng 1").click();
  const options = page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option");
  await expect(options.filter({ hasText: "Thạch cao" })).toHaveCount(1);
  await expect(options.filter({ hasText: "Hũ gốm" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await pickOption(page, d.getByLabel("Nguyên liệu dòng 1"), "Thạch cao");
  await d.getByLabel("Lượng dòng 1").fill("300");
  // Đã có: không làm mẻ khi lưu, số tồn giữ nguyên
  await expect(d.getByLabel("Số lượng sản xuất")).toHaveCount(0);
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Lưu thông tin" }).click();
  await expect(drawer(page)).toHaveCount(0);
  let inv = await stored(page);
  expect(inv.materials.find((m) => m.id === "hu-gom")).toMatchObject({ stock: 5, unitCost: 18_000, recipe: [{ materialId: "thach-cao", quantity: 300 }] });
  expect(inv.movements).toHaveLength(0);

  await page.goto("/inventory?material=hu-gom");
  await expect(card(page).locator(".ant-segmented-item").filter({ hasText: "Sản xuất" })).toHaveCount(1);

  await page.goto("/inventory?material=thach-cao");
  await drawer(page).locator(".ant-drawer-footer").getByRole("button", { name: "Xóa" }).click();
  await expect(page.locator(".ant-popconfirm")).toContainText("Đang dùng để sản xuất Hũ gốm");

  // Đổi lại thành nguyên liệu mua về thì bỏ công thức
  await page.goto("/inventory?material=hu-gom");
  await drawer(page).locator(".ant-form-item").filter({ hasText: "Nguồn" }).first().locator(".ant-segmented-item").filter({ hasText: "Nguyên liệu" }).click();
  await drawer(page).locator(".ant-drawer-footer").getByRole("button", { name: "Lưu thông tin" }).click();
  await expect(drawer(page)).toHaveCount(0);
  inv = await stored(page);
  expect(inv.materials.find((m) => m.id === "hu-gom").recipe).toBeUndefined();
});
