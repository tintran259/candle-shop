// Công suất xưởng (Cài đặt, tạo đơn, đổi ngày làm xong, Dashboard) và giá vốn (Kho, sản phẩm, chi tiết đơn, Dashboard)
import { expect, test } from "./support/harness.mjs";

const now = new Date().toISOString();
const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const ddmm = (n: number) => day(n).split("-").reverse().join("/");
const order = (id: string, readyIn: number, quantity: number, status = "paid") => ({
  id,
  code: "T" + id.toUpperCase(),
  status,
  customer: { name: "Khách " + id, email: "", phone: "09000005" + String(quantity).padStart(2, "0") },
  shippingAddress: "1 A",
  shippingMethod: "standard",
  shippingName: "Tiêu chuẩn (3 ngày)",
  shippingDays: 3,
  depositPercent: 50,
  items: [{ id: "i1", productId: "vanilla-relax", name: "Vanilla Relax", price: 500_000, quantity }],
  subtotal: 500_000 * quantity,
  discount: 0,
  shippingFee: 0,
  total: 500_000 * quantity,
  paymentPlan: "full",
  paymentMethod: "cod",
  payments: [{ id: "p" + id, provider: "cod", amount: 500_000 * quantity, status: "success", createdAt: now }],
  readyDate: day(readyIn),
  history: [{ at: now, status, by: "x" }],
  createdAt: now,
  updatedAt: now,
});
const stored = (page, key: string) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), key);
const drawer = (page) => page.locator(".ant-drawer-open").last();

test.beforeEach(async ({ page, t }) => {
  void t;
  await page.goto("/");
  await page.evaluate(
    ([orders]) => {
      localStorage.setItem("bo-orders-v3", JSON.stringify(orders));
      localStorage.setItem(
        "bo-settings-v1",
        JSON.stringify({ depositPercent: 50, maxDeliveryAttempts: 3, resendFee: 30000, shippingOptions: [{ id: "standard", name: "Tiêu chuẩn", fee: 0, days: 3, enabled: true }], dailyCapacity: 3, leadDays: 3 }),
      );
    },
    [[order("a", 3, 2), order("full", 5, 3), order("busy", 1, 4, "producing")]],
  );
});

test("Cài đặt › Xưởng: lưu số cây mỗi ngày và số ngày làm tối thiểu", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByLabel("Số cây làm được mỗi ngày")).toHaveValue("3");
  await page.getByLabel("Số cây làm được mỗi ngày").fill("12");
  await page.getByLabel("Số ngày làm tối thiểu").fill("2");
  await page.getByRole("button", { name: "Lưu cài đặt" }).click();
  await expect.poll(async () => (await stored(page, "bo-settings-v1"))?.dailyCapacity).toBe(12);
  expect((await stored(page, "bo-settings-v1")).leadDays).toBe(2);
});

test("Tạo đơn: ngày làm xong gợi ý từ số ngày tối thiểu, vượt công suất thì báo và gợi ý ngày còn chỗ", async ({ page, t }) => {
  await page.goto("/orders?order=new");
  const d = drawer(page);
  await expect(d.getByLabel("Ngày xưởng làm xong")).toHaveValue(ddmm(3));
  await expect(d).toContainText(`Ngày ${ddmm(3).slice(0, 5)}: xưởng đã nhận 2/3 cây`);
  await d.getByRole("button", { name: "Nến có sẵn" }).click();
  await d.getByLabel("Chọn sản phẩm").click();
  await page.keyboard.type("Moon Morning");
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: "Moon Morning" }).first().click();
  await d.getByLabel("Số lượng").fill("2");
  await expect(d).toContainText(`Ngày ${ddmm(3).slice(0, 5)} vượt công suất`);
  await expect(d).toContainText("thêm đơn này 2 cây sẽ vượt 1 cây");
  await t.shot("capacity-warning");
  // Ngày +4 còn trống
  await d.getByRole("button", { name: `Dùng ngày ${ddmm(4).slice(0, 5)} còn chỗ` }).click();
  await expect(d.getByLabel("Ngày xưởng làm xong")).toHaveValue(ddmm(4));
  await expect(d).not.toContainText("vượt công suất");
});

test("Đổi ngày làm xong sang ngày đã đầy: vẫn đổi, báo vượt công suất", async ({ page }) => {
  await page.goto("/orders?order=a");
  const picker = page.locator(".ant-drawer-open").getByLabel("Ngày làm xong");
  // Gõ ngày rồi Enter (cách nhanh nhất bằng bàn phím)
  await picker.click();
  await picker.fill(ddmm(5));
  await page.keyboard.press("Enter");
  await expect(page.getByText(`Đã đổi sang ${ddmm(5).slice(0, 5)} — ngày này vượt công suất: 5/3 cây`)).toBeVisible();
  expect((await stored(page, "bo-orders-v3")).find((o) => o.id === "a").readyDate).toBe(day(5));
  // Ngày còn chỗ thì báo thành công bình thường
  await picker.click();
  await picker.fill(ddmm(6));
  await page.keyboard.press("Enter");
  await expect(page.getByText(`Đã đổi ngày làm xong sang ${ddmm(6).slice(0, 5)}`)).toBeVisible();
});

test("Giá vốn: chi tiết đơn ước tính rồi chốt khi Bắt đầu làm", async ({ page }) => {
  await page.goto("/orders?order=a");
  const costs = page.getByRole("group", { name: "Giá vốn và lãi gộp" });
  // Vanilla Relax: hũ thủy tinh 150ml 18.000 + sáp đậu nành 130g × 90 + vanilla 10ml × 1.800 + bấc 1.500 = 49.200 / cây
  await expect(costs).toContainText("ước tính");
  await expect(costs).toContainText("98.400");
  await expect(costs).toContainText("901.600");
  await page.getByRole("button", { name: "Bắt đầu làm" }).click();
  await expect(costs).toContainText("đã chốt");
  expect((await stored(page, "bo-orders-v3")).find((o) => o.id === "a").materialCost).toBe(98_400);
});

