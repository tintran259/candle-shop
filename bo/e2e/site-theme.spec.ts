// Cài đặt › Giao diện web (docs/pages/site-theme.md): danh sách + trang chi tiết — chế độ lưu trên trình duyệt
import { expect, test } from "./support/harness.mjs";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
const stored = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("bo-site-themes-v1") ?? "null"));
const theme = async (page, id) => (await stored(page))?.find((t) => t.id === id);
const preview = (page) => page.getByLabel("Xem trước trang chủ");
const row = (page, name) => page.getByRole("row").filter({ has: page.getByRole("link", { name, exact: true }) });

test("Danh sách có sẵn Mặc định; sửa Mặc định, xem trước đổi theo, Lưu và đăng", async ({ page, t }) => {
  void t;
  await page.goto("/settings");
  await page.getByRole("menuitem", { name: /Giao diện web/ }).click();
  await expect(page).toHaveURL(/\/settings\/site-theme$/);
  await expect(page.getByText('Web đang sử dụng giao diện "Mặc định".')).toBeVisible();
  await expect(row(page, "Mặc định")).toContainText("Đang sử dụng");
  await expect(row(page, "Mặc định")).toContainText("Ngoài các dịp");
  // Mặc định không xóa được
  await expect(row(page, "Mặc định").getByRole("button", { name: /Xóa/ })).toHaveCount(0);

  await page.getByRole("link", { name: "Mặc định", exact: true }).click();
  await expect(page).toHaveURL(/\/settings\/site-theme\/default$/);
  await expect(page.getByText("Chưa cấu hình — web đang dùng nội dung có sẵn")).toBeVisible();
  await expect(preview(page)).toContainText("Made by hand, never twice.");
  // Mặc định không gắn concept
  await expect(page.getByLabel("Dùng cho concept")).toHaveCount(0);

  await page.getByLabel("Nội dung thanh thông báo").fill("Miễn phí giao hàng nội thành");
  await page.getByLabel("Câu lớn dưới ảnh").fill("Ánh nến của mùa đông");
  await expect(preview(page)).toContainText("Ánh nến của mùa đông");
  await expect(page.getByText("Có thay đổi chưa lưu")).toBeVisible();

  await page.getByLabel("Tiêu đề (tối đa 2 dòng)").fill("Một\nHai\nBa");
  await expect(page.getByText("Tối đa 2 dòng, mỗi dòng 30 ký tự.")).toBeVisible();
  await page.getByLabel("Tiêu đề (tối đa 2 dòng)").fill("Ánh sáng nhỏ\nẤm áp lớn");
  await expect(preview(page)).toContainText("Ấm áp lớn");

  // Chưa chọn ảnh: xem trước và ô ảnh dùng ảnh có sẵn của web
  await expect(preview(page).locator("section img").first()).toHaveAttribute("src", "/site-preview/hero-2510.jpg");
  await expect(page.getByText("Ảnh có sẵn của web")).toBeVisible();
  // Ảnh hero nhỏ: cảnh báo nhưng vẫn nhận
  await page.getByRole("region", { name: "Hero" }).locator("input[type=file]").first().setInputFiles({ name: "hero.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByText(/nên dùng ảnh rộng từ 1600px/)).toBeVisible();
  await expect(preview(page).locator("section img").first()).toHaveAttribute("src", /^data:image/);

  await page.getByRole("button", { name: "Lưu và đăng lên web" }).click();
  await expect(page.getByText(/Đã đăng giao diện lên web/)).toBeVisible();
  const saved = await theme(page, "default");
  expect(saved.draft).toBeNull();
  expect(saved.published).toMatchObject({ announcement: "Miễn phí giao hàng nội thành", hero: { mark: "Ánh nến của mùa đông", title: "Ánh sáng nhỏ\nẤm áp lớn" } });
  expect(saved.published.hero.image).toMatch(/^data:image/);
  expect(saved.published).not.toHaveProperty("conceptIds");
  await expect(page.getByText(/^Cập nhật lúc \d{2}:\d{2} /)).toBeVisible();

  await page.getByRole("link", { name: "Về danh sách giao diện" }).click();
  await expect(row(page, "Mặc định")).toContainText("Đang sử dụng");
});

test("Thêm giao diện cho concept: gắn concept, Lưu nháp, Lưu và đăng (web dùng khi trong mùa), concept đã thuộc giao diện khác không chọn được, gỡ, xóa", async ({ page, t }) => {
  void t;
  await page.goto("/settings/site-theme");
  await page.getByRole("button", { name: "Thêm giao diện" }).click();
  await page.getByLabel("Tên giao diện").fill("Giáng sinh 2026");
  await page.getByRole("button", { name: "Thêm và sửa" }).click();
  await expect(page).toHaveURL(/\/settings\/site-theme\/theme-/);
  await expect(page.getByRole("heading", { name: "Giáng sinh 2026" })).toBeVisible();
  await expect(page.getByText("Chưa gắn concept — giao diện sẽ không lên web.")).toBeVisible();
  await expect(page.getByText("Để trống = dùng của Mặc định").first()).toBeVisible();
  // Ô ảnh để trống (không hiện ảnh gốc như Mặc định)
  await expect(page.getByText("Dùng ảnh của Mặc định")).toBeVisible();
  await expect(page.getByRole("img", { name: "Ảnh hero" }).locator("img")).toHaveCount(0);

  // Gắn Noel (dữ liệu mẫu: không đặt ngày → luôn trong mùa)
  await page.getByLabel("Dùng cho concept").click();
  await page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: "Noel" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("alert").filter({ hasText: "Giao diện sẽ tự lên web mọi ngày." })).toBeVisible();

  await page.getByLabel("Câu lớn dưới ảnh").fill("Giáng sinh an lành");
  await expect(preview(page)).toContainText("Giáng sinh an lành");
  await page.getByRole("button", { name: "Lưu nháp" }).click();
  await expect(page.getByText("Đã lưu nháp")).toBeVisible();
  await expect(page.getByText("Bản nháp chưa đăng lên web")).toBeVisible();
  const id = page.url().split("/").at(-1);
  expect((await theme(page, id)).draft).toEqual({ conceptIds: ["noel"], logo: {}, hero: { mark: "Giáng sinh an lành" }, collection: {} });

  // Nháp chưa đăng: web vẫn dùng Mặc định
  await page.getByRole("link", { name: "Về danh sách giao diện" }).click();
  await expect(row(page, "Giáng sinh 2026")).toContainText("Nháp chưa đăng");
  await expect(page.getByText('Web đang sử dụng giao diện "Mặc định".')).toBeVisible();

  await page.getByRole("link", { name: "Giáng sinh 2026" }).click();
  await page.getByRole("button", { name: "Lưu và đăng lên web" }).click();
  await expect(page.getByText(/Đã đăng giao diện lên web/)).toBeVisible();
  await expect(page.locator(".ant-tag").filter({ hasText: "Đang sử dụng" })).toBeVisible();

  // Giao diện khác: Noel đã thuộc "Giáng sinh 2026"
  await page.getByRole("link", { name: "Về danh sách giao diện" }).click();
  await expect(page.getByText('Web đang sử dụng giao diện "Giáng sinh 2026" (concept Noel đang trong mùa).')).toBeVisible();
  await page.getByRole("button", { name: "Thêm giao diện" }).click();
  await page.getByLabel("Tên giao diện").fill("Tết");
  await page.getByRole("button", { name: "Thêm và sửa" }).click();
  await page.getByLabel("Dùng cho concept").click();
  await expect(page.locator(".ant-select-item-option-disabled").filter({ hasText: "Noel" })).toContainText('thuộc "Giáng sinh 2026"');
  await page.keyboard.press("Escape");

  // Gỡ khỏi web: về Mặc định, nội dung thành nháp
  await page.getByRole("link", { name: "Về danh sách giao diện" }).click();
  await page.getByRole("link", { name: "Giáng sinh 2026" }).click();
  await page.getByRole("button", { name: "Gỡ khỏi web" }).click();
  await page.locator(".ant-popconfirm").getByRole("button", { name: "Gỡ khỏi web" }).click();
  await expect.poll(async () => (await theme(page, id)).published).toBeNull();
  await expect(page.getByText("Bản nháp chưa đăng lên web")).toBeVisible();

  // Xóa ở danh sách
  await page.getByRole("link", { name: "Về danh sách giao diện" }).click();
  await row(page, "Giáng sinh 2026").getByRole("button", { name: "Xóa Giáng sinh 2026" }).click();
  await page.locator(".ant-popconfirm").getByRole("button", { name: "Xóa" }).click();
  await expect(row(page, "Giáng sinh 2026")).toHaveCount(0);
  expect((await stored(page)).map((x) => x.name)).toEqual(["Mặc định", "Tết"]);
});

test("Nhiều concept chưa tới mùa: báo các khoảng thời gian, hỏi lại trước khi đăng, danh sách Đang chờ", async ({ page, t }) => {
  void t;
  await page.goto("/settings/site-theme");
  // Noel cuối năm sau, Tết đầu năm sau nữa (đều chưa tới mùa)
  const y = new Date().getFullYear() + 1;
  await page.evaluate((y) => {
    const concepts = [
      { id: "noel", name: { vi: "Noel", en: "Christmas" }, color: "red", hidden: false, startsOn: `${y}-12-01`, endsOn: `${y}-12-26` },
      { id: "tet", name: { vi: "Tết", en: "Lunar New Year" }, color: "gold", hidden: false, startsOn: `${y + 1}-01-20`, endsOn: `${y + 1}-02-10` },
    ];
    localStorage.setItem("bo-concepts-v1", JSON.stringify(concepts));
  }, y);
  await page.reload();
  await page.getByRole("button", { name: "Thêm giao diện" }).click();
  await page.getByLabel("Tên giao diện").fill("Mùa lễ");
  await page.getByRole("button", { name: "Thêm và sửa" }).click();
  await page.getByLabel("Dùng cho concept").click();
  const option = (name) => page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: name });
  await option("Noel").click();
  await expect(page.getByRole("alert").filter({ hasText: `Giao diện sẽ tự lên web vào 01/12 – 26/12/${y}.` })).toBeVisible();
  await option("Tết").click();
  await page.keyboard.press("Escape");
  const plan = `Giao diện sẽ tự lên web vào: 01/12 – 26/12/${y} (Noel); 20/01 – 10/02/${y + 1} (Tết).`;
  await expect(page.getByRole("alert").filter({ hasText: plan })).toBeVisible();

  // Đăng: hỏi lại, Hủy thì chưa đăng
  await page.getByRole("button", { name: "Lưu và đăng lên web" }).click();
  const confirm = page.locator(".ant-modal-confirm");
  await expect(confirm).toContainText(`${plan} Trước đó web vẫn dùng Mặc định.`);
  await confirm.getByRole("button", { name: "Hủy" }).click();
  const id = page.url().split("/").at(-1);
  expect(await theme(page, id)).toMatchObject({ published: null });

  await page.getByRole("button", { name: "Lưu và đăng lên web" }).click();
  await confirm.getByRole("button", { name: "Vẫn đăng" }).click();
  await expect(page.getByText("Đã đăng — giao diện đang chờ tới thời gian áp dụng")).toBeVisible();
  await expect(page.locator(".ant-tag").filter({ hasText: "Đang chờ" })).toBeVisible();

  await page.getByRole("link", { name: "Về danh sách giao diện" }).click();
  await expect(row(page, "Mùa lễ")).toContainText("Đang chờ");
  await expect(row(page, "Mùa lễ")).toContainText(`01/12 – 26/12/${y} (Noel)`);
  await expect(row(page, "Mùa lễ")).toContainText(`20/01 – 10/02/${y + 1} (Tết)`);
  await expect(row(page, "Mặc định")).toContainText("Đang sử dụng");
  await expect(page.getByText('Web đang sử dụng giao diện "Mặc định".')).toBeVisible();
});

