// E2E 22 — Sửa lựa chọn ở Thủ công không làm mất cờ Đứng một mình
import { test } from "./support/harness.mjs";

test("E2E 22 — Sửa lựa chọn ở Thủ công không làm mất cờ Đứng một mình", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const { ev, sleep, clickText, go, ok } = t;
  const D = ".ant-drawer-open";

  await go(base + "/", 1000);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  await go(`${base}/craft?step=color&view=options&edit=natural`, 3200);
  const drawer = await ev(`document.querySelector('${D}')?.innerText ?? ''`);
  ok("A1 Drawer có công tắc Đứng một mình, đang bật", drawer.includes("Đứng một mình") && (await ev(`[...document.querySelectorAll('${D} button[role=switch]')].some(b=>b.getAttribute('aria-checked')==='true')`)), drawer.slice(0, 80));
  const footer = await ev(`[...document.querySelectorAll('${D} .ant-drawer-footer button')].map(b=>b.innerText).join('|')`);
  console.log("footer:", footer);
  await ev(`document.querySelector('${D} input')?.focus()`);
  await t.type(`[...document.querySelectorAll('${D} input')].find(i=>i.value==='Không màu')`, "Không nhuộm");
  await sleep(300);
  await t.click(`[...document.querySelectorAll('${D} .ant-drawer-footer button')].pop()`);
  await sleep(900);
  const raw = await ev("localStorage.getItem('bo-craft-builder-v5-draft')");
  const color = JSON.parse(raw ?? "{}").steps?.find((s) => s.id === "color");
  const o = color?.options.find((x) => x.id === "natural");
  ok("A2 Sửa tên vẫn giữ Đứng một mình", o?.name.vi === "Không nhuộm" && o?.exclusive === true, JSON.stringify(o ?? {}).slice(0, 120));

  console.log(t.logs.length ? "LOGS:\n" + t.logs.slice(0, 5).join("\n") : "Không có lỗi console");
});
