// Đăng nhập BO bằng PIN 6 số (docs/pages/login.md). BE được giả lập ở support/mock-auth.ts
import { expect, test } from "./support/harness.mjs";
import { mockAuth, PIN } from "./support/mock-auth";

test.use({ autoLogin: false });

const KEY = "2510-admin-session";
const pin = (page) => page.locator("#pin");
const stored = (page) => page.evaluate((k) => ({ local: localStorage.getItem(k), session: sessionStorage.getItem(k) }), KEY);

test("Chặn khi chưa đăng nhập, PIN sai báo số lần còn lại, đủ 6 số tự đăng nhập và quay lại đúng trang", async ({ page, t }) => {
  void t;
  const { calls } = await mockAuth(page);
  await page.goto("/orders?status=paid");
  await expect(page).toHaveURL("/login?next=" + encodeURIComponent("/orders?status=paid"));
  await expect(page.locator(".app-sider")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Nhập mã PIN" })).toBeVisible();
  // Chỉ có ô PIN: focus sẵn, không có bàn phím số hay nút Đăng nhập
  await expect(pin(page)).toBeFocused();
  await expect(page.getByRole("button")).toHaveCount(0);

  // Gõ: hiện chấm; chữ bị bỏ
  await page.keyboard.type("1a23");
  await expect(page.locator(".pin-dot")).toHaveCount(3);
  await page.keyboard.press("Backspace");
  await expect(pin(page)).toHaveValue("12");
  // Đủ 6 số → tự gửi; sai thì xóa ô, báo còn 4 lần ngay dưới ô, giữ focus
  await page.keyboard.type("0000");
  await expect(page.getByRole("alert")).toHaveText("PIN không đúng. Còn 4 lần thử.");
  await expect(pin(page)).toHaveValue("");
  await expect(pin(page)).toBeFocused();
  await expect(pin(page)).toHaveAttribute("aria-describedby", /pin-notice/);
  // Dán PIN có khoảng trắng: chỉ giữ số. Bỏ Ghi nhớ → phiên trong sessionStorage
  await page.getByRole("checkbox").uncheck();
  await pin(page).fill(PIN.slice(0, 3) + " " + PIN.slice(3));
  await expect(page).toHaveURL("/orders?status=paid");
  expect(calls.at(-1)).toEqual({ pin: PIN, remember: false });
  const s = await stored(page);
  expect(s.local).toBeNull();
  expect(JSON.parse(s.session!)).toMatchObject({ name: "Admin 2510", token: "token-test" });
  await expect(page.locator(".app-sider")).toContainText("Admin 2510");

  // Đã đăng nhập mở /login → Dashboard. Đăng xuất → về đăng nhập, xóa phiên, không vào lại được
  await page.goto("/login");
  await expect(page).toHaveURL("/");
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/login/);
  expect(await stored(page)).toEqual({ local: null, session: null });
  await page.goto("/inventory");
  await expect(page).toHaveURL(/\/login\?next=%2Finventory/);
});

test("Ghi nhớ 30 ngày, phiên hết hạn phải đăng nhập lại, chặn chuyển hướng ra ngoài", async ({ page, t }) => {
  void t;
  await mockAuth(page);
  await page.goto("/login?next=" + encodeURIComponent("//evil.example"));
  await pin(page).pressSequentially(PIN);
  await expect(page).toHaveURL("/");
  const s = JSON.parse((await stored(page)).local!);
  expect(s.expiresAt - Date.now()).toBeGreaterThan(29 * 864e5);
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ name: "Admin 2510", token: "x", expiresAt: Date.now() - 1000 })), KEY);
  await page.goto("/orders");
  await expect(page).toHaveURL(/\/login/);
});

test("Sai 5 lần: BE khóa, đếm ngược, khóa ô PIN; hết giờ tự mở lại", async ({ page, t }) => {
  void t;
  await page.clock.install();
  await mockAuth(page, { retryIn: 75 });
  await page.goto("/login");
  for (let i = 0; i < 4; i++) {
    await pin(page).fill("11111" + i);
    await expect(page.getByRole("alert")).toContainText(`Còn ${4 - i} lần thử`);
  }
  await expect(page.getByRole("alert")).toHaveText("PIN không đúng. Còn 1 lần thử trước khi bị tạm khóa.");
  await pin(page).fill("111119");
  await expect(page.getByRole("alert")).toContainText("Thử lại sau 1:15");
  await expect(pin(page)).toBeDisabled();
  await page.clock.runFor(30_000);
  await expect(page.getByRole("alert")).toContainText("Thử lại sau 0:45");
  await page.clock.runFor(46_000);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(pin(page)).toBeEnabled();
});

test("Mất kết nối máy chủ thì báo rõ; điện thoại không tràn ngang, bật bàn phím số", async ({ page, t }) => {
  void t;
  await page.route("**/api/auth/login", (route) => route.abort());
  await page.goto("/login");
  await pin(page).fill("123456");
  await expect(page.getByRole("alert")).toHaveText("Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const box = await page.locator("main").boundingBox();
  expect(box!.x >= 0 && box!.x + box!.width <= 375).toBe(true);
  await expect(pin(page)).toHaveAttribute("inputmode", "numeric");
  // 6 ô vừa màn hình
  const cells = await page.locator(".pin-cell").evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.left, r.right]));
  expect(cells[0][0] >= 0 && cells[5][1] <= 375).toBe(true);
});

test("Đăng xuất ở tab khác thì tab đang mở cũng về trang đăng nhập", async ({ page, context, t }) => {
  void t;
  await mockAuth(page);
  await page.goto("/login");
  await pin(page).fill(PIN);
  await expect(page.locator(".app-sider")).toBeVisible();
  await page.goto("/orders");
  const other = await context.newPage();
  await other.goto("/customers");
  await expect(other.locator(".app-sider")).toBeVisible();
  await other.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(other).toHaveURL(/\/login/);
  await expect(page).toHaveURL(/\/login\?next=%2Forders/);
});
