// Cảnh báo bán lỗ: phụ thu nắp, ô nhập / tuỳ chọn thêm, sản phẩm sau khi giá nhập đổi, đơn sau giảm giá (docs/pages/craft.md#giá-bán-và-giá-vốn)
import { expect, test } from "./support/harness.mjs";

const drawer = (page) => page.locator(".ant-drawer-open").last();
const setMargin = (page, minMargin: number) =>
  page.evaluate((m) => localStorage.setItem("bo-settings-v1", JSON.stringify({ minMargin: m, priceMarkup: 2.5 })), minMargin);
// Moon Morning bán 10.000 ₫ — thấp hơn vốn công thức
const cheapMoon = (page) =>
  page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem("bo-products-v2")!);
    localStorage.setItem("bo-products-v2", JSON.stringify(list.map((p) => (p.id === "moon-morning" ? { ...p, price: 10_000, salePrice: undefined } : p))));
  });

test.beforeEach(async ({ page, t }) => {
  void t;
  await page.goto("/");
  await setMargin(page, 50);
});

test("Nắp: phụ thu nắp so với vốn nắp, gợi ý giá; tính vào cảnh báo đầu trang Thủ công", async ({ page }) => {
  await page.goto("/craft?step=container");
  await expect(page.getByText(/cỡ, nắp hoặc lựa chọn cần xem lại giá bán/)).toBeVisible();
  await page.getByRole("button", { name: "Sửa Hũ thiếc" }).click();
  const d = drawer(page);
  // Nắp thiếc vốn 5.000 ₫, đang thu 0 ₫
  const lid = d.getByRole("group", { name: "Giá vốn nắp" });
  await expect(lid).toContainText("Vốn 5.000");
  await expect(lid).toContainText("Thấp hơn vốn 5.000");
  // 5.000 × 2,5 = 12.500 → 15.000
  await lid.getByRole("button", { name: "Gợi ý phụ thu nắp: 15.000 ₫" }).click();
  await expect(d.getByLabel("Phụ thu nắp")).toHaveValue("15.000");
  await expect(lid).toContainText("lãi 67%");
  await expect(lid.getByRole("button")).toHaveCount(0);
});

test("Cá nhân hóa: gắn nguyên liệu cho ô nhập, phụ thu so với vốn, gợi ý giá", async ({ page }) => {
  await page.goto("/craft?step=personalization");
  // In tên lên nhãn trừ 1 nhãn decal (vốn 1.500 ₫)
  await expect(page.getByLabel("Nguyên liệu Chữ in trên nhãn")).toBeVisible();
  const label = page.getByRole("group", { name: "Giá vốn Chữ in trên nhãn" });
  await expect(label).toContainText("Vốn 1.500");
  await expect(label).toContainText("lãi 94%");
  await page.getByLabel("Phụ thu Chữ in trên nhãn").fill("1000");
  await expect(label).toContainText("Thấp hơn vốn 500");
  await label.getByRole("button", { name: "Gợi ý phụ thu Chữ in trên nhãn: 5.000 ₫" }).click();
  await expect(page.getByLabel("Phụ thu Chữ in trên nhãn")).toHaveValue("5.000");
  // Hộp quà 75.000 ₫ so với vốn hộp 25.000 ₫
  await expect(page.getByRole("group", { name: "Giá vốn Hộp quà" })).toContainText("Vốn 25.000");
});

test("Sản phẩm: giá thấp hơn vốn theo giá nhập hiện tại → cảnh báo, nhãn cạnh giá, lọc riêng", async ({ page }) => {
  await page.goto("/products");
  await expect(page.locator("main tr.ant-table-row").first()).toBeVisible();
  await expect(page.getByText(/sản phẩm cần xem lại giá bán/)).toHaveCount(0);
  await cheapMoon(page);
  await page.reload();
  await expect(page.getByText("1 sản phẩm cần xem lại giá bán")).toBeVisible();
  const row = page.locator("main tr.ant-table-row").filter({ hasText: "Moon Morning" });
  await expect(row).toContainText(/Thấp hơn vốn/);
  await page.getByRole("button", { name: "Chỉ xem các sản phẩm này" }).click();
  await expect(page.locator("main tr.ant-table-row")).toHaveCount(1);
  await page.getByRole("button", { name: "Xem tất cả" }).click();
  await expect(page.locator("main tr.ant-table-row")).toHaveCount(8);
});

test("Tạo đơn: tiền hàng sau giảm giá thấp hơn vốn nguyên liệu → báo đơn lỗ", async ({ page }) => {
  await page.goto("/products");
  await expect(page.locator("main tr.ant-table-row").first()).toBeVisible();
  await cheapMoon(page);
  await page.goto("/orders?order=new");
  const d = drawer(page);
  await d.getByRole("button", { name: "Nến có sẵn" }).click();
  await d.getByLabel("Chọn sản phẩm").first().click();
  await page.keyboard.type("Moon Morning");
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: "Moon Morning" }).first().click();
  const alert = d.locator(".ant-alert").filter({ hasText: /Đơn lỗ/ });
  await expect(alert).toBeVisible();
  await expect(alert).toContainText("Tiền hàng sau giảm giá 10.000");
});

test("Khách chỉ cọc rồi không nhận: sản phẩm báo bỏ cọc lỗ, form sản phẩm gợi ý giá đủ bù", async ({ page }) => {
  // Phí giao phương thức mặc định 1.000.000 ₫: mọi sản phẩm mẫu đều không đủ bù khi khách bỏ cọc
  await page.evaluate(() =>
    localStorage.setItem(
      "bo-settings-v1",
      JSON.stringify({ minMargin: 0, priceMarkup: 1, depositPercent: 50, shippingOptions: [{ id: "standard", name: "Tiêu chuẩn", fee: 1_000_000, days: 3, enabled: true }] }),
    ),
  );
  await page.goto("/products");
  await expect(page.getByText(/sản phẩm cần xem lại giá bán/)).toBeVisible();
  await expect(page.locator("main").getByText(/^Bỏ cọc lỗ /).first()).toBeVisible();

  await page.goto("/products?edit=moon-morning");
  const note = drawer(page).getByRole("note", { name: "Khách bỏ cọc" });
  await expect(note).toContainText("Khách cọc 50% rồi không nhận: cọc");
  await expect(note).toContainText("ship 1.000.000 ₫ (phí giao mặc định)");
  await expect(note).toContainText(/lỗ .* · giá từ .* thì không lỗ/);
  await expect(drawer(page).getByRole("button", { name: /^Gợi ý giá bán: / })).toBeVisible();
});
