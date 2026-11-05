// App bắt đầu không có đơn hàng, sản phẩm trưng bày, sản phẩm hủy đơn — sản phẩm tạo từ nguyên liệu trong Kho (docs/pages/products.md)
import { expect, test } from "./support/harness.mjs";

test.use({ samples: false });

test.beforeEach(async ({ page, t }) => {
  void t;
  await page.goto("/");
});

test("Đơn hàng, sản phẩm trưng bày, sản phẩm hủy đơn đều trống, không còn nút Dữ liệu mẫu", async ({ page }) => {
  await page.goto("/orders");
  await expect(page.getByText("Chưa có đơn hàng nào.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo đơn hàng đầu tiên" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Dữ liệu mẫu" })).toHaveCount(0);

  await page.goto("/products");
  await expect(page.getByText("Chưa có sản phẩm nào.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Dữ liệu mẫu" })).toHaveCount(0);

  await page.goto("/cancelled-products");
  await expect(page.getByText(/Chưa có sản phẩm nào/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Dữ liệu mẫu" })).toHaveCount(0);

  // Kho vẫn giữ nguyên
  await page.goto("/inventory");
  await page.getByPlaceholder(/Tên hoặc mã nguyên liệu/).fill("Sáp đậu nành");
  await expect(page.getByRole("row").filter({ hasText: "Sáp đậu nành" })).toBeVisible();
});
