// Luồng vận chuyển: giao cho vận chuyển kèm mã vận đơn, sửa mã, in phiếu đơn và nhãn giao hàng, xuất Excel (docs/pages/orders.md#vận-chuyển)
import fs from "node:fs";
import { expect, test } from "./support/harness.mjs";
import { readXlsx } from "./support/xlsx";

const now = new Date().toISOString();
const make = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  code: `SC-${id.toUpperCase()}`,
  status: "ready",
  customer: { name: `Khách ${id}`, email: "", phone: "0901 111 222" },
  shippingAddress: "12 Lý Thường Kiệt, Hà Nội",
  shippingMethod: "standard",
  shippingName: "Tiêu chuẩn (3 ngày)",
  shippingDays: 3,
  depositPercent: 50,
  items: [{ id: `i-${id}`, productId: "moon-morning", name: "Moon Morning", price: 400_000, quantity: 2 }],
  subtotal: 800_000,
  discount: 0,
  shippingFee: 0,
  total: 800_000,
  paymentPlan: "deposit",
  paymentMethod: "cod",
  payments: [{ id: `p-${id}`, provider: "cod", amount: 400_000, status: "success", createdAt: now }],
  readyDate: "2026-12-30",
  note: "Gói quà giúp em",
  history: [{ at: now, status: "pending", by: "x" }],
  createdAt: now,
  updatedAt: now,
  ...over,
});

const drawer = (page) => page.locator(".ant-drawer-open").last();
const modal = (page) => page.locator(".ant-modal-wrap:not([style*='none']) .ant-modal").last();
const saved = (page, id: string) => page.evaluate((id) => JSON.parse(localStorage.getItem("bo-orders-v4")!).find((o) => o.id === id), id);

test.beforeEach(async ({ page, t }) => {
  void t;
  // Thay hộp thoại in bằng bản ghi nội dung trang in để kiểm tra
  await page.addInitScript(() => {
    (window as unknown as { __printed: string[] }).__printed = [];
    window.print = () => {
      const root = document.querySelector(".print-root");
      (window as unknown as { __printed: string[] }).__printed.push(`${root?.className}|${root?.querySelectorAll(".print-page").length}|${root?.textContent}`);
      window.dispatchEvent(new Event("afterprint"));
    };
  });
  await page.goto("/");
  await page.evaluate((list) => localStorage.setItem("bo-orders-v4", JSON.stringify(list)), [make("a"), make("b", { status: "shipping", shipment: { carrierId: "ghn", carrier: "Giao Hàng Nhanh", trackingCode: "GHNTAKEN1", at: now } })]);
});

const printed = (page) => page.evaluate(() => (window as unknown as { __printed: string[] }).__printed);

test("Giao cho vận chuyển: báo thu hộ, bắt buộc mã, chặn mã trùng, lưu mã và link tra cứu", async ({ page }) => {
  await page.goto("/orders?order=a");
  await drawer(page).getByRole("button", { name: "Giao cho vận chuyển" }).click();
  const m = modal(page);
  await expect(m).toContainText("Thu hộ (COD) 400.000");
  await m.getByRole("button", { name: "Giao cho vận chuyển" }).click();
  await expect(m).toContainText("Nhập mã vận đơn.");
  await m.getByLabel("Mã vận đơn").fill("ghn taken1");
  await m.getByRole("button", { name: "Giao cho vận chuyển" }).click();
  await expect(m).toContainText("Mã này đã dùng cho đơn SC-B.");
  await m.getByLabel("Mã vận đơn").fill("ghn 8xk2p");
  // Miễn phí giao cho khách nhưng shop trả bên vận chuyển 25.000
  await m.getByLabel("Phí trả đơn vị vận chuyển").fill("25000");
  await m.getByRole("button", { name: "Giao cho vận chuyển" }).click();
  await expect(m).toBeHidden();

  const o = await saved(page, "a");
  expect(o.status).toBe("shipping");
  expect(o.shipment).toMatchObject({ carrierId: "ghn", carrier: "Giao Hàng Nhanh", trackingCode: "GHN8XK2P", trackingUrl: "https://donhang.ghn.vn/?order_code=GHN8XK2P" });
  expect(o.history.at(-1).note.replace(/\s/g, " ")).toBe("Giao Hàng Nhanh · mã vận đơn GHN8XK2P · phí vận chuyển 25.000 ₫");
  expect(o.shippingCost).toBe(25_000);
  const d = drawer(page);
  await expect(d.getByText("GHN8XK2P", { exact: true })).toBeVisible();
  await expect(d.getByRole("link", { name: /Tra cứu/ })).toHaveAttribute("href", "https://donhang.ghn.vn/?order_code=GHN8XK2P");
  // Lãi gộp trừ phí shop trả: 800.000 tiền hàng − nguyên liệu − 25.000
  const profit = d.getByRole("group", { name: "Giá vốn và lãi gộp" });
  await expect(profit).toContainText("Phí trả đơn vị vận chuyển · khách trả 0 ₫25.000 ₫");

  // Danh sách hiện mã dưới trạng thái, tìm được theo mã vận đơn
  await page.goto("/orders");
  await page.getByLabel("Tìm đơn hàng").fill("8xk2p");
  await expect(page.locator("main tr.ant-table-row")).toHaveCount(1);
  await expect(page.locator("main tr.ant-table-row")).toContainText("Giao Hàng Nhanh · GHN8XK2P");
});

