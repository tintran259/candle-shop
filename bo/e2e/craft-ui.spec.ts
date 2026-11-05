// Thủ công: thống kê, sửa lựa chọn giữ quy tắc "chỉ dùng với", xem trước, thêm / bật / đổi chỗ / xóa bước, icon và tên tiếng Anh,
// bước Cá nhân hóa, bảng kích thước, Cấu hình mẫu, Xuất JSON (docs/pages/craft.md). Thay cho kịch bản cũ craft-builder-ui.
import fs from "node:fs";
import { expect, test } from "./support/harness.mjs";

const draft = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("bo-craft-builder-v5-draft") ?? "null"));
const step = async (page, id) => (await draft(page))?.steps.find((s) => s.id === id || s.title.vi === id);
const openStep = (page, title) => page.locator("main .step-row").filter({ hasText: title }).first().click();
const tab = (page, label) => page.locator("main .ant-tabs-tab").filter({ hasText: label }).first().click();
const settingInput = (page, label) => page.locator("main .ant-form-item").filter({ hasText: label }).locator("input").first();
const drawer = (page) => page.locator(".ant-drawer-open");

test.beforeEach(async ({ page, t }) => {
  void t;
  await page.goto("/craft");
  await expect(page.locator("main .step-row").first()).toBeVisible();
});

test("Thẻ thống kê đầu trang", async ({ page }) => {
  const card = (label) => page.locator("main .ant-card").filter({ hasText: label }).first();
  await expect(card("Bước đang hiện")).toContainText("7/7");
  await expect(card("Lựa chọn đang bán").locator(".ant-statistic-content")).toHaveText(/^\d+$/);
  await expect(card("Giá thấp nhất")).toContainText("₫");
});

test("Sửa lựa chọn giữ quy tắc chỉ dùng với; xem trước bước", async ({ page }) => {
  await openStep(page, "Bấc");
  await expect(page).toHaveURL(/step=wick/);
  await page.getByRole("button", { name: "Sửa Bấc gỗ" }).click();
  await expect(drawer(page).locator(".ant-form-item").filter({ hasText: "Chỉ dùng với" }).first()).toBeVisible();
  await drawer(page).locator("#price").fill("45000");
  // Sửa lựa chọn chỉ áp vào bản nháp, Lưu ở thanh lưu mới lên web
  await drawer(page).locator(".ant-drawer-footer").getByRole("button", { name: "Áp dụng" }).click();
  await expect(drawer(page)).toHaveCount(0);
  const wood = (await step(page, "wick")).options.find((o) => o.id === "wood");
  expect(wood.priceDelta).toBe(45_000);
  expect(Object.keys(wood.onlyWith ?? {})).not.toHaveLength(0);
  expect(wood.look).toBe("wood");
  await tab(page, "Xem trước");
  await expect(page.locator("main .sf-preview")).toBeVisible();
});

test("Thêm bước mới: ẩn mặc định, thêm lựa chọn kèm nguyên liệu mới, bật, đổi chỗ, xóa", async ({ page, t }) => {
  await page.getByRole("button", { name: "Thêm bước" }).click();
  await page.locator(".ant-modal .kind-card").filter({ hasText: "Thẻ lựa chọn" }).click();
  await page.locator(".ant-modal input#title").fill("Phụ kiện kèm");
  await page.locator(".ant-modal-footer").getByRole("button", { name: "Tạo bước" }).click();
  await expect(page).toHaveURL(/step=phu-kien-kem/);
  expect(await step(page, "phu-kien-kem")).toMatchObject({ kind: "cards", enabled: false });

  await page.getByRole("button", { name: "Thêm lựa chọn" }).first().click();
  await drawer(page).locator("#nameVi").fill("Que mồi lửa");
  await drawer(page).locator("#price").fill("15000");
  await drawer(page).locator("#newStock").fill("40");
  await drawer(page).locator(".ant-drawer-footer").getByRole("button", { name: "Thêm lựa chọn" }).click();
  await expect(drawer(page)).toHaveCount(0);
  const option = (await step(page, "phu-kien-kem")).options[0];
  expect(option).toMatchObject({ name: { vi: "Que mồi lửa" }, priceDelta: 15_000 });
  // Nguyên liệu mới chờ Lưu mới vào Kho
  await expect(page.locator("main")).toContainText("Chờ lưu");

  await tab(page, "Cài đặt");
  // Drawer lựa chọn vừa đóng có thể còn trong DOM lúc chạy hiệu ứng (cũng có công tắc "Hiện trên web") — chỉ lấy công tắc của bước
  await page.getByRole("tabpanel", { name: "Cài đặt" }).getByRole("switch", { name: "Hiện trên web" }).click();
  await t.moveStep("Phụ kiện kèm", -1);
  const ids = (await draft(page)).steps.map((s) => s.id);
  expect((await step(page, "phu-kien-kem")).enabled).toBe(true);
  expect(ids.indexOf("phu-kien-kem")).toBe(ids.length - 2);

  await page.locator("main").getByRole("button", { name: "Xóa bước" }).click();
  await page.locator(".ant-popconfirm").getByRole("button", { name: "Xóa bước" }).click();
  expect(await step(page, "phu-kien-kem")).toBeUndefined();
});

