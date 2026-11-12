// Trang Concept (dịp lễ) và gắn concept vào sản phẩm (docs/pages/concepts.md) — chế độ lưu trên trình duyệt
import { expect, test } from "./support/harness.mjs";

const rows = (page) => page.locator("main tr.ant-table-row");
const modal = (page) => page.locator(".ant-modal-wrap:not([style*='none']) .ant-modal");
const drawer = (page) => page.locator(".ant-drawer-open");
const stored = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), key);

test("Concept: có mẫu Noel, Tết; thêm mới, chặn tên trùng, ẩn trên web", async ({ page, t }) => {
  void t;
  await page.goto("/concepts");
  await expect(page.getByRole("heading", { name: "Concept" })).toBeVisible();
  await expect(rows(page)).toHaveCount(2);
  await expect(rows(page).nth(0)).toContainText("Noel");
  await expect(rows(page).nth(1)).toContainText("Tết");

  await page.getByRole("button", { name: "Thêm concept" }).click();
  await modal(page).locator("input#vi").fill("noel");
  await modal(page).locator(".ant-modal-footer").getByRole("button", { name: "Thêm concept" }).click();
  await expect(modal(page).getByText("Đã có concept tên này.")).toBeVisible();
  await modal(page).locator("input#vi").fill("Valentine");
  await modal(page).locator(".ant-modal-footer").getByRole("button", { name: "Thêm concept" }).click();
  await expect(modal(page)).toBeHidden();
  await expect(rows(page)).toHaveCount(3);

  await page.getByRole("switch", { name: "Hiện trên web: Valentine" }).click();
  await expect.poll(async () => (await stored(page, "bo-concepts-v1"))?.find((c) => c.id === "valentine")).toMatchObject({ name: { vi: "Valentine", en: "Valentine" }, hidden: true });
});

test("Gắn concept vào sản phẩm (nhiều), lọc theo concept; xóa concept thì sản phẩm chỉ rời khỏi concept", async ({ page, t }) => {
  void t;
  // Sửa sản phẩm: chọn Noel + Tết
  await page.goto("/products?edit=moon-morning");
  const d = drawer(page);
  await expect(d.getByText("Sửa sản phẩm")).toBeVisible();
  const select = d.getByLabel("Concept");
  for (const name of ["Noel", "Tết"]) {
    await select.click();
    await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: name }).click();
  }
  await page.keyboard.press("Escape");
  await d.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByText("Đã lưu Moon Morning")).toBeVisible();
  expect((await stored(page, "bo-products-v2")).find((p) => p.id === "moon-morning").conceptIds).toEqual(["noel", "tet"]);
  await expect(rows(page).filter({ hasText: "Moon Morning" })).toContainText("Noel");

  // Trang Concept: đếm sản phẩm, liên kết sang trang Sản phẩm đã lọc
  await page.goto("/concepts");
  const noel = rows(page).filter({ hasText: "Noel" });
  await expect(noel).toContainText("1 sản phẩm");
  await noel.getByRole("link", { name: "1 sản phẩm" }).click();
  await expect(page).toHaveURL(/\/products\?concept=noel/);
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText("Moon Morning");

  // Xóa Noel (đang có sản phẩm): báo số sản phẩm sẽ rời khỏi, sản phẩm còn lại Tết
  await page.goto("/concepts");
  await rows(page).filter({ hasText: "Noel" }).getByRole("button", { name: "Xóa Noel" }).click();
  await expect(page.locator(".ant-popconfirm")).toContainText("1 sản phẩm sẽ rời khỏi concept này");
  await page.locator(".ant-popconfirm").getByRole("button", { name: "Xóa" }).click();
  await expect(rows(page)).toHaveCount(1);
  expect((await stored(page, "bo-products-v2")).find((p) => p.id === "moon-morning").conceptIds).toEqual(["tet"]);
});

test("Thời gian bán: đặt ngày đã qua → Đã kết thúc, sản phẩm chỉ thuộc concept đó báo Ngoài mùa; bỏ ngày → Mọi ngày", async ({ page, t }) => {
  void t;
  // Gắn Noel cho Moon Morning qua drawer sản phẩm
  await page.goto("/products?edit=moon-morning");
  const d = drawer(page);
  await expect(d.getByText("Sửa sản phẩm")).toBeVisible();
  await d.getByLabel("Concept").click();
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: "Noel" }).click();
  await page.keyboard.press("Escape");
  await d.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByText("Đã lưu Moon Morning")).toBeVisible();
  await page.goto("/concepts");
  const noel = rows(page).filter({ hasText: "Noel" });
  await expect(noel).toContainText("Mọi ngày");

  await noel.getByRole("button", { name: "Sửa Noel" }).click();
  const range = modal(page).locator(".ant-picker-range input");
  await range.nth(0).click();
  await range.nth(0).fill("01/12/2020");
  await range.nth(0).press("Enter");
  await range.nth(1).fill("26/12/2020");
  await range.nth(1).press("Enter");
  await modal(page).locator(".ant-modal-footer").getByRole("button", { name: "Lưu" }).click();
  await expect(modal(page)).toBeHidden();
  await expect(noel).toContainText("Đã kết thúc");
  await expect(noel).toContainText("01/12 – 26/12/2020");
  expect((await stored(page, "bo-concepts-v1")).find((c) => c.id === "noel")).toMatchObject({ startsOn: "2020-12-01", endsOn: "2020-12-26" });

  await page.goto("/products");
  await expect(rows(page).filter({ hasText: "Moon Morning" })).toContainText("Ngoài mùa · web đang ẩn");

  // Bỏ ngày: mọi ngày, hết cảnh báo
  await page.goto("/concepts");
  await rows(page).filter({ hasText: "Noel" }).getByRole("button", { name: "Sửa Noel" }).click();
  await modal(page).locator(".ant-picker-range").hover();
  await modal(page).locator(".ant-picker-clear").click();
  await modal(page).locator(".ant-modal-footer").getByRole("button", { name: "Lưu" }).click();
  await expect(rows(page).filter({ hasText: "Noel" })).toContainText("Mọi ngày");
  expect((await stored(page, "bo-concepts-v1")).find((c) => c.id === "noel")).toMatchObject({ startsOn: null, endsOn: null });
  await page.goto("/products");
  await expect(rows(page).filter({ hasText: "Moon Morning" })).not.toContainText("Ngoài mùa");
});
