// Trang Mã giảm giá: danh sách, lọc theo trạng thái, tìm, sắp xếp, tạo / sửa / tạm dừng / xóa (docs/pages/discounts.md)
import { expect, test } from "./support/harness.mjs";

const rows = (page) => page.locator("main tr.ant-table-row");
const codes = async (page) => (await rows(page).locator("td:first-child strong").allInnerTexts()).map((s) => s.trim());
const segment = (page, label) => page.locator("main .ant-segmented-item").filter({ hasText: label });
const drawer = (page) => page.locator(".ant-drawer-open");
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("bo-discounts-v1") ?? "null"));

test.beforeEach(async ({ page, t }) => {
  void t;
  await page.goto("/discounts");
  await expect(rows(page).first()).toBeVisible();
});

test("Tab trạng thái đếm đúng theo dữ liệu mẫu", async ({ page }) => {
  await expect(segment(page, "Tất cả")).toContainText("8");
  await expect(segment(page, "Đang chạy")).toContainText("4");
  await expect(segment(page, "Lên lịch")).toContainText("1");
  await expect(segment(page, "Hết lượt")).toContainText("1");
  await expect(segment(page, "Hết hạn")).toContainText("1");
  await expect(segment(page, "Tạm dừng")).toContainText("1");
  // Thẻ thống kê: Đang chạy kèm số mã sắp hết hạn (CANDLE2510 còn 5 ngày)
  await expect(page.locator("main .ant-card").filter({ hasText: "Đang chạy" }).first()).toContainText("1 mã sắp hết hạn");
});

test("Lọc theo trạng thái và tìm theo mã hoặc mô tả", async ({ page }) => {
  await segment(page, "Lên lịch").click();
  await expect.poll(() => codes(page)).toEqual(["TET2027"]);
  await segment(page, "Hết lượt").click();
  await expect.poll(() => codes(page)).toEqual(["FLASH100"]);
  await segment(page, "Tất cả").click();
  await page.getByPlaceholder("Tìm mã hoặc mô tả…").fill("flash");
  await expect.poll(() => codes(page)).toEqual(["FLASH100"]);
  // Tìm theo mô tả, không dấu
  await page.getByPlaceholder("Tìm mã hoặc mô tả…").fill("tu phoi");
  await expect.poll(() => codes(page)).toEqual(["TUPHOI50K"]);
});

test("Sắp xếp dùng nhiều nhất và sắp hết hạn", async ({ page }) => {
  await page.locator("main .ant-select").filter({ hasText: "Mới tạo nhất" }).click();
  await page.locator(".ant-select-item-option").filter({ hasText: "Dùng nhiều nhất" }).click();
  await expect.poll(async () => (await codes(page))[0]).toBe("SUMMER26");
  await page.locator("main .ant-select").filter({ hasText: "Dùng nhiều nhất" }).click();
  await page.locator(".ant-select-item-option").filter({ hasText: "Sắp hết hạn" }).click();
  // Ngày kết thúc gần nhất lên trước: SUMMER26 (đã qua) rồi FLASH100 (+2 ngày)
  await expect.poll(async () => (await codes(page)).slice(0, 2)).toEqual(["SUMMER26", "FLASH100"]);
});

test("Tạo mã: chuẩn hóa mã, chặn mã ngắn và mã trùng, tạo ngẫu nhiên", async ({ page }) => {
  await page.getByRole("button", { name: "Tạo mã" }).first().click();
  await expect(drawer(page).getByText("Tạo mã giảm giá")).toBeVisible();
  const code = drawer(page).locator("#code");

  await code.fill("abc");
  await drawer(page).getByRole("button", { name: "Tạo mã" }).click();
  await expect(drawer(page).getByText("Mã dài 4–20 ký tự.")).toBeVisible();

  await code.fill("candle2510");
  await expect(code).toHaveValue("CANDLE2510");
  await drawer(page).locator("#percent").fill("10");
  await drawer(page).getByRole("button", { name: "Tạo mã" }).click();
  await expect(drawer(page).getByText("Mã này đã tồn tại.")).toBeVisible();

  await drawer(page).getByRole("button", { name: "Tạo ngẫu nhiên" }).click();
  await expect(code).toHaveValue(/^2510[A-HJ-NP-Z2-9]{5}$/);

  // Gõ có dấu và khoảng trắng: mã tự viết hoa, bỏ dấu
  await code.fill("giảm hè");
  await expect(code).toHaveValue("GIAMHE");
  await drawer(page).getByRole("button", { name: "Tạo mã" }).click();
  await expect(page.getByText("Đã tạo mã GIAMHE")).toBeVisible();
  await expect(drawer(page)).toHaveCount(0);
  await expect(rows(page).filter({ hasText: "GIAMHE" })).toContainText("Đang chạy");
  const created = (await saved(page)).find((d) => d.code === "GIAMHE");
  expect(created).toMatchObject({ type: "percent", value: 10, used: 0, active: true });
});