test("Giá vốn: form sản phẩm và nhập kho có giá tính lại bình quân", async ({ page }) => {
  await page.goto("/products?edit=vanilla-relax");
  await expect(page.getByLabel("Giá vốn 1 cây")).toContainText("49.200");
  await expect(page.getByLabel("Giá vốn 1 cây")).toContainText("lãi 90% trên giá bán");

  await page.goto("/inventory?material=wax-soy");
  const card = page.getByRole("region", { name: "Tồn kho hiện tại" });
  await expect(card).toContainText("Giá nhập bình quân 90");
  // Nhập 1.000 g, trả 120.000 ₫ cho cả lô → 120 ₫/g
  await card.getByLabel("Số lượng").fill("1000");
  await card.getByLabel("Tổng tiền lô").fill("120000");
  await expect(card.getByRole("status")).toContainText("giá lô 120");
  await card.getByRole("button", { name: "Ghi nhận" }).click();
  // (9.000 g × 90 + 1.000 g × 120) ÷ 10.000 g = 93
  await expect(card).toContainText("Giá nhập bình quân 93");
  const inv = await stored(page, "bo-inventory-v2");
  expect(inv.materials.find((m) => m.id === "wax-soy").unitCost).toBe(93);
  expect(inv.movements[0]).toMatchObject({ materialId: "wax-soy", change: 1000, totalCost: 120_000, unitCost: 120 });
  // Lịch sử phiếu ghi tiền lô
  await expect(page.locator(".ant-drawer-open")).toContainText("Tiền lô 120.000");
  await page.goto("/inventory");
  await expect(page.locator("main .ant-card").filter({ hasText: "Nguyên liệu" }).first()).toContainText("Giá trị tồn");
});

test("Dashboard: thẻ Lãi gộp và lịch xưởng 7 ngày tới báo ngày vượt công suất", async ({ page, t }) => {
  await page.goto("/");
  const profit = page.locator("main .ant-card").filter({ hasText: "Lãi gộp" }).first();
  await expect(profit).toContainText("Tỉ lệ lãi");
  const schedule = page.locator("main .ant-card").filter({ hasText: "Lịch xưởng" });
  await expect(schedule.getByRole("listitem")).toHaveCount(7);
  await expect(schedule).toContainText("1 ngày vượt công suất 3 cây/ngày");
  await expect(schedule.getByRole("listitem").nth(1)).toContainText("4/3 cây");
  await t.shot("dashboard-profit-schedule", true);
});

test("Sửa giá theo lần mua: 5 kg giá 300.000 ₫ tự ra 60 ₫/g", async ({ page }) => {
  await page.goto("/inventory?material=wax-soy");
  const card = page.getByRole("region", { name: "Tồn kho hiện tại" });
  await card.getByRole("button", { name: "Sửa giá" }).click();
  const d = card.getByRole("group", { name: "Sửa giá nhập" });
  // Giá đang có hiện theo 1 kg: 90 ₫/g = 90.000 ₫/kg
  await expect(d.getByLabel("Lượng mua")).toHaveValue("1");
  await expect(d).toContainText("kg");
  await expect(d.getByLabel("Giá mua")).toHaveValue(/90\.000/);
  await d.getByLabel("Lượng mua").fill("5");
  await d.getByLabel("Giá mua").fill("300000");
  await expect(d).toContainText("= 60");
  await d.getByLabel("Giá mua").fill("299000");
  await expect(d).toContainText("= 59,8");
  await d.getByRole("button", { name: "Lưu giá" }).click();
  await expect.poll(async () => (await stored(page, "bo-inventory-v2"))?.materials.find((m) => m.id === "wax-soy").unitCost).toBe(59.8);

  // Mua theo gam: 500 g giá 45.000 ₫ → 90 ₫/g
  await card.getByRole("button", { name: "Sửa giá" }).click();
  await d.getByLabel("Đơn vị mua").click();
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: /^g$/ }).click();
  await d.getByLabel("Lượng mua").fill("500");
  await d.getByLabel("Giá mua").fill("45000");
  await expect(d).toContainText("= 90");
  await d.getByRole("button", { name: "Lưu giá" }).click();
  await expect.poll(async () => (await stored(page, "bo-inventory-v2"))?.materials.find((m) => m.id === "wax-soy").unitCost).toBe(90);
});

test("Phiếu kho: tổng tiền lô tự chia ra giá mỗi ml", async ({ page }) => {
  await page.goto("/inventory");
  await page.getByRole("button", { name: "Phiếu kho" }).click();
  const m = page.locator(".ant-modal-wrap:not([style*='none']) .ant-modal");
  await m.locator("#materialId").click();
  await page.keyboard.type("Lavender");
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: "Tinh dầu Lavender" }).first().click();
  await m.locator("#amount").fill("100");
  await m.getByLabel("Tổng tiền lô").fill("250000");
  await expect(m).toContainText("= 2.500");
  await m.locator(".ant-modal-footer .ant-btn-primary").click();
  const inv = await stored(page, "bo-inventory-v2");
  expect(inv.movements[0]).toMatchObject({ materialId: "oil-lavender", change: 100, totalCost: 250_000, unitCost: 2500 });
  // Tồn 450 ml × 2.200 + 100 ml × 2.500, chia 550 ml = 2.254,55
  expect(inv.materials.find((x) => x.id === "oil-lavender").unitCost).toBe(2254.55);
});