test("Đổi icon và tên tiếng Anh của bước", async ({ page }) => {
  await openStep(page, "Mùi hương");
  await tab(page, "Cài đặt");
  const before = (await step(page, "fragrance")) ?? { icon: "flower" };
  await page.getByLabel("Icon của bước").click();
  const options = page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option");
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    if ((await options.nth(i).getAttribute("aria-selected")) !== "true") {
      await options.nth(i).click();
      break;
    }
  }
  await settingInput(page, "Tên bước (English)").fill("Scents");
  const after = await step(page, "fragrance");
  expect(after.icon).not.toBe(before.icon);
  expect(after.title.en).toBe("Scents");
  // Thanh lưu báo có thay đổi
  await expect(page.getByRole("button", { name: "Lưu thay đổi" }).first()).toBeVisible();
});

test("Bước Cá nhân hóa: thêm ô nhập, thêm tuỳ chọn, ẩn ô", async ({ page }) => {
  await openStep(page, "Cá nhân hóa");
  const fields = page.getByRole("region", { name: "Ô nhập chữ" });
  const before = (await page.evaluate(() => JSON.parse(localStorage.getItem("bo-craft-builder-v5") ?? "null")))?.steps.find((s) => s.kind === "inputs")?.fields.length ?? 3;
  await fields.getByRole("button", { name: "Thêm ô nhập" }).click();
  expect((await step(page, "personalization")).fields).toHaveLength(before + 1);
  await page.getByRole("region", { name: "Tuỳ chọn thêm" }).getByRole("button", { name: "Thêm tuỳ chọn" }).click();
  const s = await step(page, "personalization");
  expect(s.addons.length).toBeGreaterThan(0);
  const first = s.fields[0];
  await fields.getByRole("switch", { name: `Hiện ô ${first.label.vi}` }).click();
  expect((await step(page, "personalization")).fields[0].enabled).toBe(!first.enabled);
});

test("Bước Hũ: mỗi hũ có cỡ và giá riêng, không còn tab Kích thước chung", async ({ page }) => {
  await openStep(page, "Hũ nến");
  await expect(page.locator("main .ant-tabs-tab").filter({ hasText: "Kích thước" })).toHaveCount(0);
  // Hũ gốm: giá hũ 500.000, 200ml +100.000, 250ml +250.000
  const row = page.getByRole("row").filter({ hasText: "Hũ gốm" });
  await expect(row).toContainText(/150ml\s*500\.000/);
  await expect(row).toContainText(/200ml\s*600\.000/);
  await expect(row).toContainText(/250ml\s*750\.000/);
});

test("Cấu hình mẫu đưa về bản nháp, phải Lưu mới có hiệu lực", async ({ page }) => {
  await page.getByRole("button", { name: "Thêm bước" }).click();
  await page.locator(".ant-modal input#title").fill("Bước tạm");
  await page.locator(".ant-modal-footer").getByRole("button", { name: "Tạo bước" }).click();
  expect((await draft(page)).steps).toHaveLength(8);
  await page.getByRole("button", { name: "Cấu hình mẫu" }).click();
  await page.locator(".ant-popconfirm").getByRole("button", { name: "Dùng mẫu" }).click();
  await expect.poll(async () => (await draft(page))?.steps.length ?? 7).toBe(7);
});

test("Xuất JSON tải file cấu hình đang sửa", async ({ page }) => {
  const [file] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Xuất JSON" }).click()]);
  expect(file.suggestedFilename()).toMatch(/^craft-config-\d{4}-\d{2}-\d{2}\.json$/);
  const json = JSON.parse(fs.readFileSync(await file.path(), "utf8"));
  expect(json.steps.map((s) => s.id)).toEqual(["container", "wax", "fragrance", "wick", "color", "decoration", "personalization"]);
});

test("Tìm kiếm nguyên liệu mở drawer ở Kho; điện thoại không tràn ngang", async ({ page, t }) => {
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox", { name: "Tìm kiếm" }).fill("sap ong");
  await page.getByRole("option").filter({ hasText: "Sáp ong" }).first().click();
  await expect(page).toHaveURL(/\/inventory\?material=wax-beeswax/);
  await expect(drawer(page).getByRole("region", { name: "Tồn kho hiện tại" })).toContainText("Sáp ong");
  await t.viewport(390, 844, true);
  await page.goto("/craft?step=fragrance");
  await expect(page.locator("main")).toContainText("Mùi hương");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
