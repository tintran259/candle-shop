// Giá hũ theo cỡ lấy từ Kho, giá bán so với giá vốn, giá gợi ý, Cài đặt (docs/pages/craft.md#giá-bán-và-giá-vốn)
import { expect, test } from "./support/harness.mjs";

const setMargin = (page, minMargin: number) =>
  page.evaluate((m) => localStorage.setItem("bo-settings-v1", JSON.stringify({ minMargin: m, priceMarkup: 2.5 })), minMargin);
const drawer = (page) => page.locator(".ant-drawer-open").last();

test.beforeEach(async ({ page, t }) => {
  void t;
  await page.goto("/");
});

test("Kho: cột Giá bình quân theo 100 g, ml và cái theo 1 đơn vị", async ({ page }) => {
  await page.goto("/inventory");
  await expect(page.getByRole("columnheader", { name: "Giá bình quân" })).toBeVisible();
  await page.getByPlaceholder(/Tên hoặc mã nguyên liệu/).fill("Sáp đậu nành");
  await expect(page.getByRole("row").filter({ hasText: "Sáp đậu nành" })).toContainText(/9\.000\s*₫\s*\/\s*100\s*g/);
  await page.getByPlaceholder(/Tên hoặc mã nguyên liệu/).fill("Tinh dầu Vanilla");
  await expect(page.getByRole("row").filter({ hasText: "Tinh dầu Vanilla" })).toContainText(/1\.800\s*₫\s*\/\s*ml/);
});

test("Hũ: giá theo từng cỡ, so với vốn hũ + bấc mặc định, gợi ý phụ thu cỡ", async ({ page }) => {
  await setMargin(page, 50);
  await page.goto("/craft?step=container");
  // Bát thạch cao: giá hũ 575.000, 250ml +150.000
  const row = page.getByRole("row").filter({ hasText: "Hũ thạch cao" });
  await expect(row).toContainText(/200ml\s*575\.000/);
  await expect(row).toContainText(/250ml\s*725\.000/);

  await page.getByRole("button", { name: "Sửa Hũ thạch cao" }).click();
  const d = drawer(page);
  await expect(d.getByLabel("Loại hũ trong Kho")).toBeVisible();
  const s200 = d.getByRole("group", { name: "Giá vốn 200ml" });
  // 35.000 hũ + bấc 1.500 — sáp, màu, hương khách trả riêng theo lượng
  await expect(s200).toContainText("Khách trả 575.000");
  await expect(s200).toContainText("Vốn 36.500");
  await expect(s200).toContainText("lãi 94%");
  await expect(s200.getByRole("button")).toHaveCount(0);

  // Giá hũ thấp hơn vốn → đỏ, có gợi ý phụ thu cỡ
  await d.getByLabel("Giá hũ").fill("30000");
  await expect(s200).toContainText("Thấp hơn vốn 6.500");
  // 36.500 × 2,5 = 91.250 → 95.000, trừ giá hũ 30.000
  await s200.getByRole("button", { name: "Gợi ý phụ thu cỡ 200ml: 65.000 ₫" }).click();
  await expect(d.getByLabel("Phụ thu cỡ 200ml")).toHaveValue("65.000");
  await expect(s200).toContainText("Khách trả 95.000");
  await expect(s200.getByRole("button")).toHaveCount(0);
});