test("Sửa mã vận đơn khi đang giao; Shop tự giao không bắt buộc mã", async ({ page }) => {
  await page.goto("/orders?order=b");
  const d = drawer(page);
  await d.getByRole("button", { name: "Sửa vận chuyển" }).click();
  const m = modal(page);
  await expect(m).toContainText("Sửa vận chuyển đơn SC-B");
  await m.getByLabel("Đơn vị vận chuyển", { exact: true }).click();
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: "Shop tự giao" }).click();
  await m.getByLabel("Mã vận đơn").fill("");
  await m.getByRole("button", { name: "Lưu" }).click();
  await expect(m).toBeHidden();
  const o = await saved(page, "b");
  expect(o.shipment).toMatchObject({ carrierId: "self", carrier: "Shop tự giao" });
  expect(o.shipment.trackingCode).toBeUndefined();
  expect(o.history.at(-1).note.replace(/\s/g, " ")).toBe("Đổi vận chuyển: Giao Hàng Nhanh · mã vận đơn GHNTAKEN1 → Shop tự giao · phí vận chuyển 0 ₫");
  await expect(d.getByText("Không có", { exact: true })).toBeVisible();
});

test("Khách không nhận, hàng hoàn về: Gửi lại đơn chọn lại đơn vị vận chuyển, nhập mã mới", async ({ page }) => {
  await page.evaluate(
    (o) => localStorage.setItem("bo-orders-v4", JSON.stringify([...JSON.parse(localStorage.getItem("bo-orders-v4")!), o])),
    make("c", { status: "returned", returnCondition: "good", deliveryAttempts: 3, shippingCost: 30_000, shipment: { carrierId: "ghn", carrier: "Giao Hàng Nhanh", trackingCode: "GHNOLD1", cost: 30_000, at: now } }),
  );
  await page.goto("/orders?order=c");
  await drawer(page).getByRole("button", { name: "Gửi lại đơn" }).click();
  const m = modal(page);
  // Thu hộ = còn lại 400.000 + phí gửi lại 30.000 (Cài đặt)
  await expect(m).toContainText("Thu hộ (COD) 430.000");
  await expect(m).toContainText("Lần giao trước: Giao Hàng Nhanh · mã vận đơn GHNOLD1");
  // Mặc định là đơn vị lần trước
  await expect(m.locator(".ant-select").first()).toContainText("Giao Hàng Nhanh");
  await m.getByLabel("Mã vận đơn").fill("ghnold1");
  await m.getByRole("button", { name: "Gửi lại đơn" }).click();
  await expect(m).toContainText("Đây là mã của lượt giao trước — nhập mã mới.");

  // Đổi sang đơn vị khác
  await m.getByLabel("Đơn vị vận chuyển", { exact: true }).click();
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: "Giao Hàng Tiết Kiệm" }).click();
  await m.getByLabel("Mã vận đơn").fill("S1234.GHTK");
  await m.getByRole("button", { name: "Gửi lại đơn" }).click();
  await expect(m).toBeHidden();

  const o = await saved(page, "c");
  expect(o.status).toBe("shipping");
  expect(o.total).toBe(830_000);
  expect(o.deliveryAttempts).toBe(0);
  expect(o.shipment).toMatchObject({ carrierId: "ghtk", carrier: "Giao Hàng Tiết Kiệm", trackingCode: "S1234.GHTK", trackingUrl: "https://i.ghtk.vn/S1234.GHTK" });
  // Lịch sử giữ mã lượt trước
  expect(o.history.at(-1).note.replace(/\s/g, " ")).toBe("Gửi lại đơn · khách trả thêm 30.000 ₫ · Giao Hàng Tiết Kiệm · mã vận đơn S1234.GHTK · phí vận chuyển 30.000 ₫");
  // Lượt trước đã trả 30.000 + lượt gửi lại 30.000 (mặc định bằng phí gửi lại)
  expect(o.shippingCost).toBe(60_000);
  await expect(drawer(page).getByText("S1234.GHTK", { exact: true })).toBeVisible();
});

