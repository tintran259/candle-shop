// Đăng nhập BO: chặn khi chưa đăng nhập, sai mật khẩu, khóa 30 giây, quay lại đúng trang, ghi nhớ, đăng xuất
import { test } from "./support/harness.mjs";

test.use({ autoLogin: false });

test("Đăng nhập BO: chặn khi chưa đăng nhập, sai mật khẩu, khóa 30 giây, quay lại đúng trang, ghi nhớ, đăng xuất", async ({ t }) => {
  const bo = t.base;
  const { ev, sleep, shot, click, clickText, go, ok, viewport, logs } = t;
  const path = () => ev("location.pathname + location.search");
  const fill = async (email, pw) => {
    await ev(`(()=>{const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;for(const i of document.querySelectorAll('#email,#password')){set.call(i,'');i.dispatchEvent(new Event('input',{bubbles:true}))}})()`);
    await t.type(`document.querySelector('#email')`, email);
    await t.type(`document.querySelector('#password')`, pw);
    await clickText("button", "Đăng nhập");
    await sleep(900);
  };
  const error = () => ev("document.querySelector('[role=alert]')?.innerText ?? ''");

  await viewport(1440, 900);
  await go(bo + "/login", 1200);
  await ev("localStorage.removeItem('2510-admin-session'); sessionStorage.removeItem('2510-admin-session')");
  await go(bo + "/orders?status=paid", 2500);
  ok("A1 Chưa đăng nhập → trang đăng nhập, nhớ trang cũ", (await path()) === "/login?next=" + encodeURIComponent("/orders?status=paid"), await path());
  ok("A2 Không thấy sidebar", !(await ev("!!document.querySelector('.app-sider')")));
  await shot("login-desktop.png");

  await clickText("button", "Đăng nhập");
  await sleep(500);
  ok("B1 Bỏ trống báo lỗi từng ô", (await ev("[...document.querySelectorAll('.ant-form-item-explain-error')].map(e=>e.innerText).join('|')")) === "Nhập email.|Nhập mật khẩu.");
  await fill("admin@2510.vn", "sai-mat-khau");
  ok("B2 Sai mật khẩu báo lỗi, xóa ô mật khẩu", (await error()).includes("không đúng") && (await ev("document.querySelector('#password').value")) === "");
  for (let i = 0; i < 4; i++) await fill("admin@2510.vn", "sai" + i);
  ok("B3 Sai 5 lần thì khóa", (await error()).includes("Thử lại sau"), await error());
  await fill("admin@2510.vn", "2510candle");
  ok("B4 Đang khóa: nút bị khóa, chưa vào được", (await path()).startsWith("/login") && await ev(`[...document.querySelectorAll("button")].find(b=>b.innerText.trim()==="Đăng nhập").disabled`));
  await shot("login-locked.png");

  // Tải lại trang để bỏ khóa (khóa chỉ trong bộ nhớ tab), bỏ "Ghi nhớ"
  await go(bo + "/login?next=" + encodeURIComponent("/orders?status=paid"), 1500);
  await click(`document.querySelector('.ant-checkbox-input')`);
  await fill("ADMIN@2510.vn ", "2510candle");
  await sleep(1500);
  ok("C1 Đăng nhập đúng → về đúng trang đang mở", (await path()).startsWith("/orders?status=paid"), await path());
  ok("C2 Không ghi nhớ → lưu sessionStorage", (await ev("!!sessionStorage.getItem('2510-admin-session') && !localStorage.getItem('2510-admin-session')")));
  ok("C3 Sidebar hiện tên", (await ev("document.querySelector('.app-sider').innerText")).includes("Admin 2510"));
  await go(bo + "/login", 1500);
  ok("C4 Đã đăng nhập mở /login thì về Dashboard", (await path()) === "/");

  await click(`document.querySelector('[aria-label="Đăng xuất"]')`);
  await sleep(1200);
  ok("D1 Đăng xuất về trang đăng nhập", (await path()).startsWith("/login"), await path());
  ok("D2 Xóa phiên", await ev("!sessionStorage.getItem('2510-admin-session') && !localStorage.getItem('2510-admin-session')"));
  await go(bo + "/inventory", 2000);
  ok("D3 Sau đăng xuất không vào lại được", (await path()).startsWith("/login"));

  // Ghi nhớ: localStorage, tồn tại sau khi mở tab mới
  await fill("admin@2510.vn", "2510candle");
  await sleep(1200);
  ok("E1 Ghi nhớ → localStorage 30 ngày", await ev("(JSON.parse(localStorage.getItem('2510-admin-session')).expiresAt - Date.now()) > 29*864e5"));
  ok("E2 Vào /inventory sau đăng nhập", (await path()).startsWith("/inventory"), await path());
  // Phiên hết hạn
  await ev("localStorage.setItem('2510-admin-session', JSON.stringify({email:'admin@2510.vn',name:'Admin 2510',expiresAt:Date.now()-1000}))");
  await go(bo + "/orders", 2000);
  ok("E3 Phiên hết hạn → đăng nhập lại", (await path()).startsWith("/login"));
  // Chặn chuyển hướng ra ngoài
  await go(bo + "/login?next=" + encodeURIComponent("//evil.example"), 1200);
  await fill("admin@2510.vn", "2510candle");
  await sleep(1200);
  ok("E4 next ra ngoài bị bỏ, về Dashboard", (await ev("location.host + location.pathname")) === new URL(bo).host + "/");

  await ev("localStorage.removeItem('2510-admin-session')");
  await viewport(375, 812, true);
  await go(bo + "/login", 2000);
  ok("F1 Mobile không tràn ngang, form nằm trong màn hình", await ev("document.documentElement.scrollWidth <= innerWidth && (()=>{const r=document.querySelector('main').getBoundingClientRect();return r.left>=0 && r.right<=innerWidth})()"));
  // Caps Lock
  await ev("document.querySelector('#password').focus()");
  await t.send("Input.dispatchKeyEvent", { type: "keyDown", key: "A", code: "KeyA", modifiers: 8, windowsVirtualKeyCode: 65 });
  await ev("document.querySelector('#password').dispatchEvent(new KeyboardEvent('keyup',{key:'A',bubbles:true,modifierCapsLock:true}))");
  await sleep(300);
  ok("F2 Báo Caps Lock", (await ev("document.body.innerText")).includes("Đang bật Caps Lock"));
  await shot("login-mobile.png");
});
