// E2E 13 — Cột Xử lý luôn thấy đủ 2 nút ở mọi bề ngang có cột này
import { test } from "./support/harness.mjs";

test("E2E 13 — Cột Xử lý luôn thấy đủ 2 nút ở mọi bề ngang có cột này", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const { ev, shot, go, ok } = t;
  const KEY = "bo-cancelled-products-v4";
  await go(base + "/", 1000);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  const row = { id: "r", name: "Nến tự phối", custom: "Hũ thủy tinh hổ phách 200ml · Sáp đậu nành · Vanilla 70% + Lavender 30% · Bấc gỗ · Hoa khô", personalized: true, images: [], price: 1045000, quantity: 2, orderId: "ord-24", orderCode: "SC261013024", customerName: "Trương Văn Lực", cancelReason: "Khách không nghe máy khi giao, trả hàng về.", cancelledAt: new Date().toISOString(), status: "pending", updatedAt: new Date().toISOString() };
  await ev(`localStorage.setItem('${KEY}', ${JSON.stringify(JSON.stringify([row]))})`);
  const check = `(()=>{const r=document.querySelector('.ant-table-tbody tr.ant-table-row');const b=[...r.querySelectorAll('button')];const box=document.querySelector('.ant-table-container').getBoundingClientRect();return {n:b.length,inside:b.every(x=>{const q=x.getBoundingClientRect();return q.left>=box.left-1&&q.right<=box.right+1&&q.width>0}),right:Math.round(box.right),last:Math.round(b.at(-1)?.getBoundingClientRect().right??0),page:document.documentElement.scrollWidth<=innerWidth,noScroll:(()=>{const c=document.querySelector('.ant-table-content');return c.scrollWidth<=c.clientWidth})(),status:!!r.innerText.includes('Chờ xử lý')}})()`;
  for (const w of [1920, 1600, 1440, 1280, 1200, 1024, 800, 768, 390]) {
    await t.viewport(w, 900);
    await go(base + "/cancelled-products", 2300);
    const m = await ev(check);
    ok(`${w}: đủ nút, thấy trạng thái, không cuộn ngang`, m.n === (w >= 992 ? 2 : 0) && m.inside && m.page && m.noScroll && m.status, JSON.stringify(m));
    await shot(`c13-${w}.png`);
    if (w < 992) {
      await go(`${base}/cancelled-products?item=r`, 2300);
      const foot = (await t.text(".ant-drawer-open .ant-drawer-footer button")).join(" | ");
      ok(`${w}: drawer có đủ 2 nút`, foot.includes("Bỏ") && foot.includes("Tạo sản phẩm trưng bày"), foot);
    }
  }
  console.log("logs:", t.logs);
});
