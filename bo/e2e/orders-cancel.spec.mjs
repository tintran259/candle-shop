// E2E 9 — Bắt đầu làm trừ kho; hủy đơn đang làm hỏi đã làm chưa: chưa → hoàn kho, rồi → hàng có sẵn
import { SF_URL, test } from "./support/harness.mjs";

test("E2E 9 — Bắt đầu làm trừ kho; hủy đơn đang làm hỏi đã làm chưa: chưa → hoàn kho, rồi → hàng có sẵn", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const sf = SF_URL;
  const { ev, sleep, shot, click, clickText, byText, type, pick, text, go, ok } = t;
  const D = ".ant-drawer-open";
  const M = ".ant-modal-wrap .ant-modal";
  const orders = () => ev("JSON.parse(localStorage.getItem('bo-orders-v3')||'null')");
  const inv = () => ev("JSON.parse(localStorage.getItem('bo-inventory-v2')||'null')");
  const wax = async () => (await inv())?.materials.find((m) => m.name === "Sáp đậu nành").stock ?? 9000;
  const option = (step, name) => `[...document.querySelectorAll('${M} #cfg-step-${step} .cfg-option')].find(b=>b.innerText.includes(${JSON.stringify(name)}))`;

  await go(base + "/", 1000);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  await go(base + "/orders?order=new", 2800);

  // Tạo 1 đơn tự phối qua giao diện
  await clickText(`${D} button`, "Tự phối nến");
  await sleep(900);
  await click(option("container", "Hũ gốm"));
  await sleep(300);
  await click(`[...document.querySelectorAll('${M} #cfg-step-container .sf-chip')].find(c=>c.innerText.startsWith('150ml'))`);
  await click(option("wax", "Sáp đậu nành"));
  await click(option("fragrance", "Vanilla"));
  await sleep(200);
  await click(option("wick", "Bấc cotton"));
  await click(option("color", "Trắng kem"));
  await type(`document.querySelector('${M} #cfg-step-personalization input')`, "Sun");
  await sleep(300);
  await click(byText(`${M} .ant-modal-footer button`, "Thêm vào đơn"));
  await sleep(700);
  await pick(`document.querySelector('${D} input#customerId').closest('.ant-select')`, "Wing Sun", true);
  await sleep(300);
  await clickText(`${D} .ant-drawer-footer button`, "Tạo đơn");
  await sleep(1800);

  // Nhân thành 4 đơn "Đã thanh toán", mã khác nhau
  await ev(`(()=>{const list=JSON.parse(localStorage.getItem('bo-orders-v3'));const a=list[0];const copies=['A','B','C','D'].map(x=>({...a,id:'t-'+x,code:'TEST'+x,status:'paid'}));localStorage.setItem('bo-orders-v3',JSON.stringify([...copies,...list.slice(1)]))})()`);
  const before = await wax();
  const open = async (x) => { await go(`${base}/orders?order=t-${x}`, 2800); };
  const startMaking = async () => { await clickText(`${D} section button`, "Bắt đầu làm"); await sleep(600); };
  const cancelBtn = async () => { await clickText(`${D} section button`, "Hủy đơn"); await sleep(600); };
  const reason = () => type(`document.querySelector('${M} textarea')`, "Khách đổi ý");
  const confirm = async () => { await click(byText(`${M} .ant-modal-footer button`, "Hủy đơn")); await sleep(900); };
  const status = async (x) => (await orders()).find((o) => o.id === `t-${x}`);

  // A: đang làm, chưa làm → hoàn kho
  await open("A");
  await startMaking();
  ok("A1 Bắt đầu làm: trừ 120g sáp", (await wax()) === before - 120, `${before} -> ${await wax()}`);
  const mvA = (await inv()).movements.filter((m) => m.orderCode === "TESTA");
  ok("A1 Có phiếu 'order' cho từng nguyên liệu", mvA.length >= 3 && mvA.every((m) => m.type === "order" && m.change < 0), String(mvA.length));
  await cancelBtn();
  const q = (await text(`${M} .ant-form-item-label`)).join(" | ");
  ok("A2 Popup hỏi đã làm sản phẩm chưa", q.includes("Bạn đã thực hiện làm sản phẩm này chưa?"), q);
  await shot("c9-1-popup.png");
  await reason();
  await confirm();
  const err = (await text(`${M} .ant-form-item-explain-error`)).join();
  ok("A3 Chưa chọn thì không cho hủy", err.includes("Chọn đã làm hay chưa") && (await status("A")).status === "producing", err);
  await clickText(`${M} .ant-radio-wrapper`, "Chưa làm");
  await confirm();
  ok("A4 Chưa làm: đơn hủy, sáp hoàn đủ", (await status("A")).status === "cancelled" && (await status("A")).cancelOutcome === "returned" && (await wax()) === before, String(await wax()));
  const back = (await inv()).movements.filter((m) => m.orderCode === "TESTA" && m.type === "in");
  ok("A4 Phiếu hoàn khớp phiếu trừ", back.length === mvA.length && back.every((m) => m.note === "Hoàn kho do hủy đơn"), String(back.length));
  await shot("c9-2-returned.png");

  // B: đang làm, đã làm → hàng có sẵn, không hoàn
  await open("B");
  await startMaking();
  await cancelBtn();
  await reason();
  await clickText(`${M} .ant-radio-wrapper`, "Đã làm");
  await confirm();
  const b = await status("B");
  ok("B1 Đã làm: giữ phần trừ, ghi hàng có sẵn", b.cancelOutcome === "stocked" && (await wax()) === before - 120, String(await wax()));
  ok("B1 Lịch sử đơn ghi kết quả", b.history.at(-1).note.includes("Sản phẩm hủy đơn"), b.history.at(-1).note);
  const bAlert = (await text(`${D} section .ant-alert`)).join();
  ok("B1 Thẻ tiến trình hiện kết quả", bAlert.includes("chuyển sang Sản phẩm hủy đơn"), bAlert);

  // C: chờ giao → không hỏi, luôn hàng có sẵn
  await open("C");
  await startMaking();
  await clickText(`${D} section button`, "Đã làm xong");
  await sleep(600);
  await cancelBtn();
  ok("C1 Chờ giao: không hỏi, báo trước", (await ev(`document.querySelectorAll('${M} .ant-radio-wrapper').length`)) === 0 && (await text(`${M} .ant-alert`)).join().includes("Sản phẩm hủy đơn"));
  await shot("c9-3-ready.png");
  await reason();
  await confirm();
  ok("C2 Chờ giao: hàng có sẵn, không hoàn", (await status("C")).cancelOutcome === "stocked" && (await wax()) === before - 240, String(await wax()));

  // D: kho thiếu → chặn bắt đầu làm
  await ev(`(()=>{const i=JSON.parse(localStorage.getItem('bo-inventory-v2'));i.materials.find(m=>m.name==='Sáp đậu nành').stock=50;localStorage.setItem('bo-inventory-v2',JSON.stringify(i))})()`);
  await open("D");
  await startMaking();
  const warn = (await text(".ant-modal-confirm")).join();
  ok("D1 Kho thiếu: chặn và nêu nguyên liệu thiếu", warn.includes("Sáp đậu nành: cần 120, còn 50") && (await status("D")).status === "paid" && (await wax()) === 50, warn);
  await shot("c9-4-short.png");

  const cp = await ev("JSON.parse(localStorage.getItem('bo-cancelled-products-v3')||'[]')");
  ok("E1 Đã làm (B, C) sinh nến ở Sản phẩm hủy đơn; Chưa làm (A) thì không", cp.filter((c) => ["TESTB", "TESTC"].includes(c.orderCode)).length === 2 && !cp.some((c) => c.orderCode === "TESTA"), String(cp.length));
  ok("E1 Nến có chữ riêng được gắn nhãn", cp.find((c) => c.orderCode === "TESTB")?.personalized === true);
  await t.viewport(390, 844, true);
  await go(`${base}/orders?order=t-D`, 2800);
  console.log("mobile overflow:", await t.overflow(".ant-drawer-open .ant-drawer-body"));
  console.log("logs:", t.logs);
});
