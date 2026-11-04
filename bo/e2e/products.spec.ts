// Trang Sản phẩm trưng bày: thống kê, lọc, sắp xếp, kiểu xem, công tắc, thao tác hàng loạt, drawer thêm / sửa / xóa (docs/pages/products.md)
import { expect, test } from "./support/harness.mjs";

// Ảnh PNG 1×1 để thử tải ảnh
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

const rows = (page) => page.locator("main tr.ant-table-row");
// Tên sản phẩm là chữ đậm đầu tiên của dòng
const rowNames = (page) => rows(page).evaluateAll((list) => list.map((r) => r.querySelector("td strong")?.textContent?.trim()));
const stat = (page, label) => page.locator("main .ant-card").filter({ hasText: label }).first().locator(".ant-statistic-content");
const drawer = (page) => page.locator(".ant-drawer-open");
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("bo-products-v1") ?? "null"));
// antd Select: bấm vào ô; có search thì gõ để lọc (danh sách ảo chỉ dựng các mục đang hiện) rồi chọn
// Danh sách lọc lại sau khi gõ có lúc làm cú bấm trượt khỏi option — thử lại tới khi ô hiện đúng lựa chọn
const pickOption = async (page, select, text, search = false) => {
  const field = select.locator("xpath=ancestor::*[contains(concat(' ', normalize-space(@class), ' '), ' ant-select ')][1]");
  await expect(async () => {
    if (!(await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden)").count())) await select.click();
    if (search) {
      await select.fill("");
      await page.keyboard.type(text);
    }
    await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: text }).first().click({ timeout: 2000 });
    await expect(field).toContainText(text, { timeout: 1000 });
  }).toPass({ timeout: 10_000 });
};

test.beforeEach(async ({ page, t }) => {
  void t;
  await page.goto("/products");
  await expect(rows(page).first()).toBeVisible();
});

test("Thẻ thống kê và tab trạng thái", async ({ page }) => {
  await expect(stat(page, "Sản phẩm")).toHaveText("8");
  await expect(stat(page, "Đang bán")).toHaveText("7");
  await expect(stat(page, "Đang giảm giá")).toHaveText("3");
  await expect(stat(page, "Nổi bật")).toHaveText("3");
  await page.locator("main .ant-segmented-item").filter({ hasText: "Tạm ẩn" }).click();
  await expect.poll(() => rowNames(page)).toEqual(["Lavender Dream"]);
});

test("Tìm, lọc kích thước, lọc danh mục, xóa bộ lọc", async ({ page }) => {
  await page.getByPlaceholder("Tìm theo tên hoặc slug…").fill("moon");
  await expect.poll(async () => (await rowNames(page)).sort()).toEqual(["Moon Morning", "Moonlight Aurora"]);
  await page.getByPlaceholder("Tìm theo tên hoặc slug…").fill("");
  await pickOption(page, page.getByLabel("Lọc theo kích thước").locator(".."), "Lớn");
  await expect.poll(async () => (await rowNames(page)).sort()).toEqual(["Beach Sunshine", "Moonlight Aurora"]);
  await pickOption(page, page.getByLabel("Lọc theo danh mục").locator(".."), "Nước hoa");
  await expect.poll(() => rowNames(page)).toEqual(["Moonlight Aurora"]);
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click();
  await expect(rows(page)).toHaveCount(8);
  // Không khớp gì: trạng thái rỗng có nút xóa bộ lọc
  await page.getByPlaceholder("Tìm theo tên hoặc slug…").fill("khong co nen nay");
  await expect(page.getByText("Không có sản phẩm khớp bộ lọc.")).toBeVisible();
});

test("Sắp xếp theo giá và bán chạy", async ({ page }) => {
  await pickOption(page, page.getByLabel("Sắp xếp").locator(".."), "Giá tăng dần");
  await expect.poll(async () => (await rowNames(page))[0]).toBe("Vanilla Relax");
  await pickOption(page, page.getByLabel("Sắp xếp").locator(".."), "Bán chạy");
  await expect.poll(async () => (await rowNames(page))[0]).toBe("Moon Morning");
});

