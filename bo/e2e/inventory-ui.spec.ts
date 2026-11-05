// Kho nguyên liệu trên trang: lọc từ đường dẫn, sắp xếp, phiếu kho gần đây, dùng trên web, hũ theo từng cỡ, không theo dõi tồn
// (docs/pages/inventory.md). Thay cho 2 kịch bản cũ inventory-ui / inventory-sizes viết trước khi đổi cấu trúc lưu.
import { expect, test } from "./support/harness.mjs";

const rows = (page) => page.locator("main tr.ant-table-row");
const names = (page) => rows(page).evaluateAll((list) => list.map((r) => r.querySelector("td strong, td .ant-typography")?.textContent?.trim()));
const drawer = (page) => page.locator(".ant-drawer-open");

test.beforeEach(async ({ t }) => {
  void t;
});

test("Lọc Hết hàng và Chưa dùng trên web từ đường dẫn", async ({ page }) => {
  await page.goto("/inventory?status=out");
  await expect(rows(page)).toHaveCount(5);
  await expect(page.locator("main .ant-segmented-item-selected")).toContainText("Hết hàng");
  for (const name of ["Tinh dầu Rose", "Hũ gốm trụ 200ml", "Màu nhuộm hồng pastel"]) await expect(rows(page).filter({ hasText: name })).toHaveCount(1);

  await page.goto("/inventory?status=unused");
  await expect(rows(page).filter({ hasText: "Thiệp in sẵn" })).toHaveCount(1);
  await expect(rows(page).filter({ hasText: "Sáp pha trộn" })).toHaveCount(1);
  // Đổi tab thì đường dẫn đổi theo
  await page.locator("main .ant-segmented-item").filter({ hasText: "Sắp hết" }).click();
  await expect(page).toHaveURL(/status=low/);
});

test("Sắp xếp Tên A–Z", async ({ page }) => {
  await page.goto("/inventory");
  await expect(rows(page).first()).toBeVisible();
  await page.locator("main").getByLabel("Sắp xếp", { exact: true }).click();
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: "Tên A–Z" }).click();
  const list = (await names(page)).filter(Boolean);
  expect(list).toEqual([...list].sort((a, b) => a.localeCompare(b, "vi")));
});

test("Nhập thêm trong drawer: hết Sắp hết, hiện ở trang Phiếu kho", async ({ page }) => {
  await page.goto("/inventory?material=wax-beeswax");
  const d = drawer(page);
  await expect(d.getByRole("region", { name: "Tồn kho hiện tại" })).toContainText("Sáp ong");
  await expect(d.getByRole("region", { name: "Tồn kho hiện tại" })).toContainText("Sắp hết");
  await d.getByLabel("Số lượng").fill("1000");
  await d.getByLabel("Tổng tiền lô").fill("180000");
  await d.getByLabel("Ghi chú phiếu").fill("Nhập lô mới");
  await d.getByRole("button", { name: "Ghi nhận" }).click();
  await expect(d.getByRole("region", { name: "Tồn kho hiện tại" })).toContainText("1.450");
  await expect(d.getByRole("region", { name: "Tồn kho hiện tại" })).toContainText("Còn hàng");
  await d.locator(".ant-drawer-close").first().click();
  await page.goto("/inventory/movements");
  const first = page.getByRole("list", { name: "Phiếu kho" }).getByRole("listitem").first();
  await expect(first).toContainText("Sáp ong");
  await expect(first).toContainText("Nhập lô mới");
});

test("Drawer liệt kê lựa chọn Thủ công đang dùng nguyên liệu, bấm mở đúng lựa chọn", async ({ page }) => {
  await page.goto("/inventory?material=jar-ceramic-150");
  const d = drawer(page);
  const used = d.locator("section").filter({ hasText: /Dùng trên web \(\d+\)/ });
  await expect(used).toContainText("Hũ gốm");
  await used.getByRole("link").first().click();
  await expect(page).toHaveURL(/\/craft/);
});

test("Hũ theo từng cỡ: Thủ công hiện tồn từng cỡ, cỡ hết hàng có nhãn", async ({ page }) => {
  await page.goto("/craft");
  await expect(page.locator("main")).toContainText("Hũ gốm");
  const row = page.locator("main tr.ant-table-row").filter({ hasText: "Hũ gốm" }).first();
  await expect(row).toContainText("150ml");
  await expect(row).toContainText("200ml");
  await expect(row).toContainText("Hết hàng");
});

test("Thêm nguyên liệu không theo dõi tồn: luôn coi là còn hàng", async ({ page }) => {
  await page.goto("/inventory?material=new");
  const d = drawer(page);
  await d.locator("#name").fill("Giấy gói quà");
  await d.getByRole("switch", { name: "Theo dõi tồn kho" }).click();
  await expect(d.getByRole("switch", { name: "Theo dõi tồn kho" })).not.toBeChecked();
  await d.locator(".ant-drawer-footer").getByRole("button", { name: /Thêm vào kho/ }).click();
  await expect(drawer(page)).toHaveCount(0);
  await page.goto("/inventory?status=untracked");
  await expect(rows(page).filter({ hasText: "Giấy gói quà" })).toContainText("Không theo dõi");
  // Không bị tính là hết hàng
  await page.goto("/inventory?status=out");
  await expect(rows(page).filter({ hasText: "Giấy gói quà" })).toHaveCount(0);
});

