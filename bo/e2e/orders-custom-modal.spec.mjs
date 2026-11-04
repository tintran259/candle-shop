// E2E 14 — Popup tự phối cuộn trong thân, tiêu đề/chân cố định; dòng sản phẩm thẳng hàng
import { test } from "./support/harness.mjs";

test("E2E 14 — Popup tự phối cuộn trong thân, tiêu đề/chân cố định; dòng sản phẩm thẳng hàng", async ({ t }) => {
  const base = t.base;
  const { ev, sleep, shot, click, clickText, byText, go, ok } = t;
  const D = ".ant-drawer-open";
  const M = ".ant-modal-wrap .ant-modal";
  const R = "const r=e=>{if(!e)return null;const q=e.getBoundingClientRect();return {t:Math.round(q.top),b:Math.round(q.bottom),c:Math.round((q.top+q.bottom)/2),l:Math.round(q.left),r:Math.round(q.right)}};";
  const info = `(()=>{${R}const w=document.querySelector('.ant-modal-wrap');const m=document.querySelector('${M}');const b=m.querySelector('.ant-modal-body');return {win:innerHeight,wrapScroll:w.scrollHeight-w.clientHeight,title:r(m.querySelector('.ant-modal-title')),close:r(m.querySelector('.ant-modal-close')),footer:r(m.querySelector('.ant-modal-footer button.ant-btn-primary')),body:r(b),bodyScroll:b.scrollHeight-b.clientHeight,top:b.scrollTop,x:b.scrollWidth-b.clientWidth,aside:r(m.querySelector('aside.cfg-summary'))}})()`;
  const line = `(()=>{${R}const l=document.querySelector('${D} .order-line');return {thumb:r(l.querySelector('.order-line-thumb')),sel:r(l.querySelector('.ant-select')),qty:r(l.querySelector('.ant-input-number')),total:r(l.querySelector('.order-line-total')),del:r(l.querySelector('.order-line-remove'))}})()`;

  for (const [w, h] of [[1517, 930], [1280, 720], [1920, 1080], [390, 844]]) {
    await t.viewport(w, h, w < 500);
    await go(base + "/orders?order=new", 2800);
    await clickText(`${D} button`, "Nến có sẵn");
    await sleep(400);
    const l = await ev(line);
    if (w >= 576) {
      const centers = [l.thumb.c, l.sel.c, l.qty.c, (l.total.t + 4 + l.total.b) / 2, l.del.c];
      ok(`${w} Dòng sản phẩm cùng một đường`, Math.max(...centers) - Math.min(...centers) <= 1, centers.join(","));
    } else ok(`${w} Ảnh và ô chọn cùng tâm`, Math.abs(l.thumb.c - l.sel.c) <= 1, `${l.thumb.c},${l.sel.c}`);
    await shot(`c14-line-${w}.png`);

    await clickText(`${D} button`, "Tự phối nến");
    await sleep(900);
    const a = await ev(info);
    ok(`${w} Popup vừa màn hình, khung ngoài không cuộn`, a.wrapScroll <= 1 && a.title.t >= 0 && a.footer.b <= a.win, JSON.stringify(a));
    ok(`${w} Thân popup tự cuộn, không cuộn ngang`, a.bodyScroll > 0 && a.x <= 0, `${a.bodyScroll} x=${a.x}`);
    await shot(`c14-top-${w}.png`);
    // Con lăn chuột thật trong thân popup
    await t.send?.("Input.dispatchMouseEvent", { type: "mouseWheel", x: a.body.l + 120, y: a.body.t + 200, deltaX: 0, deltaY: 600 });
    await ev(`document.querySelector('${M} .ant-modal-body').scrollTop=600`);
    await sleep(400);
    const b = await ev(info);
    ok(`${w} Cuộn: tiêu đề, nút X, nút thêm đứng yên`, b.top > 0 && b.title.t === a.title.t && b.close.t === a.close.t && b.footer.t === a.footer.t, JSON.stringify({ top: b.top, title: b.title.t }));
    if (w >= 768) ok(`${w} Cuộn: tóm tắt dính trong thân`, b.aside.t >= b.body.t - 1 && b.aside.b <= b.body.b + 1, JSON.stringify({ aside: b.aside, body: b.body }));
    await shot(`c14-scroll-${w}.png`);
    // Bấm thêm khi thiếu: nhảy tới bước lỗi trong thân, không đẩy trang
    await click(byText(`${M} .ant-modal-footer button`, "Thêm vào đơn"));
    await sleep(900);
    const c = await ev(`(()=>{${R}const s=document.querySelector('${M} [role=alert]')?.closest('section');const b=document.querySelector('${M} .ant-modal-body');return {step:r(s),body:r(b)}})()`);
    ok(`${w} Báo thiếu: cuộn tới đúng bước`, c.step && c.step.t >= c.body.t - 1 && c.step.t < c.body.b, JSON.stringify(c));
    await sleep(200);
  }
  console.log("logs:", t.logs);
});
