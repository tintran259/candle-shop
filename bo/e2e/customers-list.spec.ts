// Trang Khách hàng: thống kê, nhóm khách, tìm, lọc, sắp xếp, xuất CSV, nhãn (docs/pages/customers.md)
import fs from "node:fs";
import { expect, test } from "./support/harness.mjs";

const rows = (page) => page.locator("main tr.ant-table-row");
const segment = (page, label) => page.getByRole("radiogroup", { name: "Nhóm khách" }).locator(".ant-segmented-item").filter({ hasText: label });
const pick = async (page, label, option) => {
  await page.locator('main').getByLabel(label, { exact: true }).click();
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: option }).first().click();
};

test.beforeEach(async ({ page, t }) => {
  void t;
  await page.goto("/customers");
  await expect(rows(page).first()).toBeVisible();
});

test("Thẻ thống kê và số đếm theo nhóm khớp danh sách", async ({ page }) => {
  for (const label of ["Khách hàng", "Tỷ lệ quay lại", "Chi tiêu", "Lâu chưa mua"]) await expect(page.locator("main .ant-statistic-title").filter({ hasText: label })).toBeVisible();
  const total = await rows(page).count();
  // Mỗi tab ghi "Tên · số"; bấm tab thì số dòng đúng bằng số đếm (trang đầu tối đa 10)
  for (const label of ["VIP", "Khách quen", "Khách mới"]) {
    const tab = segment(page, label);
    const n = Number((await tab.innerText()).split("·").pop().trim());
    await tab.click();
    if (n === 0) await expect(page.getByText(/Không có khách/)).toBeVisible();
    else await expect(rows(page)).toHaveCount(Math.min(n, 10));
  }
  await segment(page, "Tất cả").click();
  await expect(rows(page)).toHaveCount(total);
});

test("Tìm theo tên không dấu và theo số điện thoại", async ({ page }) => {
  const search = page.getByLabel("Tìm khách hàng");
  await search.fill("wing");
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("Wing Sun");
  await search.fill("nguyen minh");
  await expect(rows(page).first()).toContainText("Nguyễn Minh Anh");
  await search.fill("0987 654");
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("Trần Bảo Ngọc");
});

test("Sắp xếp chi nhiều nhất, lọc khách vãng lai", async ({ page }) => {
  await pick(page, "Sắp xếp", "Chi nhiều nhất");
  const spent = await rows(page).evaluateAll((list) => list.map((r) => r.innerText));
  expect(spent.length).toBeGreaterThan(1);
  await pick(page, "Loại tài khoản", "Vãng lai");
  await expect(rows(page).first()).toBeVisible();
  await expect(rows(page).filter({ hasText: "Có tài khoản" })).toHaveCount(0);
});

test("Xuất CSV đúng danh sách đang lọc, Excel đọc được tiếng Việt", async ({ page }) => {
  await page.getByLabel("Tìm khách hàng").fill("wing");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Xuất CSV" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^khach-hang-\d{4}-\d{2}-\d{2}\.csv$/);
  const csv = fs.readFileSync(await download.path(), "utf8");
  // BOM để Excel đọc đúng dấu
  expect(csv.charCodeAt(0)).toBe(0xfeff);
  const lines = csv.slice(1).split("\r\n");
  expect(lines[0]).toBe('"Tên","Số điện thoại","Email","Nhóm","Số đơn","Đã chi (VNĐ)","Đơn gần nhất","Tài khoản","Nhận ưu đãi","Nhãn","Ghi chú"');
  expect(lines).toHaveLength(2);
  expect(lines[1]).toContain('"Wing Sun"');
});

test("Thêm nhãn trên hồ sơ rồi lọc theo nhãn", async ({ page }) => {
  await rows(page).filter({ hasText: "Wing Sun" }).first().click();
  const d = page.locator(".ant-drawer-open");
  await expect(d.getByRole("region", { name: "Tổng quan" })).toContainText("Wing Sun");
  const tags = d.getByLabel("Nhãn khách hàng");
  await tags.click();
  await page.keyboard.type("Nhãn thử E2E");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await d.getByRole("button", { name: "Lưu", exact: true }).click();
  await expect(page.getByText(/Đã lưu/)).toBeVisible();
  await d.locator(".ant-drawer-close").first().click();
  await expect(d).toHaveCount(0);
  await pick(page, "Nhãn", "Nhãn thử E2E");
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("Wing Sun");
});

test("Hồ sơ hiện hay mua và nút liên hệ", async ({ page }) => {
  await rows(page).filter({ hasText: "Wing Sun" }).first().click();
  const d = page.locator(".ant-drawer-open");
  // Wing Sun có 2 đơn mẫu, Woman Secret ×2 và Moonlight Aurora ×2, Moon Morning ×2
  await expect(d).toContainText("Hay mua");
  await expect(d).toContainText("Woman Secret");
  await expect(d.getByRole("button", { name: "Sao chép số điện thoại" })).toBeVisible();
  await expect(d.getByRole("button", { name: "Tạo đơn cho khách này" })).toBeVisible();
});

test("Điện thoại: không tràn ngang", async ({ page, t }) => {
  await t.viewport(390, 844, true);
  await page.goto("/customers");
  await expect(page.locator("main")).toContainText("Khách hàng");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