test("In nhãn giao hàng và phiếu đơn từ chi tiết đơn; thiếu thông tin người gửi thì nhắc", async ({ page }) => {
  await page.goto("/orders?order=b");
  const d = drawer(page);
  await d.getByRole("button", { name: /^(printer )?In$/ }).click();
  await page.getByRole("menuitem", { name: "In nhãn giao hàng" }).click();
  await expect(page.getByText("Nhãn chưa có SĐT hoặc địa chỉ người gửi")).toBeVisible();
  await expect.poll(async () => (await printed(page)).length).toBe(1);
  const [label] = await printed(page);
  expect(label).toContain("print-kind-label|1|");
  for (const s of ["Giao Hàng Nhanh", "GHNTAKEN1", "SC-B", "Khách b", "0901 111 222", "12 Lý Thường Kiệt", "2 sản phẩm: 2× Moon Morning", "Thu hộ (COD)400.000"]) expect(label).toContain(s);
  // In xong thì gỡ trang in
  await expect(page.locator(".print-root")).toHaveCount(0);

  await d.getByRole("button", { name: /^(printer )?In$/ }).click();
  await page.getByRole("menuitem", { name: "In phiếu đơn" }).click();
  await expect.poll(async () => (await printed(page)).length).toBe(2);
  const invoice = (await printed(page))[1];
  for (const s of ["print-kind-invoice|1|", "PHIẾU ĐƠN HÀNG", "Moon Morning", "800.000", "Đã thanh toán400.000", "Còn phải thu400.000", "Gói quà giúp em"]) expect(invoice).toContain(s);
});

test("Chọn nhiều đơn để in nhãn hàng loạt; người gửi lấy từ Cài đặt", async ({ page }) => {
  await page.goto("/settings");
  await page.getByLabel("Số điện thoại người gửi").fill("0988 777 666");
  await page.getByLabel("Địa chỉ lấy hàng").fill("25 Hàng Bạc, Hoàn Kiếm");
  await page.getByRole("button", { name: "Lưu cài đặt" }).click();
  await expect(page.getByRole("button", { name: "Đã lưu" })).toBeVisible();

  await page.goto("/orders");
  await page.getByLabel("Chọn đơn SC-A").check();
  await page.getByLabel("Chọn đơn SC-B").check();
  // Bấm ô chọn không mở đơn
  await expect(page.locator(".ant-drawer-open")).toHaveCount(0);
  const bar = page.getByRole("region", { name: "Đơn đã chọn" });
  await expect(bar).toContainText("Đã chọn 2 đơn");
  await bar.getByRole("button", { name: "In 2 đơn" }).click();
  await page.getByRole("menuitem", { name: "In nhãn giao hàng" }).click();
  await expect.poll(async () => (await printed(page)).length).toBe(1);
  const [labels] = await printed(page);
  expect(labels).toContain("print-kind-label|2|");
  for (const s of ["SC-A", "SC-B", "0988 777 666", "25 Hàng Bạc, Hoàn Kiếm"]) expect(labels).toContain(s);
  await expect(page.getByText("Nhãn chưa có SĐT")).toHaveCount(0);
  await bar.getByRole("button", { name: "Bỏ chọn" }).click();
  await expect(bar).toBeHidden();
});

test("Xuất Excel danh sách đơn đang lọc", async ({ page }) => {
  await page.goto("/orders");
  await page.getByRole("tab", { name: /Đang giao/ }).click();
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Xuất Excel" }).click()]);
  expect(download.suggestedFilename()).toMatch(/^don-hang-\d{4}-\d{2}-\d{2}\.xlsx$/);
  const [sheet] = readXlsx(fs.readFileSync(await download.path()));
  expect(sheet.rows).toHaveLength(2);
  const row = Object.fromEntries(sheet.rows[0].map((h, i) => [h, sheet.rows[1][i]]));
  expect(row["Mã đơn"]).toBe("SC-B");
  expect(row["Mã vận đơn"]).toBe("GHNTAKEN1");
  expect(row["Còn phải thu"]).toBe("400000");
});

