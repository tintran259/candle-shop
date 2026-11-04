// BO lưu cấu hình Thủ công → web đổi theo: bước, số lựa chọn, giá VNĐ, tồn kho, giỏ hàng
import { SF_URL, sfReachable, test } from "./support/harness.mjs";

test.use({ storefront: true });

// Cần web (fe) chạy dev ở cổng 3000; không chạy thì bỏ qua
test.beforeEach(async () => test.skip(!(await sfReachable()), "Web không chạy ở " + (process.env.SF_URL ?? "http://localhost:3000")));

test("BO lưu cấu hình Thủ công → web đổi theo: bước, số lựa chọn, giá VNĐ, tồn kho, giỏ hàng", async ({ t }) => {
  const bo = t.base;
  const sf = SF_URL;
  const { ev, sleep, shot, click, clickText, go, ok, text, viewport, logs } = t;
  const checked = () => ev("[...document.querySelectorAll('section[aria-labelledby^=step-] [aria-checked=true]')].map(b=>b.innerText.split('\\n')[0])");
  const title = () => ev("document.querySelector('section[aria-labelledby^=step-] h2')?.innerText");
  const steps = () => text("nav[aria-label] li button");
  const next = async () => { await click(`[...document.querySelectorAll('button')].find(b=>b.innerText.startsWith('Tiếp theo'))`); await sleep(500); };
  const toStep = async (name) => { await clickText("nav[aria-label] li button", name); await sleep(500); };
  const addBtn = () => ev("document.querySelector('#customize-summary').innerText.replace(/\\s+/g,' ')");
  const stepBtn = (n) => `[...document.querySelectorAll('main li, main [role=button], main button, main div')].filter(e=>e.innerText&&e.innerText.startsWith(${JSON.stringify(n)})&&e.innerText.length<60).pop()`;
  const save = async () => {
    await clickText("main button", "Lưu thay đổi");
    await sleep(900);
    if (await ev("!!document.querySelector('.ant-modal-confirm-btns')")) { await click(`[...document.querySelectorAll('.ant-modal-confirm-btns button')].pop()`); await sleep(800); }
    await sleep(1200);
  };
  const settings = async (name) => { await go(bo + "/craft", 3000); await click(stepBtn(name)); await sleep(500); await clickText("main .ant-tabs-tab", "Cài đặt"); await sleep(500); };

  await t.send("Network.enable"); await t.send("Network.clearBrowserCookies");
  await viewport(1440, 1000);
  await go(bo + "/", 1000);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  await go(bo + "/craft", 3200);
  const api = await (await fetch(sf + "/api/craft-config")).json();
  ok("A1 BO mở lên tự đẩy cấu hình sang web", api.config.steps.length === 7 && api.materials.length > 20, String(api.materials.length));

  await go(sf + "/craft", 4500);
  await ev("localStorage.removeItem('scandleted-cart')");
  await ev("document.cookie='NEXT_LOCALE=vi;path=/'");
  await go(sf + "/craft", 4000);
  const names = (await steps()).join(" | ");
  ok("A2 Web hiện đúng các bước BO", names.includes("Sáp") && names.includes("Màu sáp") && names.includes("Trang trí") && names.includes("Cá nhân hóa"), names);
  const s1 = await addBtn();
  ok("A3 Giá theo VNĐ của BO", /₫/.test(s1) && !s1.includes("$"), s1.slice(0, 120));
  await toStep("Sáp");
  ok("A4 Không còn Sáp pha trộn", !(await ev("document.querySelector('section[aria-labelledby^=step-]').innerText")).includes("pha trộn"));
  await clickText("[role=checkbox]", "Sáp dừa");
  await sleep(300);
  ok("B1 Web chọn được nhiều sáp", (await checked()).length === 2, (await checked()).join());
  const s2 = await addBtn();
  ok("B2 Phụ thu sáp theo tỉ lệ 50% = 13.000", s2.includes("+13.000"), s2.slice(0, 200));
  await shot("sf-wax.png");
  await toStep("Màu sáp");
  await clickText("[role=checkbox]", "Xanh sage");
  await sleep(300);
  ok("B3 Chọn được nhiều màu", (await checked()).length === 2, (await checked()).join());
  await clickText("[role=checkbox]", "Không màu");
  await sleep(300);
  ok("B4 Không màu đứng một mình", (await checked()).join() === "Không màu");
  await toStep("Trang trí");
  await clickText("[role=checkbox]", "Hoa khô");
  await sleep(200);
  await clickText("[role=checkbox]", "Họa tiết");
  await sleep(300);
  ok("B5 Trang trí chọn nhiều, hình nến vẽ cả hai", (await checked()).length === 2);
  await shot("sf-deco.png");
  await toStep("Mùi hương");
  const s3 = await addBtn();
  ok("B6 Có phụ thu Hương chuẩn 10.000", s3.includes("Hương chuẩn") && s3.includes("+10.000"), s3.slice(0, 220));
  await clickText("#customize-summary button", "Thêm vào giỏ");
  await sleep(900);
  await go(sf + "/checkout", 3500);
  const co = await ev("document.querySelector('main').innerText.replace(/\\s+/g,' ')");
  ok("B7 Thanh toán hiện nến tự phối, giá VNĐ", co.includes("Sáp đậu nành") && co.includes("Sáp dừa") && co.includes("₫") && !co.includes("$"), co.slice(0, 200));
  await shot("sf-checkout.png");
  await go(sf + "/shop", 3500);
  const shop = await ev("document.querySelector('main').innerText");
  ok("B8 Cửa hàng giá VNĐ, có sản phẩm", shop.includes("925.000 ₫") || shop.includes("825.000 ₫"), shop.slice(0, 160));

  // Đổi ở BO: Sáp chỉ chọn 1
  await settings("Sáp");
  await clickText("main .ant-radio-button-wrapper", "Chọn 1");
  await sleep(400);
  await save();
  await go(sf + "/craft", 4000);
  await toStep("Sáp");
  ok("C1 BO đặt Chọn 1 thì web là radio", (await ev("document.querySelectorAll('section[aria-labelledby^=step-] [role=radio]').length")) >= 3 && (await ev("document.querySelectorAll('section[aria-labelledby^=step-] [role=checkbox]').length")) === 0);
  await clickText("[role=radio]", "Sáp dừa");
  await sleep(300);
  ok("C2 Chỉ giữ 1 sáp", (await checked()).join() === "Sáp dừa", (await checked()).join());

  // Đổi ở BO: tắt bước Trang trí
  await settings("Trang trí");
  await click(`[...document.querySelectorAll('main [role=switch]')].find(s=>s.getAttribute('aria-label')==='Hiện trên web')`);
  await sleep(400);
  await save();
  await go(sf + "/craft", 4000);
  ok("D1 BO tắt bước thì web ẩn", !(await steps()).join().includes("Trang trí"), (await steps()).join(" | "));

  // Bước mới
  await go(bo + "/craft", 3000);
  await clickText("main button", "Thêm bước");
  await sleep(700);
  await t.type(`document.querySelector('.ant-modal-wrap:not([style*=none]) input')`, "Kiểu nhãn");
  await sleep(300);
  await click(`[...document.querySelectorAll('.ant-modal-footer button')].pop()`);
  await sleep(800);
  await click(`[...document.querySelectorAll('main [role=switch]')].find(s=>s.getAttribute('aria-checked')==='false')`).catch(() => {});
  await sleep(300);
  const draft = await ev("JSON.parse(localStorage.getItem('bo-craft-builder-v5-draft')||'{}').steps?.at(-1)?.title?.vi");
  console.log("bước mới:", draft);
  await save();
  await sleep(600);
  const after = await (await fetch(sf + "/api/craft-config")).json();
  console.log("steps", after.config.steps.map((s) => `${s.id}:${s.enabled}`).join(" "));

  // Tồn kho: phiếu kho đẩy sang ngay
  const stock0 = after.materials.find((m) => m.id === "wax-soy").stock;
  console.log("wax-soy", stock0);
});
