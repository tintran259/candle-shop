// E2E 20 — Hương và màu tính giá theo ml, màu sáp chọn nhiều, cài đặt Chọn 1 / Chọn nhiều ở Thủ công
import { SF_URL, fixture, test } from "./support/harness.mjs";
import fs from "node:fs";

test("E2E 20 — Hương và màu tính giá theo ml, màu sáp chọn nhiều, cài đặt Chọn 1 / Chọn nhiều ở Thủ công", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const sf = SF_URL;
  const cfgFile = fixture("legacy-craft-2.json");
  const invFile = fixture("legacy-inventory.json");
  const { ev, sleep, shot, click, clickText, byText, type, text, go, ok } = t;
  const D = ".ant-drawer-open";
  const M = ".ant-modal-wrap .ant-modal";
  const option = (step, name) => `[...document.querySelectorAll('${M} #cfg-step-${step} .cfg-option')].find(b=>b.innerText.includes(${JSON.stringify(name)}))`;
  const input = (name) => `[...document.querySelectorAll('${M} input')].find(i=>i.getAttribute('aria-label')===${JSON.stringify("Lượng " + name)})`;
  const price = async () => (await text(`${M} .ant-modal-footer button`)).join(" ");
  const summary = () => ev(`document.querySelector('${M} .cfg-summary').innerText.replace(/\\s+/g,' ')`);
  const stepBox = (s) => ev(`document.querySelector('${M} #cfg-step-${s} .cfg-box:last-of-type')?.innerText.replace(/\\s+/g,' ')`);
  const checked = (s) => ev(`[...document.querySelectorAll('${M} #cfg-step-${s} .cfg-option[aria-checked=true]')].map(b=>b.innerText.split('\\n')[0])`);

  // Bản lưu cũ trên trình duyệt: chưa có phụ thu hương, màu chọn 1, màu nhuộm tính theo cái
  const cfg = JSON.parse(fs.readFileSync(cfgFile, "utf8"));
  const inv = JSON.parse(fs.readFileSync(invFile, "utf8"));
  const frag = cfg.steps.find((s) => s.id === "fragrance");
  delete frag.scentPrice;
  const color = cfg.steps.find((s) => s.id === "color");
  delete color.multiple;
  delete color.gramsPerGram;
  for (const o of color.options) delete o.exclusive;
  for (const m of inv.materials) if (m.category === "dye") m.unit = "pcs";
  // Giá theo lượng: mỗi ml
  const setUnit = (step, prices) => cfg.steps.find((s) => s.id === step).options.forEach((o) => prices[o.id] !== undefined && Object.assign(o, { priceDelta: 0, unitPrice: prices[o.id] }));
  setUnit("fragrance", { vanilla: 1000 });
  setUnit("color", { cream: 2000, beige: 5000 });

  await go(base + "/", 1000);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  await ev(`localStorage.setItem('bo-craft-builder-v5', ${JSON.stringify(JSON.stringify(cfg))})`);
  await ev(`localStorage.setItem('bo-inventory-v2', ${JSON.stringify(JSON.stringify(inv))})`);

  const openModal = async () => {
    await go(base + "/orders?order=new", 2800);
    await clickText(`${D} button`, "Tự phối nến");
    await sleep(900);
    await click(option("container", "Hũ gốm"));
    await sleep(300);
    await click(`[...document.querySelectorAll('${M} #cfg-step-container .sf-chip')].find(c=>c.innerText.startsWith('150ml'))`);
    await sleep(200);
  };
  await openModal();
  const noScent = await price();
  await click(option("fragrance", "Vanilla"));
  await sleep(300);
  const atStd = await price();
  // Hũ gốm 150ml = 120 g sáp × 8% = 9,6 ml × 1.000 ₫/ml
  ok("A1 Hương tính theo ml: 9,6 ml × 1.000", noScent.includes("500.000") && atStd.includes("509.600"), `${noScent} -> ${atStd}`);
  await type(input("Vanilla"), "12");
  await sleep(300);
  ok("A2 Điền 12 ml → 12.000", (await price()).includes("512.000"), await price());
  await type(input("Vanilla"), "18");
  await sleep(300);
  const over = await price();
  ok("A3 Điền 18 ml → 18.000, không còn phụ thu hương theo mức chuẩn", over.includes("518.000"), over);
  ok("A4 Tóm tắt ghi lượng hương", (await summary()).includes("Vanilla 18 ml"), (await summary()).slice(0, 200));
  await click(option("fragrance", "Không mùi"));
  await sleep(300);
  ok("A5 Không mùi thì không tính tiền hương", (await price()).includes("500.000"), await price());
  await click(option("fragrance", "Không mùi"));
  await sleep(200);

  await click(option("color", "Trắng kem"));
  await sleep(200);
  await click(option("color", "Be"));
  await sleep(300);
  ok("B1 Chọn được nhiều màu (bản lưu cũ)", (await checked("color")).length === 2, (await checked("color")).join());
  const box = await stepBox("color");
  ok("B2 Màu tính theo ml, có tỉ lệ", /ml/.test(box) && !/cái/.test(box) && box.includes("50%"), box);
  // 120 g × 1 ml/100 g = 1,2 ml chia đều: 0,6 ml × 2.000 + 0,6 ml × 5.000
  ok("B3 Màu theo ml: 1.200 + 3.000", (await price()).includes("504.200"), await price());
  await shot("d20-color.png");
  await click(option("color", "Không màu"));
  await sleep(300);
  ok("B4 Không màu bỏ các màu khác", (await checked("color")).join() === "Không màu", (await checked("color")).join());

  // Kho: màu nhuộm thành ml
  await go(base + "/inventory", 3500);
  await type("document.querySelector('input[placeholder^=\"Tên hoặc mã\"]')", "Màu nhuộm");
  await sleep(900);
  const invText = await ev("document.querySelector('main table').innerText");
  ok("C1 Kho hiện màu nhuộm theo ml, giữ số", invText.includes("200 ml") && !/\d cái/.test(invText), invText.slice(0, 120));

  // Thủ công: Chọn 1 / Chọn nhiều
  await go(base + "/craft", 3000);
  await clickText("main *", "Màu sáp", false).catch(() => {});
  const stepBtn = `[...document.querySelectorAll('main li, main [role=button], main button, main div')].filter(e=>e.innerText&&e.innerText.startsWith('Màu sáp')&&e.innerText.length<60).pop()`;
  await click(stepBtn);
  await sleep(500);
  await clickText("main .ant-tabs-tab", "Cài đặt");
  await sleep(500);
  const page = await ev("document.querySelector('main').innerText");
  ok("D1 Có cài đặt Số lựa chọn", page.includes("Số lựa chọn") && page.includes("Chọn nhiều"));
  await shot("d20-settings.png");
  await clickText("main .ant-radio-button-wrapper", "Chọn 1");
  await sleep(400);
  await clickText("main button", "Lưu thay đổi");
  await sleep(900);
  const confirm = await ev("!!document.querySelector('.ant-modal-confirm-btns')");
  if (confirm) { await click(`[...document.querySelectorAll('.ant-modal-confirm-btns button')].pop()`); await sleep(800); }
  await openModal();
  await click(option("color", "Trắng kem"));
  await sleep(200);
  await click(option("color", "Be"));
  await sleep(300);
  ok("D2 Đặt Chọn 1 thì popup chỉ chọn 1 màu", (await checked("color")).join() === "Be", (await checked("color")).join());

  // Thủ công: phụ thu hương
  await go(base + "/craft", 3000);
  const frBtn = stepBtn.replace("Màu sáp", "Mùi hương").replace("Màu sáp", "Mùi hương");
  await click(frBtn);
  await sleep(500);
  await clickText("main .ant-tabs-tab", "Cài đặt");
  await sleep(500);
  const fr = await ev("document.querySelector('main').innerText");
  ok("D3 Mùi hương không còn Phụ thu hương, độ đậm chỉ còn tỉ lệ", !fr.includes("Phụ thu hương") && fr.includes("Cho chọn độ đậm"));
  await shot("d20-scent.png", true);

  console.log(t.logs.length ? "LOGS:\n" + t.logs.slice(0, 5).join("\n") : "Không có lỗi console");
});
