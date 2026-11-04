// E2E 21 — Thủ công: Chọn 1 / 2 / nhiều cho mọi bước; Trang trí chọn nhiều
import { fixture, test } from "./support/harness.mjs";
import fs from "node:fs";

test("E2E 21 — Thủ công: Chọn 1 / 2 / nhiều cho mọi bước; Trang trí chọn nhiều", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const cfgFile = fixture("legacy-craft-2.json");
  const { ev, sleep, shot, click, clickText, go, ok, text } = t;
  const D = ".ant-drawer-open";
  const M = ".ant-modal-wrap .ant-modal";
  const option = (step, name) => `[...document.querySelectorAll('${M} #cfg-step-${step} .cfg-option')].find(b=>b.innerText.includes(${JSON.stringify(name)}))`;
  const checked = (s) => ev(`[...document.querySelectorAll('${M} #cfg-step-${s} .cfg-option[aria-checked=true]')].map(b=>b.innerText.split('\\n')[0])`);
  const stepBtn = (n) => `[...document.querySelectorAll('main li, main [role=button], main button, main div')].filter(e=>e.innerText&&e.innerText.startsWith(${JSON.stringify(n)})&&e.innerText.length<60).pop()`;
  const radios = () => text("main .ant-radio-button-wrapper");
  const openModal = async () => {
    await go(base + "/orders?order=new", 2800);
    await clickText(`${D} button`, "Tự phối nến");
    await sleep(900);
  };

  // Bản lưu cũ: Trang trí chọn 1, Không trang trí chưa đứng riêng
  const cfg = JSON.parse(fs.readFileSync(cfgFile, "utf8"));
  const dec = cfg.steps.find((s) => s.id === "decoration");
  dec.multiple = false;
  for (const o of dec.options) delete o.exclusive;
  await go(base + "/", 1000);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  await ev(`localStorage.setItem('bo-craft-builder-v5', ${JSON.stringify(JSON.stringify(cfg))})`);

  await openModal();
  await click(option("decoration", "Hoa khô"));
  await sleep(200);
  await click(option("decoration", "Họa tiết"));
  await sleep(200);
  await click(option("decoration", "Topping"));
  await sleep(300);
  ok("A1 Trang trí chọn nhiều (bản lưu cũ)", (await checked("decoration")).length === 3, (await checked("decoration")).join());
  await click(option("decoration", "Không trang trí"));
  await sleep(300);
  ok("A2 Không trang trí bỏ các mục khác", (await checked("decoration")).join() === "Không trang trí", (await checked("decoration")).join());

  await go(base + "/craft", 3000);
  await click(stepBtn("Trang trí"));
  await sleep(500);
  await clickText("main .ant-tabs-tab", "Cài đặt");
  await sleep(500);
  const r = (await radios()).join(" | ");
  ok("B1 Có Tối đa, Chọn 1, Chọn nhiều, không còn Chọn 2", r.includes("Chọn 1") && !r.includes("Chọn 2") && r.includes("Chọn nhiều") && (await ev("!!document.querySelector('main input[aria-label=\"Chọn tối đa\"]')")), r);
  await t.type("document.querySelector('main input[aria-label=\"Chọn tối đa\"]')", "2");
  await sleep(400);
  await shot("d21-settings.png");
  await clickText("main button", "Lưu thay đổi");
  await sleep(900);
  if (await ev("!!document.querySelector('.ant-modal-confirm-btns')")) { await click(`[...document.querySelectorAll('.ant-modal-confirm-btns button')].pop()`); await sleep(800); }
  await openModal();
  await click(option("decoration", "Hoa khô"));
  await sleep(200);
  await click(option("decoration", "Họa tiết"));
  await sleep(200);
  await click(option("decoration", "Topping"));
  await sleep(300);
  const two = await checked("decoration");
  ok("B2 Chọn 2 thì giữ tối đa 2 mục", two.length === 2 && two.join().includes("Topping"), two.join());

  // Bước tạo mới
  await go(base + "/craft", 3000);
  await clickText("main button", "Thêm bước");
  await sleep(700);
  await shot("d21-add.png");
  const dialog = await ev("document.querySelector('.ant-modal-wrap .ant-modal, .ant-drawer-open')?.innerText.replace(/\\s+/g,' ').slice(0,200)");
  console.log("dialog:", dialog);
  await clickText(".ant-modal-wrap button, .ant-modal-wrap [role=radio], .ant-modal-wrap label, .ant-drawer-open button", "Thẻ lựa chọn");
  await sleep(500);
  await t.type(`document.querySelector('.ant-modal-wrap:not([style*=none]) input[type=text], .ant-modal-wrap:not([style*=none]) input:not([type])')`, "Bước thử").catch((e) => console.log("name:", e.message));
  await sleep(300);
  const confirmBtn = await ev(`[...document.querySelectorAll('.ant-modal-footer button, .ant-drawer-footer button')].map(b=>b.innerText).join('|')`);
  console.log("buttons:", confirmBtn);
  if (confirmBtn) { await click(`[...document.querySelectorAll('.ant-modal-footer button, .ant-drawer-footer button')].pop()`); await sleep(800); }
  await clickText("main .ant-tabs-tab", "Cài đặt").catch((e) => console.log(e.message));
  await sleep(500);
  await shot("d21-new.png");
  console.log("errors:", (await text(".ant-form-item-explain-error")).join());
  const n = (await radios()).join(" | ");
  ok("C1 Bước mới có Số lựa chọn, mặc định Chọn 1, Tối đa khóa ở 1", n.includes("Chọn nhiều") && (await text("main .ant-radio-button-wrapper-checked")).join().includes("Chọn 1") && (await ev("(()=>{const i=document.querySelector('main input[aria-label=\"Chọn tối đa\"]');return i.disabled&&i.value==='1'})()")), n);

  console.log(t.logs.length ? "LOGS:\n" + t.logs.slice(0, 5).join("\n") : "Không có lỗi console");
});
