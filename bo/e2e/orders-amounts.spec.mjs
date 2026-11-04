// E2E 18 — Tự phối nến: chọn nhiều sáp, chỉnh lượng từng nguyên liệu, lưu công thức trên đơn
import { SF_URL, test } from "./support/harness.mjs";

test("E2E 18 — Tự phối nến: chọn nhiều sáp, chỉnh lượng từng nguyên liệu, lưu công thức trên đơn", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const sf = SF_URL;
  const { ev, sleep, shot, click, clickText, byText, type, pick, text, go, ok, viewport, overflow } = t;
  const D = ".ant-drawer-open";
  const M = ".ant-modal-wrap .ant-modal";
  const orders = () => ev("JSON.parse(localStorage.getItem('bo-orders-v3')||'null')");
  const inv = () => ev("JSON.parse(localStorage.getItem('bo-inventory-v2')||'null')");
  const stock = async (id) => (await inv())?.materials.find((m) => m.id === id)?.stock;
  const option = (step, name) => `[...document.querySelectorAll('${M} #cfg-step-${step} .cfg-option')].find(b=>b.innerText.includes(${JSON.stringify(name)}))`;
  const placeholder = (name) => ev(`[...document.querySelectorAll('${M} input')].find(i=>i.getAttribute('aria-label')===${JSON.stringify("Lượng " + name)})?.placeholder`);
  const input = (name) => `[...document.querySelectorAll('${M} input')].find(i=>i.getAttribute('aria-label')===${JSON.stringify("Lượng " + name)})`;
  const needText = async () => (await text(`${M} .cfg-summary [role=listitem]`)).join(" | ");

  await go(base + "/", 1000);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  await go(base + "/orders?order=new", 2800);
  await clickText(`${D} button`, "Tự phối nến");
  await sleep(900);
  await click(option("container", "Hũ gốm"));
  await sleep(300);
  await click(`[...document.querySelectorAll('${M} #cfg-step-container .sf-chip')].find(c=>c.innerText.startsWith('150ml'))`);
  await click(option("wax", "Sáp đậu nành"));
  await sleep(300);
  const one = await placeholder("Sáp đậu nành");
  ok("A1 Chọn sáp thì hiện ô lượng, mặc định cả hũ", Number(one) > 0, one);
  await click(option("wax", "Sáp dừa"));
  await sleep(300);
  const checked = await ev(`[...document.querySelectorAll('${M} #cfg-step-wax .cfg-option[aria-checked=true]')].length`);
  ok("A2 Chọn được nhiều sáp", checked === 2, String(checked));
  const a = await placeholder("Sáp đậu nành");
  const b = await placeholder("Sáp dừa");
  ok("A3 Mặc định chia đều", Number(a) === Math.ceil(one / 2) && a === b, `${one} -> ${a}/${b}`);
  const defaults = await needText();
  ok("A4 Tóm tắt trừ theo mặc định", defaults.includes(`Sáp dừa`) && defaults.includes(`${a} /`), defaults);

  await type(input("Sáp đậu nành"), "100");
  await sleep(300);
  const after = await needText();
  ok("B1 Điền gram thì tóm tắt đổi theo", /Sáp đậu nành 100 \//.test(after) && new RegExp(`Sáp dừa ${b} /`).test(after), after);

  await click(option("fragrance", "Vanilla"));
  await sleep(200);
  await click(option("wick", "Bấc cotton"));
  await click(option("color", "Trắng kem"));
  await sleep(300);
  ok("B2 Mùi, bấc, màu cũng có ô lượng", !!(await placeholder("Vanilla")) && !!(await placeholder("Bấc cotton")) && !!(await placeholder("Trắng kem")));
  await type(input("Bấc cotton"), "2");
  await type(`document.querySelector('${M} #cfg-step-personalization input')`, "Sun");
  await sleep(300);
  await shot("d18-modal.png");
  await click(byText(`${M} .ant-modal-footer button`, "Thêm vào đơn"));
  await sleep(700);
  await pick(`document.querySelector('${D} input#customerId').closest('.ant-select')`, "Wing Sun", true);
  await sleep(300);
  await clickText(`${D} .ant-drawer-footer button`, "Tạo đơn");
  await sleep(1800);
  const o = (await orders())[0];
  const item = o.items[0];
  const r = (id) => item.recipe?.find((x) => x.materialId === id)?.quantity;
  ok("C1 Lưu công thức trên đơn", r("wax-soy") === 100 && r("wax-coconut") === Number(b) && r("wick-cotton") === 2, JSON.stringify(item.recipe));
  const detail = await ev(`document.querySelector('${D}').innerText`);
  ok("C2 Chi tiết đơn hiện công thức", detail.includes("Công thức 1 hũ") && detail.includes("Sáp đậu nành 100"), "");
  await shot("d18-detail.png");

  // Đơn đang mở: xác nhận tiền, giữ, bắt đầu làm rồi hủy đã làm để kiểm tra công thức theo đơn
  const wax0 = await stock("wax-soy") ?? 9000;
  if (o.status === "pending") { await clickText(`${D} section button`, "Xác nhận đã thanh toán"); await sleep(600); }
  await clickText(`${D} section button`, "Bắt đầu làm");
  await sleep(700);
  ok("D1 Trừ Kho đúng lượng đã điền", (await stock("wax-soy")) === wax0 - 100 && (await inv()).movements.some((m) => m.orderCode === o.code && m.materialId === "wick-cotton" && m.change === -2), `${wax0} -> ${await stock("wax-soy")}`);

  await viewport(390, 844, true);
  await go(base + "/orders?order=new", 2800);
  await clickText(`${D} button`, "Tự phối nến");
  await sleep(900);
  await click(option("wax", "Sáp đậu nành"));
  await click(option("wax", "Sáp dừa"));
  await sleep(300);
  await shot("d18-m.png");
  ok("M1 Điện thoại không tràn ngang", (await ev(`(()=>{const b=document.querySelector('${M} .ant-modal-body');return b.scrollWidth<=b.clientWidth+1})()`)));

  console.log(t.logs.length ? "LOGS:\n" + t.logs.slice(0, 5).join("\n") : "Không có lỗi console");
});
