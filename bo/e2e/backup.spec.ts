// Cài đặt › Sao lưu dữ liệu: tải file sao lưu, khôi phục từ file, từ chối file sai (docs/pages/settings.md#sao-lưu-dữ-liệu)
import fs from "node:fs";
import { expect, test } from "./support/harness.mjs";

const stored = (page, key: string) => page.evaluate((k) => localStorage.getItem(k), key);
const section = (page) => page.locator(".ant-card, section, div").filter({ has: page.getByText("Sao lưu dữ liệu", { exact: true }) }).last();

test.beforeEach(async ({ page, t }) => {
  void t;
  await page.goto("/settings");
  await expect(page.getByText("Sao lưu dữ liệu", { exact: true })).toBeVisible();
});

test("Sao lưu: tải file gồm mọi dữ liệu bo-, không gồm phiên đăng nhập; ghi nhớ lần sao lưu", async ({ page }) => {
  await expect(page.getByText("Chưa sao lưu lần nào")).toBeVisible();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Sao lưu \(tải file\)/ }).click()]);
  expect(download.suggestedFilename()).toMatch(/^2510-bo-sao-luu-\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
  const file = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
  expect(file).toMatchObject({ app: "2510-bo", version: 1 });
  expect(Object.keys(file.data)).toContain("bo-orders-v4");
  expect(Object.keys(file.data).every((k) => k.startsWith("bo-"))).toBe(true);
  expect(Object.keys(file.data)).not.toContain("bo-backup-last");
  expect(JSON.stringify(file)).not.toContain("2510-admin-session");
  expect(file.data["bo-orders-v4"]).toBe(await stored(page, "bo-orders-v4"));
  await expect(page.getByText(/^Sao lưu gần nhất \d{2}:\d{2} \d{2}\/\d{2}\/\d{4}$/)).toBeVisible();
});

test("Khôi phục: xem tóm tắt, thay dữ liệu hiện tại bằng dữ liệu trong file rồi tải lại trang", async ({ page }) => {
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Sao lưu \(tải file\)/ }).click()]);
  const path = await download.path();
  const file = JSON.parse(fs.readFileSync(path, "utf8"));
  const orders = JSON.parse(file.data["bo-orders-v4"]).length;
  expect(orders).toBeGreaterThan(0);

  // Mất dữ liệu: xóa hết đơn, thêm một khóa rác
  await page.evaluate(() => {
    localStorage.setItem("bo-orders-v4", "[]");
    localStorage.setItem("bo-tam-thoi", '"x"');
  });
  await page.reload();
  await expect(page.getByText("Sao lưu dữ liệu", { exact: true })).toBeVisible();

  await section(page).locator('input[type="file"]').setInputFiles(path);
  const confirm = page.locator(".ant-modal-confirm");
  await expect(confirm).toContainText("Khôi phục từ file sao lưu?");
  await expect(confirm).toContainText(`${orders} đơn`);
  await confirm.getByRole("button", { name: "Khôi phục" }).click();
  await expect(page.getByText("Đã khôi phục")).toBeVisible();
  await page.waitForLoadState("load");
  await expect.poll(async () => JSON.parse((await stored(page, "bo-orders-v4")) ?? "[]").length).toBe(orders);
  expect(await stored(page, "bo-tam-thoi")).toBeNull();

  await page.goto("/orders");
  await expect(page.locator("main tr.ant-table-row").first()).toBeVisible();
});

test("Khôi phục: file không đúng thì báo lỗi, không đổi dữ liệu", async ({ page }, info) => {
  const before = await stored(page, "bo-orders-v4");
  const bad = info.outputPath("khong-phai-sao-luu.json");
  fs.writeFileSync(bad, JSON.stringify({ hello: "world" }));
  await section(page).locator('input[type="file"]').setInputFiles(bad);
  await expect(page.getByText("Không phải file sao lưu của 2510 Back Office.")).toBeVisible();
  await expect(page.locator(".ant-modal-confirm")).toHaveCount(0);
  expect(await stored(page, "bo-orders-v4")).toBe(before);

  const broken = info.outputPath("hong.json");
  fs.writeFileSync(broken, "{khong phai json");
  await section(page).locator('input[type="file"]').setInputFiles(broken);
  await expect(page.getByText("File không phải JSON.")).toBeVisible();
});
