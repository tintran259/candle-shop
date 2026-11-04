// Kiểm tra trang Khách hàng
import { test } from "./support/harness.mjs";
import fs from "node:fs";

test("Kiểm tra trang Khách hàng", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const out = t.out;
  const send = t.send;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const ev = async (expression) => (await send("Runtime.evaluate", { returnByValue: true, awaitPromise: true, expression })).result?.value;
  const shot = async (name) => { const r = await send("Page.captureScreenshot", { format: "png" }); fs.writeFileSync(out + "/" + name, Buffer.from(r.data, "base64")); };
  const loc = () => ev("location.pathname + location.search");
  const title = () => ev(`(()=>{const t=document.querySelector('.ant-drawer-open .ant-drawer-body h4');return t?t.textContent:'đóng'})()`);
  const ok = t.ok;
  const rows = () => ev(`[...document.querySelectorAll('main tr.ant-table-row')].map(r=>r.innerText.split(String.fromCharCode(10)).filter(Boolean).slice(0,6).join(' | '))`);
  const seg = async (label) => { await ev(`[...document.querySelectorAll('main .ant-segmented-item')].find(x=>x.innerText.startsWith(${JSON.stringify(label)})).click()`); await sleep(400); };

  await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: base + "/" }); await sleep(2000);
  await ev("['bo-customers-v1','bo-orders-v3'].forEach(k=>localStorage.removeItem(k))");
  await send("Page.navigate", { url: base + "/customers" }); await sleep(3000);
  console.log("stats:", await ev(`[...document.querySelectorAll('main .ant-row')[0].querySelectorAll('.ant-card')].map(c=>c.innerText.split(String.fromCharCode(10)).join(' / '))`));
  console.log("segments:", await ev(`[...document.querySelectorAll('main .ant-segmented-item')].map(x=>x.innerText).join(', ')`));
  console.log("rows:\n  " + (await rows()).join("\n  "));
  await shot("cus-1-list.png");

  for (const s of ["VIP", "Lâu chưa mua", "Chưa mua", "Đã chặn"]) { await seg(s); console.log(`[${s}]`, (await rows()).map((r) => r.split(" | ")[1] ?? r).join(", ")); }
  await seg("Tất cả");
  await ev(`(()=>{const i=document.querySelector('main input[aria-label="Tìm khách hàng"]');const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(i,'ngoc');i.dispatchEvent(new Event('input',{bubbles:true}))})()`); await sleep(400);
  console.log("q=ngoc:", (await rows()).map((r) => r.split(" | ")[1]).join(", "));
  await ev(`(()=>{const i=document.querySelector('main input[aria-label="Tìm khách hàng"]');const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(i,'900');i.dispatchEvent(new Event('input',{bubbles:true}))})()`); await sleep(400);
  console.log("q=900:", (await rows()).map((r) => r.split(" | ")[1]).join(", "));
  await ev(`[...document.querySelectorAll('main button')].find(b=>b.innerText.includes('Xóa lọc')).click()`); await sleep(400);

  // Mở hồ sơ VIP
  await ev(`(()=>{const i=document.querySelector('main input[aria-label="Tìm khách hàng"]');const s=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;s.call(i,'vy');i.dispatchEvent(new Event('input',{bubbles:true}))})()`); await sleep(400);
  await ev(`[...document.querySelectorAll('main tr.ant-table-row')].find(r=>r.innerText.includes('Ngô Thanh Vy')).click()`); await sleep(1500);
  ok("mở hồ sơ", (await title()) === "Ngô Thanh Vy", await loc());
  console.log("  tổng quan:", await ev(`document.querySelector('.ant-drawer-open section[aria-label="Tổng quan"]').innerText.split(String.fromCharCode(10)).join(' / ')`));
  console.log("  đơn:", await ev(`[...document.querySelectorAll('.ant-drawer-open .list-row-button')].map(b=>b.innerText.split(String.fromCharCode(10)).slice(0,2).join(' ')).join(' ; ')`));
  await shot("cus-2-drawer.png");
  // Lưu nhãn & ghi chú
  await ev(`(()=>{const t=document.querySelector('.ant-drawer-open textarea[aria-label="Ghi chú nội bộ"]');const s=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;s.call(t,'Ghi chú thử');t.dispatchEvent(new Event('input',{bubbles:true}))})()`); await sleep(300);
  await ev(`[...document.querySelectorAll('.ant-drawer-open button')].find(b=>b.innerText.trim()==='Lưu').click()`); await sleep(500);
  ok("lưu ghi chú", (await ev(`JSON.parse(localStorage.getItem('bo-customers-v1')).find(c=>c.name==='Ngô Thanh Vy').note`)) === "Ghi chú thử");
  // Chặn
  await ev(`[...document.querySelectorAll('.ant-drawer-open button')].find(b=>b.innerText.includes('Chặn đặt hàng')).click()`); await sleep(600);
  await ev(`(()=>{const t=document.querySelector('.ant-modal textarea');const s=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;s.call(t,'Thử chặn');t.dispatchEvent(new Event('input',{bubbles:true}))})()`); await sleep(200);
  await ev(`[...document.querySelectorAll('.ant-modal button')].find(b=>b.innerText.includes('Chặn khách')).click()`); await sleep(800);
  ok("chặn khách hiện cảnh báo", await ev(`!!document.querySelector('.ant-drawer-open .ant-alert-error')`));
  await ev(`[...document.querySelectorAll('.ant-drawer-open .ant-alert button')].find(b=>b.innerText.includes('Bỏ chặn')).click()`); await sleep(500);
  ok("bỏ chặn", !(await ev(`!!document.querySelector('.ant-drawer-open .ant-alert-error')`)));
  // Bấm đơn trong hồ sơ → sang trang đơn
  await ev(`document.querySelector('.ant-drawer-open .list-row-button').click()`); await sleep(2000);
  ok("bấm đơn → mở đơn", (await loc()).startsWith("/orders?") && (await loc()).includes("order="), await loc());
  // Từ drawer đơn → hồ sơ khách
  await ev(`[...document.querySelectorAll('.ant-drawer-open a')].find(a=>a.innerText.includes('Hồ sơ')).click()`); await sleep(2000);
  ok("drawer đơn → hồ sơ khách", (await title()) === "Ngô Thanh Vy", await loc());
  await ev(`document.querySelector('.ant-drawer-open .ant-drawer-close').click()`); await sleep(900);
  ok("đóng hồ sơ bỏ ?customer=", !(await loc()).includes("customer="), await loc());
  // Link sai
  await send("Page.navigate", { url: base + "/customers?customer=khong-co" }); await sleep(3000);
  ok("link sai báo không tìm thấy", await ev(`!!document.querySelector('.ant-drawer-open .ant-result-404')`));
  // Tìm trên header
  await send("Page.navigate", { url: base + "/" }); await sleep(2500);
  for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key: "k", code: "KeyK", modifiers: 2, windowsVirtualKeyCode: 75 });
  await sleep(500); await send("Input.insertText", { text: "bao" }); await sleep(600);
  console.log("search bao:", await ev(`[...document.querySelectorAll('.search-row')].map(r=>r.innerText.split(String.fromCharCode(10)).join(' | ')).join(' ;; ')`));
  await ev(`[...document.querySelectorAll('.search-row')].find(r=>r.innerText.startsWith('Bùi Quốc Bảo')).click()`); await sleep(2500);
  ok("tìm kiếm → hồ sơ", (await title()) === "Bùi Quốc Bảo", await loc());
  await shot("cus-3-atrisk.png");
  // Mobile
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send("Page.navigate", { url: base + "/customers" }); await sleep(3000);
  console.log("mobile scrollWidth:", await ev("document.documentElement.scrollWidth"));
  await shot("cus-4-mobile.png");
  await send("Page.navigate", { url: base + "/customers?customer=cus-001122" }); await sleep(3000);
  console.log("mobile drawer scrollWidth:", await ev("document.querySelector('.ant-drawer-open .ant-drawer-body').scrollWidth"), "/", await ev("document.querySelector('.ant-drawer-open .ant-drawer-body').clientWidth"));
  await shot("cus-5-mobile-drawer.png");
});