test("Tạo mã giảm số tiền chỉ cho nến tự phối, có giới hạn lượt", async ({ page }) => {
  await page.getByRole("button", { name: "Tạo mã" }).first().click();
  await drawer(page).locator("#code").fill("TUPHOI30K");
  await drawer(page).locator(".ant-segmented-item").filter({ hasText: "Giảm số tiền" }).click();
  await drawer(page).locator("#amount").fill("30000");
  await drawer(page).locator(".ant-radio-button-wrapper").filter({ hasText: "Chỉ nến tự phối" }).click();
  await drawer(page).locator("#usageLimit").fill("50");
  await drawer(page).locator("#perCustomerLimit").fill("1");
  // Phiếu xem trước đi theo form
  await expect(drawer(page)).toContainText("chỉ nến tự phối");
  await drawer(page).getByRole("button", { name: "Tạo mã" }).click();
  await expect(drawer(page)).toHaveCount(0);
  const created = (await saved(page)).find((d) => d.code === "TUPHOI30K");
  expect(created).toMatchObject({ type: "fixed", value: 30_000, scope: "custom", usageLimit: 50, perCustomerLimit: 1 });
});

test("Tạm dừng và bật lại mã trên bảng", async ({ page }) => {
  const row = rows(page).filter({ hasText: "WELCOME10" });
  await row.getByRole("switch", { name: "Tạm dừng mã WELCOME10" }).click();
  await expect(row).toContainText("Tạm dừng");
  expect((await saved(page)).find((d) => d.code === "WELCOME10").active).toBe(false);
  await expect(segment(page, "Tạm dừng")).toContainText("2");
  await row.getByRole("switch", { name: "Bật mã WELCOME10" }).click();
  await expect(row).toContainText("Đang chạy");
});

test("Sửa mã qua đường dẫn, đóng khi chưa lưu thì hỏi lại, xóa mã", async ({ page }) => {
  await page.goto("/discounts?edit=flash100");
  await expect(drawer(page).getByText("Sửa mã FLASH100")).toBeVisible();
  await expect(drawer(page)).toContainText("Đã dùng 100 lượt");

  await drawer(page).locator("#description").fill("Đổi mô tả");
  await drawer(page).getByRole("button", { name: "Hủy" }).click();
  await expect(page.locator(".ant-modal-confirm-title")).toHaveText("Bỏ các thay đổi chưa lưu?");
  await page.getByRole("button", { name: "Tiếp tục sửa" }).click();
  await expect(drawer(page)).toBeVisible();

  await drawer(page).locator(".ant-drawer-footer").getByRole("button", { name: "Xóa" }).click();
  // Mã đã có lượt dùng: nhắc nên tạm dừng thay vì xóa
  await expect(page.getByText("nên tạm dừng thay vì xóa")).toBeVisible();
  await page.locator(".ant-popconfirm").getByRole("button", { name: "Xóa" }).click();
  await expect(page.getByText("Đã xóa mã FLASH100")).toBeVisible();
  await expect(page).not.toHaveURL(/edit=/);
  await expect(rows(page).filter({ hasText: "FLASH100" })).toHaveCount(0);
});

test("Lượt dùng: tạo đơn tăng lượt, hiện trong danh sách", async ({ page }) => {
  await expect(rows(page).filter({ hasText: "TUPHOI50K" })).toContainText("12");
  await expect(rows(page).filter({ hasText: "TET2027" })).toContainText("Bắt đầu sau");
});
