// Cài đặt › Xóa toàn bộ dữ liệu: hộp thoại bắt gõ câu xác nhận, gợi ý sao lưu trước, xóa hết dữ liệu BO, giữ đăng nhập
import { expect, test } from "./support/harness.mjs";

// Không nạp dữ liệu mẫu mỗi lần tải trang — để thấy dữ liệu đã bị xóa sau khi tải lại
test.use({ samples: false });

const boKeys = (page) => page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("bo-") && k !== "bo-backup-last"));

test("Xóa toàn bộ dữ liệu: gõ đúng XÓA HẾT mới xóa được, sao lưu trước, giữ phiên đăng nhập", async ({ page, t }) => {
  void t;
  await page.goto("/settings");
  await page.evaluate(() => {
    localStorage.setItem(
      "bo-customers-v1",
      JSON.stringify([{ id: "cus-1", name: "Khách cũ", phone: "0901000111", email: "", hasAccount: false, newsletter: false, tags: [], blocked: false, createdAt: new Date().toISOString() }]),
    );
    localStorage.setItem("bo-settings-v1", JSON.stringify({ depositPercent: 33 }));
  });
  await page.reload();

  await page.getByRole("button", { name: "Xóa toàn bộ dữ liệu…" }).click();
  const modal = page.locator(".ant-modal").last();
  await expect(modal).toContainText("Không thể hoàn tác");
  const ok = modal.getByRole("button", { name: "Xóa toàn bộ" });
  await expect(ok).toBeDisabled();

  // Sao lưu ngay trong hộp thoại
  const [download] = await Promise.all([page.waitForEvent("download"), modal.getByRole("button", { name: "Sao lưu trước" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^2510-bo-sao-luu-.*\.json$/);
  await expect(modal).toContainText("Đã tải file sao lưu.");

  // Gõ sai vẫn khóa nút; Hủy thì không đổi gì
  await page.getByLabel("Gõ XÓA HẾT để xác nhận").fill("xoa het");
  await expect(ok).toBeDisabled();
  await modal.getByRole("button", { name: "Hủy" }).click();
  await expect(modal).toBeHidden();
  expect(await boKeys(page)).toEqual(expect.arrayContaining(["bo-customers-v1", "bo-settings-v1"]));

  // Gõ đúng (không phân biệt hoa thường) → xóa, về Dashboard, vẫn đăng nhập
  await page.getByRole("button", { name: "Xóa toàn bộ dữ liệu…" }).click();
  await page.getByLabel("Gõ XÓA HẾT để xác nhận").fill(" xóa hết ");
  await expect(ok).toBeEnabled();
  await ok.click();
  await expect(page.getByText("Đã xóa toàn bộ dữ liệu.")).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".app-sider")).toBeVisible();
  expect(await page.evaluate(() => !!localStorage.getItem("2510-admin-session"))).toBe(true);
  expect(await boKeys(page)).not.toContain("bo-customers-v1");
  expect(await boKeys(page)).not.toContain("bo-settings-v1");
  // Thủ công: giữ các bước, không còn lựa chọn nào
  const craft = await page.evaluate(() => JSON.parse(localStorage.getItem("bo-craft-builder-v5")!));
  expect(craft.steps.length).toBeGreaterThan(3);
  for (const s of craft.steps) expect(s.kind === "inputs" ? s.addons : s.options).toEqual([]);
  // Trang Thủ công mở bình thường với các bước trống
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/craft");
  for (const s of craft.steps.slice(0, 3)) await expect(page.getByText(s.title.vi).first()).toBeVisible();
  expect(errors).toEqual([]);
});
