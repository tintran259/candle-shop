// Đơn hàng: thẻ thống kê, bộ lọc trên trang, đổi ngày làm xong, ghi chú nội bộ, sản phẩm đang ẩn khi tạo đơn (docs/pages/orders.md)
import dayjs from "dayjs";
import { expect, test } from "./support/harness.mjs";

const rows = (page) => page.locator("main tr.ant-table-row");
const drawer = (page) => page.locator(".ant-drawer-open");
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("bo-orders-v4") ?? "null"));
const pick = async (page, label, option) => {
  await page.locator("main").getByLabel(label, { exact: true }).click();
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: option }).first().click();
};

test.beforeEach(async ({ page, t }) => {
  void t;
  await page.goto("/orders");
  await expect(rows(page).first()).toBeVisible();
});

test("Thẻ thống kê", async ({ page }) => {
  for (const label of ["Chờ thanh toán", "Cần làm", "Chờ giao", "Giao lỗi", "Còn phải thu"]) await expect(page.locator("main .ant-statistic-title").filter({ hasText: label }).first()).toBeVisible();
});

test("Lọc thanh toán, tìm số điện thoại, sắp xếp tổng tiền", async ({ page }) => {
  await pick(page, "Lọc theo thanh toán", "Đã cọc");
  await expect(rows(page).first()).toBeVisible();
  for (const text of await rows(page).allInnerTexts()) expect(text).toMatch(/Đã cọc/);
  await page.getByRole("button", { name: "Xóa bộ lọc" }).click().catch(() => {});
  await page.goto("/orders");
  await page.getByLabel("Tìm đơn hàng").fill("654 321");
  await expect(rows(page)).not.toHaveCount(0);
  for (const text of await rows(page).allInnerTexts()) expect(text).toContain("Trần Bảo Ngọc");
  await page.getByLabel("Tìm đơn hàng").fill("");
  await pick(page, "Sắp xếp", "Giá trị cao nhất");
  const totals = await rows(page).evaluateAll((list) => list.map((r) => Number(r.querySelector("td:last-child")?.textContent?.replace(/\D/g, "") ?? 0)));
  expect(totals).toEqual([...totals].sort((a, b) => b - a));
});

test("Lọc theo khoảng ngày đặt", async ({ page }) => {
  const day = dayjs().format("DD/MM/YYYY");
  const picker = page.locator("main .ant-picker-range");
  await picker.click();
  await page.keyboard.type(day);
  await page.keyboard.press("Enter");
  await page.keyboard.type(day);
  await page.keyboard.press("Enter");
  // Chỉ còn đơn đặt hôm nay (đơn mẫu đầu tiên đặt hôm nay)
  await expect(rows(page)).not.toHaveCount(0);
  const all = await page.evaluate(() => JSON.parse(localStorage.getItem("bo-orders-v4") ?? "null"));
  if (all) expect(await rows(page).count()).toBe(all.filter((o) => o.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length);
});

test("Bảng hẹp: tab trạng thái dồn vào nút …", async ({ page, t }) => {
  await t.viewport(768, 1000);
  await page.goto("/orders");
  await expect(page.locator("main .ant-tabs-nav-more").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("Đổi ngày làm xong và ghi chú nội bộ trên chi tiết đơn", async ({ page }) => {
  // Đơn mẫu đầu tiên: Chờ thanh toán, còn đổi được ngày
  await rows(page).filter({ hasText: "Nguyễn Minh Anh" }).first().click();
  const d = drawer(page);
  await expect(d).toContainText("Nguyễn Minh Anh");
  const target = dayjs().add(6, "day");
  await d.getByLabel("Ngày làm xong").click();
  await d.getByLabel("Ngày làm xong").fill(target.format("DD/MM/YYYY"));
  await page.keyboard.press("Enter");
  await expect(page.getByText(`Đã đổi ngày làm xong sang ${target.format("DD/MM")}`)).toBeVisible();

  await d.getByLabel("Ghi chú nội bộ").fill("Đã gọi xác nhận, gói quà màu kem");
  await d.getByRole("button", { name: "Lưu ghi chú" }).click();
  await expect(page.getByText(/Đã lưu ghi chú/)).toBeVisible();

  const order = (await saved(page)).find((o) => o.customer.name === "Nguyễn Minh Anh");
  expect(order.readyDate).toBe(target.format("YYYY-MM-DD"));
  expect(order.internalNote ?? order.adminNote ?? order.staffNote).toBe("Đã gọi xác nhận, gói quà màu kem");
});

test("Đơn đã làm xong không đổi được ngày làm xong", async ({ page }) => {
  // Đơn này nằm ở trang sau: tìm theo tên trước
  await page.getByLabel("Tìm đơn hàng").fill("Ngo Thanh Vy");
  await rows(page).filter({ hasText: "Ngô Thanh Vy" }).first().click();
  await expect(drawer(page)).toContainText("Ngô Thanh Vy");
  await expect(drawer(page).getByLabel("Ngày làm xong")).toHaveCount(0);
});

test("Tạo đơn: sản phẩm đang ẩn vẫn chọn được, có nhãn Đang ẩn", async ({ page }) => {
  await page.goto("/orders?order=new");
  const d = drawer(page);
  await expect(d).toContainText("Tạo đơn");
  await d.getByRole("button", { name: "Nến có sẵn" }).click();
  const select = d.getByLabel(/Sản phẩm dòng 1|Chọn sản phẩm/).first();
  await select.click();
  await page.keyboard.type("Lavender");
  await expect(page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: "Lavender Dream" })).toContainText("Đang ẩn");
});
