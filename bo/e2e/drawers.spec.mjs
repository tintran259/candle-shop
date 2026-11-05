// Kiểm tra chức năng sau khi tối ưu drawer
import { test } from "./support/harness.mjs";
import fs from "node:fs";

test("Kiểm tra chức năng sau khi tối ưu drawer", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const out = t.out;
  const send = t.send;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ev = async (expression) => (await send("Runtime.evaluate", { returnByValue: true, awaitPromise: true, expression })).result?.value;
  const loc = () => ev("location.pathname + location.search");
  const title = () => ev(`(()=>{const t=[...document.querySelectorAll('.ant-drawer-open .ant-drawer-title')][0];return t?t.textContent.slice(0,40):'đóng'})()`);
  const close = async () => { await ev(`document.querySelector('.ant-drawer-open .ant-drawer-close').click()`); await sleep(900); };
  const ok = t.ok;
  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: base + "/" }); await sleep(2500);
  await ev("localStorage.removeItem('bo-products-v2');localStorage.removeItem('bo-discounts-v1');localStorage.removeItem('bo-craft-catalog-v2')");

  // Đơn hàng: mở, skeleton rồi nội dung, Back đóng, đổi trang bảng sau khi đóng không mở lại drawer
  await send("Page.navigate", { url: base + "/orders?limit=10&page=1" }); await sleep(2500);
  await ev(`document.querySelectorAll('main tr.ant-table-row td:nth-child(2)')[0].click()`);
  const early = await ev(`new Promise(r=>requestAnimationFrame(()=>r(!!document.querySelector('.ant-drawer-open [aria-busy]'))))`);
  await sleep(1000);
  ok("đơn: hiện nội dung sau khung xương", (await ev(`!!document.querySelector('.ant-drawer-open .ant-steps')`)), `khung xương nhịp đầu: ${early}`);
  await ev("history.back()"); await sleep(900);
  ok("đơn: Back đóng drawer", (await title()) === "đóng", await loc());
  await ev(`document.querySelector('main .ant-pagination-next button, main .ant-pagination-next').click()`); await sleep(900);
  ok("đơn: sang trang 2 không mở lại drawer", (await title()) === "đóng" && (await loc()).includes("page=2") && !(await loc()).includes("order="), await loc());
  await ev(`document.querySelectorAll('main tr.ant-table-row td:nth-child(2)')[0].click()`); await sleep(1000);
  ok("đơn: mở từ trang 2 giữ page=2", (await loc()).includes("page=2") && (await loc()).includes("order="), await loc());
  await close();
  ok("đơn: đóng giữ page=2", (await loc()).includes("page=2") && !(await loc()).includes("order="), await loc());
  await send("Page.navigate", { url: base + "/orders?order=khong-co" }); await sleep(2500);
  ok("đơn: link sai vẫn báo không tìm thấy", await ev(`!!document.querySelector('.ant-drawer-open .ant-result-404')`));

  // Sản phẩm: sửa dở → đóng (bỏ thay đổi) → mở lại cùng mục phải là dữ liệu gốc
  await send("Page.navigate", { url: base + "/products" }); await sleep(2500);
  const editBtn = `[...document.querySelectorAll('main button[aria-label^="Sửa"]')][0]`;
  await ev(`${editBtn}.click()`); await sleep(1000);
  const original = await ev(`document.querySelector('.ant-drawer-open input#name').value`);
  const setName = `(()=>{const i=document.querySelector('.ant-drawer-open input#name');const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(i,'TEN TAM');i.dispatchEvent(new Event('input',{bubbles:true}));return i.value})()`;
  await ev(setName); await sleep(300);
  await ev(`[...document.querySelectorAll('.ant-drawer-open .ant-drawer-footer button')].find(b=>b.innerText.trim()==='Hủy').click()`); await sleep(500);
  await ev(`[...document.querySelectorAll('.ant-modal-confirm button')].find(b=>b.innerText.includes('Bỏ thay đổi')).click()`); await sleep(900);
  ok("sản phẩm: đóng sau khi bỏ thay đổi", (await title()) === "đóng");
  await ev(`${editBtn}.click()`); await sleep(1000);
  const again = await ev(`document.querySelector('.ant-drawer-open input#name').value`);
  ok("sản phẩm: mở lại cùng mục là dữ liệu gốc", again === original, `${original} / ${again}`);
  await close();
  // Thêm mới 2 lần liên tiếp: form trống
  await ev(`[...document.querySelectorAll('main button')].find(b=>b.innerText.includes('Thêm sản phẩm')).click()`); await sleep(1000);
  await ev(setName); await sleep(200);
  await ev(`[...document.querySelectorAll('.ant-drawer-open .ant-drawer-footer button')].find(b=>b.innerText.trim()==='Hủy').click()`); await sleep(500);
  await ev(`[...document.querySelectorAll('.ant-modal-confirm button')].find(b=>b.innerText.includes('Bỏ thay đổi')).click()`); await sleep(900);
  await ev(`[...document.querySelectorAll('main button')].find(b=>b.innerText.includes('Thêm sản phẩm')).click()`); await sleep(1000);
  ok("sản phẩm: thêm mới lần 2 form trống", (await ev(`document.querySelector('.ant-drawer-open input#name').value`)) === "");
  await close();
  // Lưu sản phẩm cập nhật bảng
  await ev(`${editBtn}.click()`); await sleep(1000);
  await ev(setName); await sleep(200);
  await ev(`[...document.querySelectorAll('.ant-drawer-open .ant-drawer-footer button')].find(b=>b.innerText.includes('Lưu')).click()`); await sleep(1200);
  ok("sản phẩm: lưu xong bảng cập nhật", await ev(`document.querySelector('main').innerText.includes('TEN TAM')`), await title());
  // Bật/tắt trên bảng (api memo) vẫn chạy
  const sw = await ev(`(()=>{const s=document.querySelector('main .ant-table .ant-switch');const b=s.getAttribute('aria-checked');s.click();return b})()`); await sleep(400);
  ok("sản phẩm: công tắc trên bảng vẫn chạy", (await ev(`document.querySelector('main .ant-table .ant-switch').getAttribute('aria-checked')`)) !== sw);

  // Mã giảm giá & nguyên liệu: mở/đóng có hiệu ứng, mở lại được
  await send("Page.navigate", { url: base + "/discounts" }); await sleep(2500);
  await ev(`[...document.querySelectorAll('main button[aria-label^="Sửa"]')][0].click()`); await sleep(1000);
  const dt = await title();
  await ev(`document.querySelector('.ant-drawer-open .ant-drawer-close').click()`); await sleep(120);
  const sliding = await ev(`!!document.querySelector('.ant-drawer .ant-drawer-section, .ant-drawer .ant-drawer-content')`);
  await sleep(800);
  ok("mã giảm giá: đóng có hiệu ứng trượt", sliding, dt);
  // Nguyên liệu nằm ở trang Kho (?material=), không còn ở Thủ công
  await send("Page.navigate", { url: base + "/inventory?material=wax-beeswax" }); await sleep(2500);
  ok("nguyên liệu: link thẳng mở drawer", await ev(`!!document.querySelector('.ant-drawer-open section[aria-label="Tồn kho hiện tại"]')`), await loc());
  await ev(`document.querySelector('.ant-drawer-open .ant-drawer-close').click()`); await sleep(900);
  ok("nguyên liệu: đóng bỏ ?material=", !(await loc()).includes("material="), await loc());
  await ev(`[...document.querySelectorAll('main .ant-segmented-item')].find(t=>t.innerText.startsWith('Sắp hết')).click()`); await sleep(800);
  ok("nguyên liệu: đổi tab vẫn chạy", (await loc()).includes("status=low"), await loc());

  // Tìm kiếm header vẫn mở đúng drawer
  for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key: "k", code: "KeyK", modifiers: 2, windowsVirtualKeyCode: 75 });
  await sleep(500); await send("Input.insertText", { text: "welcome" }); await sleep(500);
  for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await sleep(1800);
  ok("tìm kiếm: mở mã giảm giá", (await title()).includes("WELCOME"), await loc());
  if (out) { const r = await send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(out + "/func-last.png", Buffer.from(r.data, "base64")); }
  await ev("localStorage.removeItem('bo-products-v2')");
});