test("Đổi bảng / lưới; điện thoại mặc định lưới", async ({ page, t }) => {
  await page.locator("main .ant-segmented-item").filter({ has: page.locator("[title='Xem dạng lưới']") }).click();
  await expect(rows(page)).toHaveCount(0);
  await expect(page.locator("main").getByRole("button", { name: "Sửa Brown Relac" })).toBeVisible();
  await t.viewport(390, 844, true);
  await page.goto("/products");
  await expect(page.locator("main").getByRole("button", { name: "Sửa Brown Relac" })).toBeVisible();
  await expect(rows(page)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("Công tắc trên bảng: nổi bật, đang bán", async ({ page }) => {
  await page.getByRole("button", { name: "Đặt nổi bật: Beach Sunshine" }).click();
  await expect(stat(page, "Nổi bật")).toHaveText("4");
  await page.getByRole("switch", { name: "Đang bán: Lavender Dream" }).click();
  await expect(stat(page, "Đang bán")).toHaveText("8");
  const list = await saved(page);
  expect(list.find((p) => p.id === "beach-sunshine").isFeatured).toBe(true);
  expect(list.find((p) => p.id === "lavender-dream").status).toBe("active");
});

test("Thao tác hàng loạt: ẩn, hiện, xóa", async ({ page }) => {
  const check = (name) => rows(page).filter({ hasText: name }).locator(".ant-checkbox-input");
  await check("Brown Relac").check();
  await check("Citrus Bloom").check();
  const bar = page.getByRole("region", { name: "Thao tác hàng loạt" });
  await expect(bar).toContainText("Đã chọn 2 sản phẩm");
  await bar.getByRole("button", { name: "Ẩn" }).click();
  await expect(stat(page, "Đang bán")).toHaveText("5");
  await bar.getByRole("button", { name: "Hiện" }).click();
  await expect(stat(page, "Đang bán")).toHaveText("7");
  await bar.getByRole("button", { name: "Xóa" }).click();
  await page.locator(".ant-popconfirm").getByRole("button", { name: "Xóa" }).click();
  await expect(stat(page, "Sản phẩm")).toHaveText("6");
  await expect(bar).toHaveCount(0);
  expect((await saved(page)).map((p) => p.id)).not.toContain("brown-relac");
});

test("Thêm sản phẩm: slug theo tên, kiểm tra giá, danh mục, công thức, ảnh", async ({ page }) => {
  await page.getByRole("button", { name: "Thêm sản phẩm" }).click();
  const d = drawer(page);
  await expect(d.getByText("Thêm sản phẩm").first()).toBeVisible();

  // Bỏ trống: báo từng ô
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Thêm sản phẩm" }).click();
  await expect(d.getByText("Nhập tên sản phẩm.")).toBeVisible();
  await expect(d.getByText("Thêm ít nhất một nguyên liệu.")).toBeVisible();
  await expect(d.getByText("Thêm ít nhất một ảnh.")).toBeVisible();

  await d.locator("#name").fill("Nến Hoa Nhài");
  await expect(d.locator("#slug")).toHaveValue("nen-hoa-nhai");
  // Tự sửa slug thì đổi tên không ghi đè slug nữa
  await d.locator("#slug").fill("hoa-nhai");
  await d.locator("#name").fill("Nến Hoa Nhài Trắng");
  await expect(d.locator("#slug")).toHaveValue("hoa-nhai");

  // Danh mục chọn sẵn danh mục đầu tiên đang hiện
  await expect(d.locator(".ant-form-item").filter({ hasText: "Danh mục" }).first()).toContainText("Thiên nhiên");

  await d.locator("#price").fill("500000");
  await d.locator("#salePrice").fill("600000");
  await d.locator("#salePrice").blur();
  await expect(d.getByText("Giá giảm phải thấp hơn giá bán.")).toBeVisible();
  await d.locator("#salePrice").fill("400000");
  await expect(d.getByText("Giảm 20% so với giá bán")).toBeVisible();

  // Công thức: không cho trùng nguyên liệu
  await d.getByRole("button", { name: "Thêm nguyên liệu" }).click();
  await d.getByRole("button", { name: "Thêm nguyên liệu" }).click();
  await pickOption(page, d.getByLabel("Nguyên liệu dòng 1"), "Sáp đậu nành", true);
  await d.getByLabel("Lượng dòng 1").fill("150");
  await pickOption(page, d.getByLabel("Nguyên liệu dòng 2"), "Sáp đậu nành", true);
  await d.getByLabel("Lượng dòng 2").fill("10");
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Thêm sản phẩm" }).click();
  await expect(d.getByText("Nguyên liệu này đã có trong công thức.").first()).toBeVisible();
  await d.getByRole("button", { name: "Xóa dòng 2" }).click();

  await d.locator("input[type=file]").setInputFiles({ name: "nen.png", mimeType: "image/png", buffer: PNG });
  await expect(d.getByRole("button", { name: "Ảnh 1 đang là ảnh chính" })).toBeVisible();

  // Xem trước đi theo form
  await expect(d.getByRole("region", { name: "Xem trước" })).toContainText("Nến Hoa Nhài Trắng");

  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Thêm sản phẩm" }).click();
  await expect(page.getByText("Đã thêm Nến Hoa Nhài Trắng")).toBeVisible();
  const created = (await saved(page)).find((p) => p.slug === "hoa-nhai");
  expect(created).toMatchObject({ id: "hoa-nhai", price: 500_000, salePrice: 400_000, categoryId: "nature", recipe: [{ materialId: "wax-soy", quantity: 150 }], status: "active", isNew: true });
  await expect(stat(page, "Sản phẩm")).toHaveText("9");
});

test("Slug trùng sản phẩm khác bị chặn", async ({ page }) => {
  await page.goto("/products?edit=new");
  const d = drawer(page);
  await d.locator("#name").fill("Moon Morning");
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Thêm sản phẩm" }).click();
  // Thiếu ảnh và công thức báo trước; slug trùng báo khi các ô khác hợp lệ
  await d.getByRole("button", { name: "Thêm nguyên liệu" }).click();
  await pickOption(page, d.getByLabel("Nguyên liệu dòng 1"), "Sáp dừa", true);
  await d.getByLabel("Lượng dòng 1").fill("100");
  await d.locator("#price").fill("300000");
  await d.locator("input[type=file]").setInputFiles({ name: "nen.png", mimeType: "image/png", buffer: PNG });
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Thêm sản phẩm" }).click();
  await expect(d.getByText("Slug đã được dùng cho sản phẩm khác.")).toBeVisible();
});

test("Sản phẩm cũ chưa có công thức: có nhãn, sửa không bắt buộc công thức", async ({ page }) => {
  await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem("bo-products-v1") ?? "null");
    if (list) localStorage.setItem("bo-products-v1", JSON.stringify(list.map((p) => (p.id === "citrus-bloom" ? { ...p, recipe: undefined } : p))));
  });
  // Lần đầu chưa có bản lưu: tạo bản lưu bằng một thay đổi rồi bỏ công thức
  if (!(await saved(page))) {
    await page.getByRole("switch", { name: "Đang bán: Lavender Dream" }).click();
    await page.evaluate(() => {
      const list = JSON.parse(localStorage.getItem("bo-products-v1"));
      localStorage.setItem("bo-products-v1", JSON.stringify(list.map((p) => (p.id === "citrus-bloom" ? { ...p, recipe: undefined } : p))));
    });
  }
  await page.reload();
  await expect(rows(page).filter({ hasText: "Citrus Bloom" })).toContainText("Chưa có công thức");
  await rows(page).filter({ hasText: "Citrus Bloom" }).getByRole("button", { name: "Sửa Citrus Bloom" }).click();
  await drawer(page).locator("#description").fill("Thêm mô tả");
  await drawer(page).getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByText("Đã lưu Citrus Bloom")).toBeVisible();
});