test("Xưởng nến: chọn mẫu theo thứ tự (mẫu tạm ẩn không chọn được), sửa chữ, xem trước đổi theo — hơn 3 mẫu thì băng chuyền; giao diện concept để trống thì dùng mẫu của Mặc định", async ({
  page,
  t,
}) => {
  void t;
  await page.goto("/settings/site-theme/default");
  const pick = page.getByRole("region", { name: "Xưởng nến" });
  await expect(pick).toBeVisible();
  await expect(pick.getByText("Không chọn = web tự lấy mẫu nổi bật (rồi mẫu mới).")).toBeVisible();

  await page.getByLabel("Mẫu Xưởng nến").click();
  const option = (name) => page.locator(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option").filter({ hasText: name });
  await expect(option("Lavender Dream")).toHaveClass(/ant-select-item-option-disabled/);
  await expect(option("Lavender Dream")).toContainText("Tạm ẩn");
  await option("Woman Secret").click();
  await option("Beach Sunshine").click();
  await page.keyboard.press("Escape");
  await page.getByLabel("Câu dẫn Xưởng nến").fill("Ba mẫu cho mùa đông");
  await page.getByLabel("Tên khối Xưởng nến").fill("Xưởng");

  // Xem trước: chữ mới, 2 mẫu chọn đứng đầu theo thứ tự rồi bù một mẫu nổi bật — lưới 3 thẻ
  await expect(preview(page)).toContainText("Ba mẫu cho mùa đông");
  const text = await preview(page).innerText();
  expect(text.indexOf("Woman Secret")).toBeGreaterThan(-1);
  expect(text.indexOf("Woman Secret")).toBeLessThan(text.indexOf("Beach Sunshine"));
  await expect(preview(page)).not.toContainText("Sáng Chủ Nhật");
  await expect(page.getByLabel("Băng chuyền Xưởng nến")).toHaveCount(0);

  // Hơn 3 mẫu: băng chuyền tự cuộn
  await page.getByLabel("Mẫu Xưởng nến").click();
  await option("Moon Morning").click();
  await option("Citrus Bloom").click();
  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Băng chuyền Xưởng nến")).toBeVisible();
  await expect(page.getByLabel("Băng chuyền Xưởng nến")).toContainText("Citrus Bloom");

  await page.getByRole("button", { name: "Lưu và đăng lên web" }).click();
  await expect(page.getByText(/Đã đăng giao diện lên web/)).toBeVisible();
  const saved = (await theme(page, "default")).published.collection;
  expect(saved).toMatchObject({ title: "Xưởng", heading: "Ba mẫu cho mùa đông" });
  expect(saved.productIds).toHaveLength(4);

  // Giao diện concept: chưa chọn mẫu thì ghi rõ dùng mẫu của Mặc định
  await page.goto("/settings/site-theme");
  await page.getByRole("button", { name: "Thêm giao diện" }).click();
  await page.getByLabel("Tên giao diện").fill("Noel");
  await page.getByRole("button", { name: "Thêm và sửa" }).click();
  await expect(page.getByText("Không chọn = dùng mẫu của Mặc định: Woman Secret, Beach Sunshine, Moon Morning, Citrus Bloom.")).toBeVisible();
  await expect(page.getByLabel("Câu dẫn Xưởng nến")).toHaveAttribute("placeholder", "Ba mẫu cho mùa đông");
});

test("Đường dẫn giao diện không tồn tại: báo không tìm thấy", async ({ page, t }) => {
  void t;
  await page.goto("/settings/site-theme/khong-co");
  await expect(page.getByText("Không tìm thấy giao diện")).toBeVisible();
  await page.getByRole("button", { name: "Về danh sách giao diện" }).click();
  await expect(page).toHaveURL(/\/settings\/site-theme$/);
});
