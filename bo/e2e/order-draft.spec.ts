// Đơn nháp: form Tạo đơn hàng tự lưu, đóng ra làm việc khác rồi mở lại làm tiếp (docs/pages/orders.md#đơn-nháp)
import { expect, test } from "./support/harness.mjs";

const drawer = (page) => page.locator(".ant-drawer-open").last();
const draft = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("bo-order-draft-v1") ?? "null"));

// Chọn lại nếu cú bấm đầu bị trượt khi máy tải nặng — chờ tới khi tóm tắt đơn có sản phẩm
const pickProduct = async (page, d, name: string) => {
  await d.getByRole("button", { name: "Nến có sẵn" }).click();
  await expect(async () => {
    await d.getByLabel("Chọn sản phẩm").last().click();
    // Lần trước trượt thì ô tìm còn chữ cũ — xóa trước khi gõ lại
    await page.keyboard.press("Control+A");
    await page.keyboard.press("Backspace");
    await page.keyboard.type(name);
    await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: name }).first().click();
    await expect(d.locator("aside.order-summary")).toContainText(name, { timeout: 2000 });
  }).toPass({ timeout: 15_000 });
};

// Nhập dở: khách, SĐT, 1 Moon Morning, ghi chú
const startDraft = async (page) => {
  await page.goto("/orders");
  await page.getByRole("button", { name: "Tạo đơn hàng" }).click();
  const d = drawer(page);
  await d.locator("#name").fill("Khách Nháp");
  await d.locator("#phone").fill("0901 234 567");
  await pickProduct(page, d, "Moon Morning");
  await d.locator("#note").fill("Gói quà giúp em");
  await expect.poll(async () => (await draft(page))?.values?.lines?.length).toBe(1);
  return d;
};

test.beforeEach(async ({ page, t }) => {
  void t;
  await page.goto("/");
});

test("Đóng giữ nháp, nút thành Tiếp tục đơn nháp; tải lại trang mở lại đủ thông tin, giá sản phẩm lấy lại giá hiện tại", async ({ page }) => {
  const d = await startDraft(page);
  // Lưu nháp: đóng ngay, không hỏi
  await d.getByRole("button", { name: "Lưu nháp" }).click();
  await expect(page.locator(".ant-drawer-open")).toHaveCount(0);
  await expect(page.getByText("Đã lưu nháp đơn")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tiếp tục đơn nháp" })).toBeVisible();

  // Trong lúc đó giá Moon Morning đổi
  await page.evaluate(() => {
    const list = JSON.parse(localStorage.getItem("bo-products-v2")!);
    localStorage.setItem("bo-products-v2", JSON.stringify(list.map((p) => (p.id === "moon-morning" ? { ...p, price: 777_000, salePrice: undefined } : p))));
  });
  await page.reload();
  await page.getByRole("button", { name: "Tiếp tục đơn nháp" }).click();
  const again = drawer(page);
  await expect(again.getByText(/Đang tiếp tục đơn nháp lưu lúc/)).toBeVisible();
  await expect(again.locator("#name")).toHaveValue("Khách Nháp");
  await expect(again.locator("#phone")).toHaveValue("0901 234 567");
  await expect(again.locator("#note")).toHaveValue("Gói quà giúp em");
  await expect(again.locator("aside.order-summary")).toContainText("777.000");
});

test("Bắt đầu đơn mới xóa nháp; Bỏ đơn hỏi rồi xóa nháp", async ({ page }) => {
  const first = await startDraft(page);
  await first.getByRole("button", { name: "Lưu nháp" }).click();
  await page.getByRole("button", { name: "Tiếp tục đơn nháp" }).click();
  const d = drawer(page);
  await d.getByRole("button", { name: "Bắt đầu đơn mới" }).click();
  await expect(d.locator("#name")).toHaveValue("");
  await expect(d.locator("#note")).toHaveValue("");
  await expect(d.getByText(/Đang tiếp tục đơn nháp/)).toHaveCount(0);
  expect(await draft(page)).toBeNull();

  // Nhập lại rồi Bỏ đơn
  await d.locator("#name").fill("Khách Hai");
  await expect.poll(async () => (await draft(page))?.values?.name).toBe("Khách Hai");
  await d.getByRole("button", { name: "Bỏ đơn" }).click();
  await page.locator(".ant-modal-confirm").getByRole("button", { name: "Bỏ đơn" }).click();
  await expect(page.locator(".ant-drawer-open")).toHaveCount(0);
  expect(await draft(page)).toBeNull();
  await expect(page.getByRole("button", { name: "Tạo đơn hàng" })).toBeVisible();
});

test("Tạo đơn từ nháp thì xóa nháp", async ({ page }) => {
  const d = await startDraft(page);
  await d.locator("#address").fill("12 Lý Thường Kiệt, Hà Nội");
  await d.locator(".ant-drawer-footer").getByRole("button", { name: /^Tạo đơn/ }).click();
  await expect(page.getByText(/Đã tạo đơn SC/)).toBeVisible();
  expect(await draft(page)).toBeNull();
  await page.goto("/orders");
  await expect(page.getByRole("button", { name: "Tạo đơn hàng" })).toBeVisible();
});

test("Mở từ hồ sơ khách khi đang có nháp: điền khách đó, báo có nháp, mở lại được nháp", async ({ page }) => {
  const first = await startDraft(page);
  await first.getByRole("button", { name: "Lưu nháp" }).click();
  // Mở từ hồ sơ khách Ngô Thanh Vy như nút "Tạo đơn cho khách này"
  // Mã hồ sơ mẫu = cus- + 6 số cuối SĐT 0944 889 900
  await page.goto("/customers?customer=cus-889900");
  await drawer(page).getByRole("button", { name: "Tạo đơn cho khách này" }).click();
  const d = drawer(page);
  await expect(d.locator("#name")).toHaveValue("Ngô Thanh Vy");
  await expect(d.getByText("Đang có đơn nháp của Khách Nháp")).toBeVisible();
  await d.getByRole("button", { name: "Mở đơn nháp" }).click();
  await expect(d.locator("#name")).toHaveValue("Khách Nháp");
  await expect(d.locator("#note")).toHaveValue("Gói quà giúp em");
  await expect(d.getByText(/Đang tiếp tục đơn nháp/)).toBeVisible();
});
