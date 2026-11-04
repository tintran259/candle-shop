// E2E 17 — Đơn toàn nến có sẵn hủy lúc Đang làm: đã trừ Kho thì hỏi đã làm chưa
import { test } from "./support/harness.mjs";

test("E2E 17 — Đơn toàn nến có sẵn hủy lúc Đang làm: đã trừ Kho thì hỏi đã làm chưa", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const { ev, sleep, shot, click, clickText, byText, type, text, go, ok } = t;
  const D = ".ant-drawer-open";
  const M = ".ant-modal-wrap:not([style*=none]) .ant-modal";
  const orders = () => ev("JSON.parse(localStorage.getItem('bo-orders-v3')||'null')");
  const inv = () => ev("JSON.parse(localStorage.getItem('bo-inventory-v2')||'null')");
  const wax = async () => (await inv())?.materials.find((m) => m.id === "wax-soy").stock ?? 9000;
  const order = async (id) => (await orders()).find((o) => o.id === id);
  const cancelled = () => ev("JSON.parse(localStorage.getItem('bo-cancelled-products-v3')||'null')");

  await go(base + "/", 1000);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  await go(base + "/orders", 2200);
  const make = (id, productId, status) => ({
    id, code: "T" + id.toUpperCase(), status, customer: { name: "Khách thử", email: "", phone: "0900000002" }, shippingAddress: "1 A", shippingMethod: "standard", depositPercent: 50,
    items: [{ id: "i", productId, name: productId, price: 500000, quantity: 2 }], subtotal: 1000000, discount: 0, shippingFee: 0, total: 1000000, paymentPlan: "full", paymentMethod: "cod",
    payments: [{ id: "p-" + id, provider: "cod", amount: 1000000, status: "success", createdAt: new Date().toISOString() }],
    readyDate: "2026-12-30", history: [{ at: new Date().toISOString(), status: "pending", by: "x" }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });
  await ev(`localStorage.setItem('bo-orders-v3', ${JSON.stringify(JSON.stringify([make("a", "vanilla-relax", "paid"), make("b", "vanilla-relax", "paid"), make("c", "khong-co", "producing")]))})`);
  const open = (id) => go(`${base}/orders?order=${id}`, 2800);
  const btn = (s) => clickText(`${D} section button`, s).then(() => sleep(600));
  const submit = () => click(byText(`${M} .ant-modal-footer button`, "Hủy đơn")).then(() => sleep(900));
  const labels = async () => (await text(`${M} .ant-form-item-label`)).join(" | ");
  const fill = async () => { await type(`document.querySelector('${M} textarea')`, "Khách đổi ý"); await clickText(`${M} .ant-radio-wrapper`, "Lỗi do shop"); await sleep(200); };

  const w0 = await wax();
  await open("a");
  await btn("Bắt đầu làm");
  ok("A0 Đã trừ sáp", (await wax()) === w0 - 260, `${w0} -> ${await wax()}`);
  await btn("Hủy đơn");
  ok("A1 Đơn toàn nến có sẵn đã trừ Kho thì hỏi", (await labels()).includes("Bạn đã thực hiện làm sản phẩm này chưa?"), await labels());
  await shot("d17-ask.png");
  await fill();
  await submit();
  ok("A2 Bắt buộc trả lời", (await order("a")).status === "producing");
  await clickText(`${M} .ant-radio-wrapper`, "Chưa làm");
  await submit();
  ok("A3 Chưa làm: hoàn nguyên liệu", (await order("a")).cancelOutcome === "returned" && (await wax()) === w0, String(await wax()));

  await open("b");
  await btn("Bắt đầu làm");
  await btn("Hủy đơn");
  const opts = (await text(`${M} .ant-radio-wrapper`)).join(" | ");
  ok("B1 Không nhắc Sản phẩm hủy đơn", opts.includes("Đã làm, không hoàn nguyên liệu") && !opts.includes("Sản phẩm hủy đơn"), opts);
  await fill();
  await clickText(`${M} .ant-radio-wrapper`, "Đã làm");
  await submit();
  ok("B2 Đã làm: không hoàn, không tạo bản ghi", (await order("b")).cancelOutcome === "consumed" && (await wax()) === w0 - 260 && !((await cancelled()) ?? []).some((c) => c.orderId === "b"), String(await wax()));
  ok("B3 Đơn hiện đúng kết quả", (await ev(`document.querySelector('${D}').innerText`)).includes("Đã làm: không hoàn nguyên liệu"));

  await open("c");
  await btn("Hủy đơn");
  ok("C1 Chưa trừ Kho thì không hỏi", !(await labels()).includes("Bạn đã thực hiện"), await labels());

  console.log(t.logs.length ? "LOGS:\n" + t.logs.slice(0, 5).join("\n") : "Không có lỗi console");
});
