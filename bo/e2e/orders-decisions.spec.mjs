// E2E 16 — 6 quyết định: công thức, giữ nguyên liệu, thu đủ khi hoàn tất, trả lượt mã, hoàn tiền kèm ảnh, giao hàng lỗi
import { test } from "./support/harness.mjs";
import fs from "node:fs";

test("E2E 16 — 6 quyết định: công thức, giữ nguyên liệu, thu đủ khi hoàn tất, trả lượt mã, hoàn tiền kèm ảnh, giao hàng lỗi", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const { ev, sleep, shot, click, clickText, byText, type, pick, text, go, ok, send, viewport, overflow } = t;
  const D = ".ant-drawer-open";
  const M = ".ant-modal-wrap:not([style*=none]) .ant-modal";
  const orders = () => ev("JSON.parse(localStorage.getItem('bo-orders-v3')||'null')");
  const inv = () => ev("JSON.parse(localStorage.getItem('bo-inventory-v2')||'null')");
  const stock = async (id) => (await inv())?.materials.find((m) => m.id === id)?.stock;
  const order = async (id) => (await orders()).find((o) => o.id === id);
  const disc = async (code) => JSON.parse(await ev("localStorage.getItem('bo-discounts-v1')") ?? "null")?.find((d) => d.code === code);
  const open = (id) => go(`${base}/orders?order=${id}`, 2800);
  const btn = (s) => clickText(`${D} section button`, s).then(() => sleep(500));
  const modalBtn = (s) => click(byText(`${M} .ant-modal-footer button`, s)).then(() => sleep(800));
  const confirmBtn = (s) => click(byText(".ant-modal-confirm-btns button", s)).then(() => sleep(800));
  const radio = (s) => clickText(`${M} .ant-radio-wrapper`, s);
  const reason = (s = "Lý do thử") => type(`document.querySelector('${M} textarea')`, s);

  await go(base + "/", 1000);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  await go(base + "/orders", 2200);

  const item = (productId, quantity, price = 500000) => ({ id: "i-" + productId, productId, name: productId, price, quantity });
  const custom = { id: "i-c", name: "Nến tự phối", custom: "Hũ gốm · 150g", price: 500000, quantity: 2 };
  const make = (id, over) => {
    const total = over.total ?? 1000000;
    const plan = over.paymentPlan ?? "full";
    const amount = plan === "deposit" ? 500000 : total;
    return {
      id, code: "T" + id.toUpperCase(), status: "paid",
      customer: { name: "Khách thử", email: "", phone: "0900000001" }, shippingAddress: "1 A", shippingMethod: "standard", shippingName: "Tiêu chuẩn (3 ngày)", shippingDays: 3, depositPercent: 50,
      items: [item("vanilla-relax", 1)], subtotal: total, discount: 0, shippingFee: 0, total, paymentPlan: plan, paymentMethod: "cod",
      payments: [{ id: "p-" + id, provider: "cod", amount, status: "success", createdAt: new Date().toISOString() }],
      readyDate: "2026-12-30", history: [{ at: new Date(Date.now() - 86400000).toISOString(), status: "pending", by: "x" }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...over,
    };
  };
  const list = [
    make("hold", { items: [item("citrus-bloom", 15)] }),
    make("start", { items: [item("vanilla-relax", 2)] }),
    make("pend", { status: "pending", items: [item("citrus-bloom", 3)], payments: [{ id: "pp", provider: "cod", amount: 1000000, status: "pending", createdAt: new Date().toISOString() }] }),
    make("done", { status: "shipping", paymentPlan: "deposit" }),
    make("cfull", { discountCode: "WELCOME10" }),
    make("cdep", { paymentPlan: "deposit" }),
    make("cshop", { paymentPlan: "deposit" }),
    make("late", { status: "shipping", items: [custom] }),
    make("resend", { status: "shipping", paymentPlan: "full" }),
  ];
  await ev(`localStorage.setItem('bo-orders-v3', ${JSON.stringify(JSON.stringify(list))})`);

  // --- Công thức
  await go(base + "/products?edit=new", 2600);
  await click(byText(`${D} .ant-drawer-footer button`, "Thêm sản phẩm"));
  await sleep(700);
  ok("Recipe: sản phẩm mới bắt buộc có công thức", (await ev("document.querySelector('.ant-drawer-open').innerText")).includes("Thêm ít nhất một nguyên liệu."));
  await clickText(`${D} button`, "Thêm nguyên liệu");
  await sleep(300);
  await pick(`document.querySelector('${D} [aria-label="Nguyên liệu dòng 1"]')?.closest('.ant-select') ?? document.querySelector('${D} .ant-select[aria-label], ${D} form .ant-form-item .ant-select:last-of-type')`, "Sáp dừa", true).catch((e) => console.log("pick:", e.message));
  await sleep(300);
  await ev(`document.querySelector('${D} .ant-input-number-input') && 0`);
  await shot("d16-recipe.png");
  await go(base + "/products?edit=brown-relac", 2600);
  const recipeText = await ev(`document.querySelector('${D}').innerText`);
  ok("Recipe: sản phẩm mẫu hiện công thức", recipeText.includes("Công thức nguyên liệu") && recipeText.includes("Sáp đậu nành"));

  // --- Giữ nguyên liệu
  await go(base + "/inventory", 3500);
  await type("document.querySelector('input[placeholder^=\"Tên hoặc mã\"]')", "Hộp thiếc");
  await sleep(900);
  const invPage = await ev("document.querySelector('main').innerText");
  await shot("d16-held.png");
  ok("Hold: Kho hiện Đang giữ", /Đang giữ 15 · Dùng được 1/.test(invPage.replace(/\s+/g, " ")), invPage.slice(0, 0));
  ok("Hold: chưa trừ tồn thực tế", (await stock("jar-tin-150")) === undefined || (await stock("jar-tin-150")) === 16, String(await stock("jar-tin-150")));

  await open("pend");
  await btn("Xác nhận đã thanh toán");
  const popup = (await text(".ant-modal-confirm")).join(" ");
  await shot("d16-short.png");
  ok("Hold: xác nhận tiền báo thiếu nguyên liệu giữ", popup.includes("Không đủ nguyên liệu để giữ"), popup.slice(0, 120));
  await confirmBtn("Quay lại");
  ok("Hold: Quay lại không đổi trạng thái", (await order("pend")).status === "pending");

  await go(base + "/orders?order=new", 2800);
  await clickText(`${D} button`, "Nến có sẵn").catch(() => {});
  await sleep(500);
  await pick(`[...document.querySelectorAll('${D} .order-line .ant-select')][0]`, "Citrus", true);
  await sleep(300);
  await type(`document.querySelector('${D} .order-line input.ant-input-number-input')`, "2");
  await sleep(600);
  const aside = await ev(`document.querySelector('${D} .order-summary').innerText`);
  await shot("d16-create-short.png");
  ok("Hold: tạo đơn bị chặn theo tồn dùng được", aside.includes("Kho không đủ nguyên liệu") && aside.includes("còn 1"), aside.slice(-120));

  await open("start");
  const wax0 = await stock("wax-soy") ?? 9000;
  await btn("Bắt đầu làm");
  ok("Recipe: bắt đầu làm trừ theo công thức × số lượng", (await stock("wax-soy")) === wax0 - 260, `${wax0} -> ${await stock("wax-soy")}`);
  ok("Recipe: có phiếu theo đơn", (await inv()).movements.some((m) => m.orderCode === "TSTART" && m.materialId === "oil-vanilla" && m.change === -20));

  // --- Hoàn tất tương đương đã thu đủ
  await open("done");
  const paySection = await ev(`document.querySelector('${D}').innerText`);
  ok("Paid: không còn nút thu riêng", !paySection.includes("khi giao\n") || !/Đã thu [\d.]+ ₫ khi giao/.test(paySection));
  await btn("Khách đã nhận");
  const askDone = (await text(".ant-modal-confirm")).join(" ");
  ok("Paid: hỏi xác nhận đã thu đủ", askDone.includes("đã thu đủ") && askDone.includes("500.000"), askDone);
  await confirmBtn("Đã thu đủ, hoàn tất");
  const done = await order("done");
  ok("Paid: hoàn tất và thu đủ", done.status === "completed" && done.payments.reduce((s, p) => s + p.amount, 0) === done.total, done.status);

  // --- Hủy: lỗi do khách, đã trả đủ
  const used0 = (await disc("WELCOME10"))?.used;
  await go(base + "/discounts", 1500);
  await open("cfull");
  await btn("Hủy đơn");
  await reason();
  await modalBtn("Hủy đơn");
  ok("Cancel: đã thu tiền phải chọn lỗi do ai", (await text(`${M} .ant-form-item-explain-error`)).join().includes("lỗi do ai"));
  await radio("Lỗi do khách");
  await sleep(300);
  const hint = (await text(`${M} .ant-form-item-extra`)).join(" ");
  await shot("d16-fault.png");
  ok("Refund: đủ tiền lỗi khách hoàn tổng trừ cọc", hint.includes("Cần hoàn 500.000"), hint);
  await modalBtn("Hủy đơn");
  const cf = await order("cfull");
  ok("Refund: lưu số phải hoàn", cf.status === "cancelled" && cf.refundDue === 500000 && cf.cancelFault === "customer", String(cf.refundDue));
  const d1 = await disc("WELCOME10");
  ok("Discount: trả lại lượt khi hủy", d1 && (used0 === undefined || d1.used === used0 - 1), `${used0} -> ${d1?.used}`);

  // Ghi nhận hoàn tiền kèm ảnh
  await sleep(400);
  await clickText(`${D} button`, "Ghi nhận đã hoàn tiền");
  await sleep(700);
  await modalBtn("Ghi nhận");
  ok("Refund: bắt buộc ảnh chứng từ", (await text(`${M} .ant-form-item-explain-error`)).join().includes("ảnh chứng từ"));
  const png = "D:/candle-shop/bo/public/products/product-moon.jpg";
  await send("DOM.enable");
  const { root } = await send("DOM.getDocument", { depth: -1, pierce: true });
  const { nodeId } = await send("DOM.querySelector", { nodeId: root.nodeId, selector: ".ant-modal input[type=file]" });
  await send("DOM.setFileInputFiles", { nodeId, files: [png.replace(/\//g, "\\")] });
  await sleep(1500);
  await shot("d16-refund.png");
  await modalBtn("Ghi nhận");
  await sleep(500);
  const cf2 = await order("cfull");
  ok("Refund: lưu ảnh và số tiền", cf2.refund?.amount === 500000 && cf2.refund.images.length === 1, JSON.stringify(cf2.refund ?? {}).slice(0, 80));
  await shot("d16-refunded.png");

  // Đặt cọc lỗi khách không hoàn; lỗi shop hoàn hết
  await open("cdep");
  await btn("Hủy đơn");
  await reason();
  await radio("Lỗi do khách");
  await sleep(300);
  ok("Refund: cọc lỗi khách không hoàn", (await text(`${M} .ant-form-item-extra`)).join(" ").includes("Không hoàn tiền"));
  await modalBtn("Hủy đơn");
  ok("Refund: không có nợ hoàn", !(await order("cdep")).refundDue);
  await open("cshop");
  await btn("Hủy đơn");
  await reason();
  await radio("Lỗi do shop");
  await sleep(300);
  await modalBtn("Hủy đơn");
  ok("Refund: lỗi shop hoàn hết", (await order("cshop")).refundDue === 500000);

  // --- Giao lỗi: hết lượt tự hoàn về, hủy sau hoàn về
  await open("late");
  const fail = async (r) => { await btn("Giao không thành"); await reason(r); await modalBtn("Ghi nhận"); };
  await fail("Khách không nghe máy");
  ok("Delivery: lần 1 sang Giao không thành", (await order("late")).status === "delivery_failed" && (await order("late")).deliveryAttempts === 1);
  await shot("d16-failed.png");
  await btn("Giao lại");
  ok("Delivery: giao lại về Đang giao", (await order("late")).status === "shipping");
  await fail("Sai địa chỉ");
  await btn("Giao lại");
  await btn("Giao không thành");
  const last = (await text(`${M} .ant-alert`)).join(" ");
  ok("Delivery: báo lần cuối", last.includes("3/3") && last.includes("tự chuyển sang hoàn về"), last);
  await reason("Vắng nhà");
  await modalBtn("Ghi nhận");
  ok("Delivery: hết lượt tự hoàn về", (await order("late")).status === "returning");
  ok("Delivery: không hủy khi chưa về shop", !(await text(`${D} section button`)).some((b) => b.includes("Hủy đơn")));
  await btn("Đã nhận lại hàng");
  await radio("Nến còn tốt");
  await modalBtn("Xác nhận");
  ok("Delivery: đã hoàn về", (await order("late")).status === "returned" && (await order("late")).returnCondition === "good");
  await shot("d16-returned.png");
  await btn("Hủy đơn");
  await reason("Khách không nhận");
  await radio("Lỗi do khách");
  await sleep(200);
  await modalBtn("Hủy đơn");
  const cp = await ev("JSON.parse(localStorage.getItem('bo-cancelled-products-v3')||'[]')");
  ok("Delivery: nến tốt vào Sản phẩm hủy đơn", (await order("late")).cancelOutcome === "stocked" && cp.some((c) => c.orderId === "late" && c.quantity === 2));

  // Gửi lại: cộng phí, đếm lại, hoàn tất thu nốt
  await open("resend");
  await fail("A");
  await btn("Hoàn về");
  await btn("Đã nhận lại hàng");
  await radio("Nến bị hỏng");
  await modalBtn("Xác nhận");
  await btn("Gửi lại đơn");
  await sleep(300);
  const feeVal = await ev(`document.querySelector('${M} input').value`);
  await shot("d16-resend.png");
  ok("Resend: phí mặc định từ Cài đặt, cảnh báo nến hỏng", feeVal.replace(/\D/g, "") === "30000" && (await text(`${M} .ant-alert`)).join(" ").includes("hỏng"), feeVal);
  await modalBtn("Gửi lại đơn");
  const r1 = await order("resend");
  ok("Resend: về Chờ giao, cộng phí, đếm lại", r1.status === "ready" && r1.total === 1030000 && r1.deliveryAttempts === 0, `${r1.status} ${r1.total}`);
  await btn("Giao cho vận chuyển");
  await btn("Khách đã nhận");
  await confirmBtn("Đã thu đủ, hoàn tất");
  ok("Resend: hoàn tất thu nốt phí", (await order("resend")).status === "completed" && (await order("resend")).payments.reduce((s, p) => s + p.amount, 0) === 1030000);

  // Trang danh sách, khách, điện thoại
  await go(base + "/orders", 2200);
  await shot("d16-list.png");
  ok("List: có thẻ Giao lỗi cần xử lý", (await ev("document.querySelector('main').innerText")).includes("Giao lỗi cần xử lý"));
  ok("Không tràn ngang", (await overflow()).length === 0, (await overflow()).join());
  await viewport(390, 844, true);
  await open("late");
  await shot("d16-m-drawer.png");
  await go(base + "/orders", 2200);
  await shot("d16-m-list.png");
});
