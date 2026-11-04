// E2E 3 — các lỗi admin báo: nút + mở đúng nguyên liệu, layout "Dùng trên web", ảnh ưu tiên hơn màu
import { SF_URL, test } from "./support/harness.mjs";
import fs from "node:fs";

test("E2E 3 — các lỗi admin báo: nút + mở đúng nguyên liệu, layout \"Dùng trên web\", ảnh ưu tiên hơn màu", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const sf = SF_URL;
  const { ev, sleep, shot, click, clickText, text, go, ok, press } = t;
  await go(base + "/", 1000);
  await ev("['bo-inventory-v2','bo-craft-builder-v5','bo-craft-builder-v5-draft'].forEach(k=>localStorage.removeItem(k))");

  // F1: nút + trên từng dòng mở modal đúng nguyên liệu, kể cả mở lại liên tiếp
  await go(base + "/inventory", 2500);
  const selected = () => ev(`document.querySelector('.ant-modal input#materialId')?.closest('.ant-select')?.innerText.split('\\n')[0]`);
  const rowName = (i) => ev(`document.querySelectorAll('main .ant-table-row')[${i}].querySelector('a,.ant-typography').innerText`);
  for (const i of [0, 3, 5, 3]) {
    await click(`document.querySelectorAll('main .ant-table-row button[aria-label^="Nhập thêm"]')[${i}]`);
    await sleep(800);
    const name = await rowName(i);
    const got = await selected();
    ok(`F1 + dòng ${i + 1} mở đúng "${name}"`, got === name, got);
    await press("Escape", "Escape", 27);
    await sleep(900);
  }
  await clickText("main button", "Phiếu kho");
  await sleep(800);
  const blank = await ev(`document.querySelector('.ant-modal input#materialId').closest('.ant-select').querySelector('.ant-select-selection-item, .ant-select-content-value')?.innerText ?? ''`);
  ok("F1 'Phiếu kho' mở trống (không giữ nguyên liệu cũ)", !blank, blank);
  await press("Escape", "Escape", 27);
  await sleep(900);

  // F2: dòng "Dùng trên web" nằm gọn trong thẻ
  await go(base + "/inventory?material=dye-pastel-pink", 2500);
  const r = await ev(`(()=>{const a=document.querySelector('.ant-drawer-open a.list-row-button');let sec=a.parentElement;while(sec&&!(getComputedStyle(sec).borderRadius!=='0px'&&getComputedStyle(sec).backgroundColor==='rgb(255, 255, 255)'))sec=sec.parentElement;const ra=a.getBoundingClientRect(),rs=sec.getBoundingClientRect();return {rowLeft:Math.round(ra.left),rowRight:Math.round(ra.right),secLeft:Math.round(rs.left),secRight:Math.round(rs.right)}})()`);
  ok("F2 dòng 'Dùng trên web' nằm trong thẻ", r.rowRight <= r.secRight && r.rowLeft >= r.secLeft, JSON.stringify(r));
  const p = await ev(`(()=>{const a=document.querySelector('.ant-drawer-open a.list-row-button');a.scrollIntoView({block:'center'});const r=a.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
  await t.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y });
  await sleep(300);
  await shot("f2-usage-hover.png");

  // F3: lựa chọn có ảnh → ưu tiên ảnh hơn màu (gắn ảnh vào bản nháp; phần upload đã test riêng)
  const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAFklEQVR4nGNgYGD4z0AEYBxVSF+FAP5FAhRrcyRTAAAAAElFTkSuQmCC";
  await go(base + "/craft?step=color", 2600);
  await clickText("main button", "Cấu hình mẫu"); await sleep(300);
  await clickText(".ant-popover:not(.ant-popover-hidden) button", "Dùng mẫu"); await sleep(500);
  await ev(`(()=>{const c=JSON.parse(localStorage.getItem('bo-craft-builder-v5-draft'))||JSON.parse(localStorage.getItem('bo-craft-builder-v5'));const st=c.steps.find(s=>s.id==='color');st.options.find(o=>o.id==='sage').images=[${JSON.stringify(png)}];localStorage.setItem('bo-craft-builder-v5-draft',JSON.stringify(c))})()`);
  await go(base + "/craft?step=color&edit=sage", 2800);
  const colorHint = (await text(".ant-drawer-open section")).find((x) => x.includes("Màu hiển thị"));
  ok("F3 drawer nói rõ: có ảnh thì web hiện ảnh", colorHint?.toLowerCase().includes("web hiện ảnh"), colorHint?.slice(-140));
  await shot("f3-drawer.png");
  await clickText(".ant-drawer-open .ant-drawer-footer button", "Áp dụng");
  await sleep(900);
  await go(base + "/craft?step=color&view=preview", 2600);
  const dot = await ev(`[...document.querySelectorAll('.sf-swatch')].find(b=>b.innerText.includes('Xanh sage')).querySelector('.sf-dot').style.background`);
  ok("F3 xem trước bảng màu: hiện ảnh thay vì màu", dot.includes("url("), dot.slice(0, 50));
  await shot("f3-preview.png");
  await go(base + "/craft?step=color", 2600);
  const avatar = await ev(`[...document.querySelectorAll('main .ant-table-row')].find(r=>r.innerText.includes('Xanh sage')).querySelector('.ant-avatar img')?.getAttribute('src')?.slice(0,22)`);
  ok("F3 bảng lựa chọn: avatar dùng ảnh", !!avatar, avatar);
  console.log("logs:", t.logs);
});