const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("bo-inventory-v2") ?? "null"));
const card = (page) => drawer(page).getByRole("region", { name: "Tồn kho hiện tại" });

test("Nhập thêm bắt buộc tiền lô: thiếu thì chặn, hàng tặng chọn Không mất tiền", async ({ page }) => {
  await page.goto("/inventory?material=wax-soy");
  await expect(card(page)).toContainText("Giá nhập bình quân 90");
  await card(page).getByLabel("Số lượng").fill("1000");
  await expect(card(page).getByRole("status")).toContainText("ghi tổng tiền lô để tính giá");
  await card(page).getByRole("button", { name: "Ghi nhận" }).click();
  await expect(card(page).getByRole("status")).toContainText("Nhập tổng tiền đã trả cho lô");
  // Không ghi phiếu: số tồn giữ nguyên
  await expect(card(page).locator(".big-number")).toContainText("9.000");
  // Hàng tặng: 1.000 g không mất tiền → bình quân 9.000 g × 90 ÷ 10.000 g = 81
  await card(page).getByRole("checkbox", { name: "Không mất tiền" }).check();
  await expect(card(page).getByLabel("Tổng tiền lô")).toBeDisabled();
  await expect(card(page).getByRole("status")).toContainText("bình quân 90");
  await expect(card(page).getByRole("status")).toContainText("81");
  await card(page).getByRole("button", { name: "Ghi nhận" }).click();
  await expect(card(page)).toContainText("Giá nhập bình quân 81");
  const inv = await stored(page);
  expect(inv.movements[0]).toMatchObject({ materialId: "wax-soy", type: "in", change: 1000, totalCost: 0, unitCost: 0 });
  await expect(drawer(page).locator("section").filter({ hasText: "Lịch sử kho" })).toContainText("Không mất tiền");
});

test("Thêm nguyên liệu: luôn có ô Tổng tiền đã trả, có tồn ban đầu thì bắt buộc, tự ra giá mỗi gam", async ({ page }) => {
  await page.goto("/inventory?material=new");
  const d = drawer(page);
  await d.locator("#name").fill("Sáp cọ");
  await d.locator(".ant-radio-button-wrapper").filter({ hasText: "Gram" }).click();
  // Ô tiền hiện ngay từ đầu, cạnh ô Tồn ban đầu
  await expect(d.getByLabel("Tổng tiền đã trả")).toBeVisible();
  await expect(d).toContainText("Chưa có hàng thì để trống");
  await d.locator("#stock").fill("5000");
  // Chưa bấm lưu thì chưa báo đỏ
  await expect(d).toContainText("Tiền mua số tồn ban đầu");
  await expect(d).not.toContainText("Nhập tổng tiền đã trả cho lô");
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Thêm vào kho" }).click();
  await expect(d).toContainText("Nhập tổng tiền đã trả cho lô");
  await d.getByLabel("Tổng tiền đã trả").fill("300000");
  await expect(d).toContainText("= 60");
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Thêm vào kho" }).click();
  await expect(drawer(page)).toHaveCount(0);
  const inv = await stored(page);
  const m = inv.materials.find((x) => x.name === "Sáp cọ");
  expect(m).toMatchObject({ unit: "g", stock: 5000, unitCost: 60 });
  expect(inv.movements[0]).toMatchObject({ materialId: m.id, note: "Tồn ban đầu", change: 5000, totalCost: 300_000, unitCost: 60 });
});

test("Thêm nguyên liệu tồn 0: ghi tiền mà không có số lượng thì báo, để trống thì tạo chưa có giá", async ({ page }) => {
  await page.goto("/inventory?material=new");
  const d = drawer(page);
  await d.locator("#name").fill("Tinh dầu Sả");
  await d.getByLabel("Tổng tiền đã trả").fill("100000");
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Thêm vào kho" }).click();
  await expect(d).toContainText("Nhập tồn ban đầu để chia ra giá mỗi đơn vị.");
  // Ghi số tồn thì hết báo lỗi, ra giá mỗi ml
  await d.locator(".ant-radio-button-wrapper").filter({ hasText: "Mililít" }).click();
  await d.locator("#stock").fill("50");
  await expect(d).not.toContainText("Nhập tồn ban đầu để chia ra giá mỗi đơn vị.");
  await expect(d).toContainText("= 2.000");
  // Đổi ý: chưa có hàng, bỏ trống tiền
  await d.locator("#stock").fill("0");
  await d.getByLabel("Tổng tiền đã trả").fill("");
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Thêm vào kho" }).click();
  await expect(drawer(page)).toHaveCount(0);
  const inv = await stored(page);
  const m = inv.materials.find((x) => x.name === "Tinh dầu Sả");
  expect(m).toMatchObject({ stock: 0 });
  expect(m.unitCost).toBeUndefined();
  expect(inv.movements.some((mv) => mv.materialId === m.id)).toBe(false);
});

