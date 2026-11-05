// E2E 19 — Bỏ Sáp pha trộn trên bản lưu cũ, chọn nhiều sáp ở Thủ công, giá theo lượng gram và ml
import { SF_URL, fixture, test } from "./support/harness.mjs";
import fs from "node:fs";

test("E2E 19 — Bỏ Sáp pha trộn trên bản lưu cũ, chọn nhiều sáp ở Thủ công, giá theo lượng gram và ml", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const sf = SF_URL;
  const legacyFile = fixture("legacy-craft.json");
  const { ev, sleep, shot, click, clickText, byText, type, text, go, ok } = t;
  const D = ".ant-drawer-open";
  const M = ".ant-modal-wrap .ant-modal";
  const option = (step, name) => `[...document.querySelectorAll('${M} #cfg-step-${step} .cfg-option')].find(b=>b.innerText.includes(${JSON.stringify(name)}))`;
  const input = (name) => `[...document.querySelectorAll('${M} input')].find(i=>i.getAttribute('aria-label')===${JSON.stringify("Lượng " + name)})`;
  const price = async () => (await text(`${M} .ant-modal-footer button`)).join(" ");
  const box = () => ev(`document.querySelector('${M} #cfg-step-wax .cfg-box')?.innerText.replace(/\\s+/g,' ')`);

  // Bản lưu cũ: còn Sáp pha trộn, chưa bật chọn nhiều
  const old = JSON.parse(fs.readFileSync(legacyFile, "utf8"));
  const wax = old.steps.find((s) => s.id === "wax");
  wax.multiple = false;
  wax.options.push({ id: "blend", name: { vi: "Sáp pha trộn", en: "Wax blend" }, priceDelta: 10000, available: true, materialId: "wax-blend", swatch: "#f8f1e6" });
  // Giá theo lượng: sáp mỗi 100 g, tinh dầu mỗi ml
  const setUnit = (step, prices) => old.steps.find((s) => s.id === step).options.forEach((o) => prices[o.id] !== undefined && Object.assign(o, { priceDelta: 0, unitPrice: prices[o.id] }));
  setUnit("wax", { soy: 10000, coconut: 20000 });
  setUnit("fragrance", { vanilla: 1000, sandalwood: 2000 });
  await go(base + "/", 1000);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  await ev(`localStorage.setItem('bo-craft-builder-v5', ${JSON.stringify(JSON.stringify(old))})`);

  await go(base + "/craft", 3000);
  const page = await ev("document.querySelector('main').innerText");
  await clickText("main *[role=button], main button, main li, main a", "Sáp").catch(() => {});
  await sleep(700);
  const craft = await ev("document.querySelector('main').innerText");
  await shot("d19-craft.png");
  ok("A1 Thủ công không còn Sáp pha trộn", !page.includes("Sáp pha trộn") && !craft.includes("Sáp pha trộn"));
  ok("A1b Không còn cảnh báo lựa chọn đã xóa", !page.includes("không còn trong Sáp"));

  await go(base + "/orders?order=new", 2800);
  await clickText(`${D} button`, "Tự phối nến");
  await sleep(900);
  const waxNames = (await text(`${M} #cfg-step-wax .cfg-option`)).join(" | ");
  ok("A2 Tạo đơn không còn Sáp pha trộn", !waxNames.includes("pha trộn") && waxNames.includes("Sáp ong"), waxNames);

  await click(option("container", "Hũ gốm"));
  await sleep(300);
  await click(`[...document.querySelectorAll('${M} #cfg-step-container .sf-chip')].find(c=>c.innerText.startsWith('150ml'))`);
  await click(option("wax", "Sáp đậu nành"));
  await sleep(300);
  const single = await price();
  await click(option("wax", "Sáp dừa"));
  await sleep(300);
  ok("B1 Bản lưu cũ cũng chọn được nhiều sáp", (await ev(`[...document.querySelectorAll('${M} #cfg-step-wax .cfg-option[aria-checked=true]')].length`)) === 2);
  const even = await price();
  // Hũ gốm 150ml = 120 g sáp. Một loại: 120 g × 10.000/100 g; chia đều 60 g + 60 g
  ok("B2 Giá sáp theo lượng: 120 g đậu nành 12.000, chia đều 6.000 + 12.000", single.includes("512.000") && even.includes("518.000"), `${single} -> ${even}`);
  ok("B3 Hiện tỉ lệ từng loại", (await box()).includes("50%"), await box());
  await type(input("Sáp đậu nành"), "100");
  await type(input("Sáp dừa"), "60");
  await sleep(300);
  const ratio = await price();
  ok("B4 Điền 100 g + 60 g: 10.000 + 12.000", ratio.includes("522.000"), ratio);
  ok("B5 Hiện 63% và 37%", (await box()).includes("63%") && (await box()).includes("37%"), await box());

  await click(option("fragrance", "Vanilla"));
  await sleep(200);
  await click(option("fragrance", "Sandalwood"));
  await sleep(300);
  const half = await price();
  await type(input("Vanilla"), "9");
  await type(input("Sandalwood"), "1");
  await sleep(300);
  const ml = await price();
  const summary = await ev(`document.querySelector('${M} .cfg-summary').innerText`);
  ok("C0 Không có ô Tỉ lệ phối trùng với ô Lượng", !(await ev(`document.querySelector('${M} #cfg-step-fragrance').innerText`)).includes("Tỉ lệ phối"));
  await ev(`document.querySelector('#cfg-step-wax')?.scrollIntoView()`);
  await shot("d19-ratio.png");
  // 120 g × 8% = 9,6 ml: 4,8 ml mỗi mùi → 4.800 + 9.600; điền 9 ml + 1 ml → 9.000 + 2.000
  ok("C1 Mùi hương theo ml × giá mỗi ml", half.includes("536.400") && ml.includes("533.000"), `${half} -> ${ml}`);
  ok("C2 Mô tả gửi xưởng theo tỉ lệ ml", summary.includes("Vanilla 90%") && summary.includes("Sandalwood 10%"), summary.slice(0, 120));

  console.log(t.logs.length ? "LOGS:\n" + t.logs.slice(0, 5).join("\n") : "Không có lỗi console");
});
