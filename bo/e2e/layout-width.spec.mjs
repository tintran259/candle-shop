// E2E 11 — Nội dung và skeleton full width ở màn rộng, không tràn ngang
import { test } from "./support/harness.mjs";

test("E2E 11 — Nội dung và skeleton full width ở màn rộng, không tràn ngang", async ({ t }) => {
  const base = t.base;
  const { ev, sleep, shot, go, ok } = t;
  const pages = ["/", "/orders", "/products", "/cancelled-products", "/craft", "/inventory", "/customers", "/discounts", "/reviews", "/settings"];
  // Bề ngang khối nội dung: khoảng cách từ mép trái khối đầu tiên tới mép phải cửa sổ
  const measure = `(()=>{const h=document.querySelector('h3, h1, h4');const root=document.querySelector('.ant-layout-content, .shell-content');if(!root)return null;const r=root.getBoundingClientRect();const cs=getComputedStyle(root);const inner=root.firstElementChild?.getBoundingClientRect();return {root:Math.round(r.width),inner:inner?Math.round(inner.width):0,pad:Math.round(parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight)),scroll:document.documentElement.scrollWidth,win:innerWidth}})()`;

  for (const w of [1920, 2560]) {
    await t.viewport(w, 1000);
    for (const p of pages) {
      await go(base + p, 2200);
      const m = await ev(measure);
      ok(`${w} ${p}`, m && m.inner === m.root - m.pad && m.scroll <= m.win, JSON.stringify(m));
    }
  }
  await t.viewport(1920, 1000);
  await go(base + "/orders", 2200);
  await shot("c11-1-orders.png");

  // Skeleton: chụp ngay khi trang đang tải dữ liệu (độ trễ giả lập 400ms)
  // Chờ tới khi khung tải hiện ra (không đo ở một mốc thời gian cố định) rồi đo ngay
  await t.send("Page.navigate", { url: base + "/cancelled-products" });
  let busy = false;
  for (let i = 0; i < 80 && !busy; i++) {
    busy = await ev(`!!document.querySelector('.ant-skeleton, .skel-bar, [aria-busy=true]')`).catch(() => false);
    if (!busy) await sleep(15);
  }
  const s = await ev(measure);
  ok("S1 Skeleton full width", busy && s && s.inner === s.root - s.pad, JSON.stringify({ busy, ...s }));
  await shot("c11-2-skeleton.png");
  console.log("logs:", t.logs);
});