test("Cài đặt: thêm đơn vị vận chuyển, link tra cứu phải có {code}", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: "Thêm đơn vị" }).click();
  const row = page.getByRole("group", { name: "Đơn vị 6" });
  await row.getByLabel("Tên đơn vị").fill("Ahamove");
  await row.getByLabel("Link tra cứu").fill("https://ahamove.com/track");
  await page.getByRole("button", { name: "Lưu cài đặt" }).click();
  await expect(row).toContainText("Link bắt đầu bằng http và có {code}.");
  await row.getByLabel("Link tra cứu").fill("https://ahamove.com/track/{code}");
  await page.getByRole("button", { name: "Lưu cài đặt" }).click();
  await expect(page.getByRole("button", { name: "Đã lưu" })).toBeVisible();

  await page.goto("/orders?order=a");
  await drawer(page).getByRole("button", { name: "Giao cho vận chuyển" }).click();
  const m = modal(page);
  await m.getByLabel("Đơn vị vận chuyển", { exact: true }).click();
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: "Ahamove" }).click();
  await m.getByLabel("Mã vận đơn").fill("AHA1");
  await m.getByRole("button", { name: "Giao cho vận chuyển" }).click();
  await expect(m).toBeHidden();
  expect((await saved(page, "a")).shipment.trackingUrl).toBe("https://ahamove.com/track/AHA1");
});

test("Chọn đơn vị vận chuyển lúc tạo đơn; lúc giao không chọn lại, phí trả đơn vị cao hơn phí khách trả thì báo shop chịu thêm", async ({ page }) => {
  await page.goto("/orders");
  await page.getByRole("button", { name: /Tạo đơn hàng|Tiếp tục đơn nháp/ }).click();
  const d = drawer(page);
  await d.locator("#name").fill("Khách Ship");
  await d.locator("#phone").fill("0912 345 678");
  await d.locator("#address").fill("5 Lê Lợi, Huế");
  await d.getByRole("button", { name: "Nến có sẵn" }).click();
  await d.getByLabel("Chọn sản phẩm").last().click();
  await page.keyboard.type("Moon Morning");
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: "Moon Morning" }).first().click();
  await expect(d.locator("aside.order-summary")).toContainText("Moon Morning");
  await d.getByLabel("Phí vận chuyển", { exact: true }).fill("30000");
  await d.getByLabel("Đơn vị vận chuyển", { exact: true }).click();
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: "Giao Hàng Tiết Kiệm" }).click();
  await d.locator(".ant-drawer-footer").getByRole("button", { name: /^Tạo đơn/ }).click();
  await expect(page.getByText(/Đã tạo đơn SC/)).toBeVisible();
  const created = await page.evaluate(() => JSON.parse(localStorage.getItem("bo-orders-v4")!).find((o) => o.customer.name === "Khách Ship"));
  expect(created.carrier).toEqual({ id: "ghtk", name: "Giao Hàng Tiết Kiệm" });
  expect(created.shippingFee).toBe(30_000);

  // Đưa đơn tới Chờ giao rồi giao: đơn vị chọn sẵn GHTK, phí mặc định 30.000 = phí khách trả
  await page.evaluate((id) => {
    const list = JSON.parse(localStorage.getItem("bo-orders-v4")!);
    localStorage.setItem("bo-orders-v4", JSON.stringify(list.map((o) => (o.id === id ? { ...o, status: "ready" } : o))));
  }, created.id);
  await page.goto(`/orders?order=${created.id}`);
  await expect(drawer(page)).toContainText("Giao Hàng Tiết Kiệm");
  await drawer(page).getByRole("button", { name: "Giao cho vận chuyển" }).click();
  const m = modal(page);
  // Đã chọn đơn vị lúc tạo đơn: chỉ hiện tên, không có ô chọn lại
  await expect(m.getByTestId("ship-carrier")).toHaveText("Giao Hàng Tiết Kiệm");
  await expect(m.getByLabel("Đơn vị vận chuyển", { exact: true })).toHaveCount(0);
  await expect(m).toContainText("Đã chọn lúc tạo đơn — muốn đổi thì Sửa đơn.");
  await expect(m.getByLabel("Phí trả đơn vị vận chuyển")).toHaveValue(/30[.,]000/);
  await expect(m.getByRole("status")).toHaveCount(0);
  await m.getByLabel("Phí trả đơn vị vận chuyển").fill("35000");
  await expect(m.getByRole("status")).toContainText("Shop chịu thêm 5.000");
  await m.getByLabel("Mã vận đơn").fill("S999.GHTK");
  await m.getByRole("button", { name: "Giao cho vận chuyển" }).click();
  await expect(m).toBeHidden();
  const shipped = await saved(page, created.id);
  expect(shipped.shipment).toMatchObject({ carrierId: "ghtk", cost: 35_000 });
  expect(shipped.shippingCost).toBe(35_000);
  await expect(drawer(page).getByRole("group", { name: "Giá vốn và lãi gộp" })).toContainText("khách trả 30.000");
});