test("Nguyên liệu đã có: form không có ô giá kiểu mua hàng, Sửa giá ghi lịch sử", async ({ page }) => {
  await page.goto("/inventory?material=wax-soy");
  const d = drawer(page);
  // Ô "Mua … giá …" chỉ hiện khi bấm Sửa giá trên thẻ tồn kho
  await expect(d.getByLabel("Lượng mua")).toHaveCount(0);
  await expect(d.locator("section").filter({ hasText: "Cài đặt tồn kho" })).toContainText("Số tồn và giá nhập đổi qua phiếu");
  await card(page).getByRole("button", { name: "Sửa giá" }).click();
  const editor = card(page).getByRole("group", { name: "Sửa giá nhập" });
  await expect(editor.getByLabel("Lượng mua")).toHaveValue("1");
  await editor.getByLabel("Lượng mua").fill("5");
  await editor.getByLabel("Giá mua").fill("400000");
  await expect(editor).toContainText("= 80");
  await editor.getByRole("button", { name: "Lưu giá" }).click();
  await expect(card(page)).toContainText("Giá nhập bình quân 80");
  const inv = await stored(page);
  expect(inv.materials.find((m) => m.id === "wax-soy")).toMatchObject({ stock: 9000, unitCost: 80 });
  expect(inv.movements[0]).toMatchObject({ materialId: "wax-soy", type: "cost", change: 0, unitCost: 80, previousCost: 90 });
  const history = d.locator("section").filter({ hasText: "Lịch sử kho" });
  await expect(history).toContainText("Sửa giá nhập");
  await expect(history).toContainText("trước 90");
});

test("Lưu thông tin sau khi nhập kho giữ giá bình quân mới; còn phiếu gõ dở thì chặn lưu", async ({ page }) => {
  await page.goto("/inventory?material=wax-soy");
  const d = drawer(page);
  await card(page).getByLabel("Số lượng").fill("1000");
  await card(page).getByLabel("Tổng tiền lô").fill("120000");
  await card(page).getByRole("button", { name: "Ghi nhận" }).click();
  await expect(card(page)).toContainText("Giá nhập bình quân 93");
  // Trước đây form giữ giá cũ 90 và ghi đè khi bấm Lưu thông tin
  await d.locator("#sku").fill("SAP-DN-2");
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Lưu thông tin" }).click();
  await expect(drawer(page)).toHaveCount(0);
  expect((await stored(page)).materials.find((m) => m.id === "wax-soy")).toMatchObject({ sku: "SAP-DN-2", unitCost: 93, stock: 10000 });

  // Gõ số lượng nhưng chưa Ghi nhận → Lưu thông tin bị chặn, đóng thì hỏi
  await page.goto("/inventory?material=wax-soy");
  await card(page).getByLabel("Số lượng").fill("500");
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Lưu thông tin" }).click();
  await expect(page.getByText("Phiếu kho chưa ghi nhận")).toBeVisible();
  await expect(drawer(page)).toHaveCount(1);
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Đóng" }).click();
  const confirm = page.locator(".ant-modal-confirm");
  await expect(confirm).toContainText("Bỏ phiếu kho chưa ghi nhận?");
  await confirm.getByRole("button", { name: "Ở lại" }).click();
  await expect(drawer(page)).toHaveCount(1);
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Đóng" }).click();
  await page.locator(".ant-modal-confirm").getByRole("button", { name: "Bỏ phiếu" }).click();
  await expect(drawer(page)).toHaveCount(0);
  expect((await stored(page)).materials.find((m) => m.id === "wax-soy").stock).toBe(10000);
});

test("Nguyên liệu không theo dõi tồn: sửa giá nhập ngay trong form", async ({ page }) => {
  await page.goto("/inventory?material=new");
  const d = drawer(page);
  await d.locator("#name").fill("Thiệp viết tay");
  await d.getByRole("switch", { name: "Theo dõi tồn kho" }).click();
  await expect(d.getByLabel("Tổng tiền đã trả")).toHaveCount(0);
  await d.getByLabel("Lượng mua").fill("50");
  await d.getByLabel("Giá mua").fill("100000");
  await expect(d).toContainText("= 2.000");
  await d.locator(".ant-drawer-footer").getByRole("button", { name: "Thêm vào kho" }).click();
  await expect(drawer(page)).toHaveCount(0);
  const inv = await stored(page);
  expect(inv.materials.find((x) => x.name === "Thiệp viết tay")).toMatchObject({ tracked: false, unitCost: 2000 });
  // Không theo dõi tồn → không có phiếu
  expect(inv.movements.some((mv) => mv.materialId === inv.materials.find((x) => x.name === "Thiệp viết tay").id)).toBe(false);
});