test("Kho thêm hũ cùng loại → thành cỡ mới của hũ ở Thủ công", async ({ page }) => {
  await page.goto("/inventory");
  await page.getByRole("button", { name: "Thêm nguyên liệu" }).click();
  const d = drawer(page);
  await d.getByLabel("Loại", { exact: true }).click();
  await page.locator(".ant-select-item-option", { hasText: "Hũ & nắp" }).click();
  await d.getByLabel("Loại hũ").fill("Bát thạch cao");
  await d.getByLabel("Dung tích").fill("300");
  // Tên tự điền theo loại hũ + dung tích
  await expect(d.getByLabel("Tên nguyên liệu")).toHaveValue("Bát thạch cao 300ml");
  await d.getByRole("button", { name: "Thêm vào kho" }).click();
  await expect(d).toHaveCount(0);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("bo-inventory-v2")!).materials.find((m) => m.name === "Bát thạch cao 300ml"));
  expect(saved).toMatchObject({ category: "vessel", jarType: "Bát thạch cao", capacity: 300 });

  await page.goto("/craft?step=container");
  await expect(page.getByText(/Kho có cỡ mới của “Hũ thạch cao” \(300ml\)/)).toBeVisible();
  await page.getByRole("button", { name: "Sửa Hũ thạch cao" }).click();
  const c = drawer(page);
  const s300 = c.getByRole("group", { name: "Cỡ 300ml" });
  await expect(s300).toContainText("mới trong Kho");
  // Hũ đang bán: cỡ mới để tắt, đặt giá rồi mới bật
  await expect(s300.getByRole("checkbox", { name: "Bán cỡ 300ml" })).not.toBeChecked();
  await s300.getByRole("checkbox", { name: "Bán cỡ 300ml" }).check();
  await c.getByLabel("Phụ thu cỡ 300ml").fill("200000");
  await c.getByRole("button", { name: "Áp dụng" }).click();
  await expect(page.getByRole("row").filter({ hasText: "Hũ thạch cao" })).toContainText(/300ml\s*775\.000/);
  await expect(page.getByText(/Kho có cỡ mới của “Hũ thạch cao”/)).toHaveCount(0);
});

test("Sáp, màu, hương: giá bán mỗi 100 g / mỗi ml so với giá nhập, xem trước tính theo lượng của hũ", async ({ page }) => {
  await setMargin(page, 50);
  await page.goto("/craft?step=wax");
  await expect(page.getByRole("columnheader", { name: "Giá bán / 100 g" })).toBeVisible();
  // Sáp đậu nành bán 18.000 ₫/100 g, nhập 90 ₫/g
  await expect(page.getByRole("group", { name: "Giá vốn Sáp đậu nành" })).toContainText("Vốn 9.000 ₫/100 g");
  await expect(page.getByRole("group", { name: "Giá vốn Sáp đậu nành" })).toContainText("lãi 50%");
  await expect(page.getByRole("group", { name: "Giá vốn Sáp ong" })).toContainText("Vốn 22.000 ₫/100 g");
  await page.goto("/craft?step=fragrance");
  await expect(page.getByRole("columnheader", { name: "Giá bán / ml" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Giá vốn Rose" })).toContainText("Vốn 3.500 ₫/ml");

  await page.goto("/craft?step=wax");
  await page.getByRole("button", { name: "Sửa Sáp ong" }).click();
  const d = drawer(page);
  const price = d.getByLabel("Giá bán / 100 g");
  await price.fill("10000");
  // Ví dụ ở hũ nhỏ nhất: Hũ gốm 150ml đổ 120 g sáp
  await expect(d.getByText(/Vd Hũ gốm 150ml \(120 g sáp\): 120 g × 10\.000\s₫\/100 g = 12\.000\s₫/)).toBeVisible();
  const info = d.getByRole("group", { name: "Giá vốn lựa chọn" });
  await expect(info).toContainText("Thấp hơn vốn 12.000");
  // 22.000 × 2,5 = 55.000 ₫/100 g
  await info.getByRole("button", { name: "Gợi ý giá bán: 55.000 ₫" }).click();
  await expect(price).toHaveValue("55.000");
  await d.getByRole("button", { name: "Áp dụng" }).click();

  // Xem trước bước Hũ: hũ 150ml, rồi bước Sáp hiện giá theo 100 g
  await page.goto("/craft?step=wax&view=preview");
  await expect(page.locator(".sf-preview")).toContainText("55.000 ₫/100 g");
});

test("Cài đặt: lãi tối thiểu và hệ số gợi ý giá", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByLabel("Lãi tối thiểu")).toHaveValue("50");
  await expect(page.getByLabel("Hệ số gợi ý giá")).toHaveValue("2.5");
  await page.getByLabel("Lãi tối thiểu").fill("60");
  await page.getByRole("button", { name: "Lưu cài đặt" }).click();
  await expect(page.getByRole("button", { name: "Đã lưu" })).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("bo-settings-v1")!).minMargin)).toBe(60);
});