test("Sửa: đổi ảnh chính, xóa sản phẩm trong drawer", async ({ page }) => {
  await page.goto("/products?edit=moon-morning");
  const d = drawer(page);
  await expect(d.getByText("Sửa sản phẩm")).toBeVisible();
  await d.locator("input[type=file]").setInputFiles({ name: "anh-2.png", mimeType: "image/png", buffer: PNG });
  await d.getByRole("button", { name: "Đặt ảnh 2 làm ảnh chính" }).click();
  await expect(d.getByRole("button", { name: "Ảnh 1 đang là ảnh chính" })).toBeVisible();
  await d.getByRole("button", { name: "Lưu thay đổi" }).click();
  const moon = (await saved(page)).find((p) => p.id === "moon-morning");
  expect(moon.images).toHaveLength(2);
  expect(moon.images[0]).toMatch(/^data:image/);

  await page.goto("/products?edit=moon-morning");
  await drawer(page).locator(".ant-drawer-footer").getByRole("button", { name: "Xóa" }).click();
  await page.locator(".ant-popconfirm").getByRole("button", { name: "Xóa" }).click();
  await expect(page.getByText("Đã xóa Moon Morning")).toBeVisible();
  await expect(rows(page).filter({ hasText: "Moon Morning" })).toHaveCount(0);
});
