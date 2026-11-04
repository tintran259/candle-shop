// E2E 12 — Hủy đơn: 1 dòng nến thủ công số lượng 2 = 1 sản phẩm; nến có sẵn không vào Sản phẩm hủy đơn
import { test } from "./support/harness.mjs";

test("E2E 12 — Hủy đơn: 1 dòng nến thủ công số lượng 2 = 1 sản phẩm; nến có sẵn không vào Sản phẩm hủy đơn", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const { ev, sleep, shot, click, clickText, byText, type, text, go, ok } = t;
  const D = ".ant-drawer-open";
  const M = ".ant-modal-wrap .ant-modal";
  const KEY = "bo-cancelled-products-v3";
  const store = async () => (await ev(`JSON.parse(localStorage.getItem('${KEY}')||'[]')`));
  const of = async (code) => (await store()).filter((c) => c.orderCode === code);

  const custom = (id, quantity) => ({ id, name: "Nến tự phối", price: 500000, quantity, custom: "Hũ gốm · Sáp đậu nành · " + id });
  const shop = (id, quantity) => ({ id, productId: "moon-morning", name: "Moon Morning", price: 850000, quantity });

  await go(base + "/orders", 1500);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  await go(base + "/orders", 2500);
  // Lấy một đơn mẫu làm khuôn rồi tạo các đơn thử
  const seed = async (list) => {
    await ev(`(async()=>{const list=${JSON.stringify(list)};const raw=localStorage.getItem('bo-orders-v3');window.__o=raw?JSON.parse(raw):null})()`);
  };
  const template = {
    customer: { name: "Khách Thử", phone: "0900000000", email: "a@b.c" }, shippingAddress: "x", shippingMethod: "standard",
    subtotal: 1000000, discount: 0, shippingFee: 0, total: 1000000, paymentPlan: "full", paymentMethod: "cod", payments: [],
    readyDate: "2026-11-10", history: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
  const orders = [
    { ...template, id: "t-1", code: "MERGE1", status: "producing", items: [custom("a", 2)] },
    { ...template, id: "t-2", code: "MIXED", status: "producing", items: [custom("a", 1), shop("b", 3)] },
    { ...template, id: "t-3", code: "SHOP1", status: "producing", items: [shop("a", 2)] },
    { ...template, id: "t-4", code: "SHOP2", status: "ready", items: [shop("a", 1)] },
    { ...template, id: "t-5", code: "TWO", status: "ready", items: [custom("a", 2), custom("b", 1)] },
  ];
  await ev(`localStorage.setItem('bo-orders-v3', ${JSON.stringify(JSON.stringify(orders))})`);
  const open = (id) => go(`${base}/orders?order=${id}`, 2600);
  const cancelBtn = async () => { await clickText(`${D} section button`, "Hủy đơn"); await sleep(600); };
  const reason = () => type(`document.querySelector('${M} textarea')`, "Khách đổi ý");
  const confirm = async () => { await click(byText(`${M} .ant-modal-footer button`, "Hủy đơn")); await sleep(1000); };
  const radios = () => ev(`document.querySelectorAll('${M} .ant-radio-wrapper').length`);

  // 1 dòng, số lượng 2
  await open("t-1");
  await cancelBtn();
  ok("A1 Đơn có nến thủ công: hiện câu hỏi", (await radios()) === 2);
  await reason();
  await clickText(`${M} .ant-radio-wrapper`, "Đã làm");
  await confirm();
  const a = await of("MERGE1");
  ok("A2 Số lượng 2 → 1 sản phẩm, quantity 2", a.length === 1 && a[0].quantity === 2, JSON.stringify(a.map((c) => [c.id, c.quantity])));
  const toast = (await text(".ant-message-notice")).join();
  ok("A3 Thông báo đúng số sản phẩm", toast.includes("1 sản phẩm thủ công"), toast);

  // Đơn có cả 2 loại
  await open("t-2");
  await cancelBtn();
  await reason();
  await clickText(`${M} .ant-radio-wrapper`, "Đã làm");
  await confirm();
  const b = await of("MIXED");
  ok("B1 Đơn hỗn hợp: chỉ nến thủ công vào", b.length === 1 && b[0].name === "Nến tự phối" && b[0].quantity === 1, JSON.stringify(b.map((c) => c.name)));

  // Đơn toàn nến có sẵn
  await open("t-3");
  await cancelBtn();
  ok("C1 Đơn đang làm toàn nến có sẵn: không hỏi", (await radios()) === 0);
  await shot("c12-1-no-question.png");
  await reason();
  await confirm();
  const so = (await ev("JSON.parse(localStorage.getItem('bo-orders-v3'))")).find((o) => o.id === "t-3");
  ok("C2 Hủy được, không sinh sản phẩm hủy đơn", so.status === "cancelled" && !so.cancelOutcome && (await of("SHOP1")).length === 0, JSON.stringify({ s: so.status, o: so.cancelOutcome }));

  await open("t-4");
  await cancelBtn();
  ok("C3 Chờ giao toàn nến có sẵn: không báo chuyển", (await ev(`document.querySelectorAll('${M} .ant-alert').length`)) === 0 || !(await text(`${M} .ant-alert`)).join().includes("Sản phẩm hủy đơn"));
  await reason();
  await confirm();
  ok("C3 Không sinh sản phẩm hủy đơn", (await of("SHOP2")).length === 0);

  // 2 dòng cấu hình khác nhau vẫn là 2 sản phẩm
  await open("t-5");
  await cancelBtn();
  await reason();
  await confirm();
  const two = await of("TWO");
  ok("D1 2 cấu hình khác nhau → 2 sản phẩm", two.length === 2 && two.map((c) => c.quantity).sort().join() === "1,2", JSON.stringify(two.map((c) => c.quantity)));

  // Trang hiển thị
  await go(base + "/cancelled-products", 2600);
  const rows = await text(".ant-table-tbody tr.ant-table-row");
  ok("E1 Không có nến có sẵn nào trong bảng", rows.length >= 4 && !rows.some((r) => r.includes("Moon Morning")), String(rows.length));
  ok("E2 Bảng hiện số lượng 2", rows.some((r) => r.includes("MERGE1") && /\t?\b2\b/.test(r)), rows.find((r) => r.includes("MERGE1")));
  await shot("c12-2-page.png");

  // Tạo trưng bày từ dòng số lượng 2: 1 sản phẩm
  const id = a[0].id;
  await go(`${base}/products?edit=from:${id}`, 2800);
  await ev(`0`);
  const desc = await ev(`document.querySelector('${D} textarea#description')?.value`);
  ok("F1 Điền sẵn mô tả cấu hình", desc?.includes("Hũ gốm"), desc);

  await go(`${base}/cancelled-products?item=${id}`, 2800);
  const body = (await text(`${D} .ant-drawer-body`)).join();
  ok("F2 Drawer hiện số lượng", body.includes("Số lượng"), body.slice(0, 120));
  console.log("logs:", t.logs);
});
