// E2E 7 — Tạo đơn hàng tại BO: khách có sẵn / khách mới / khách bị chặn, nến có sẵn + tự phối, mã giảm giá, cọc, đã nhận tiền
import { test } from "./support/harness.mjs";

test("E2E 7 — Tạo đơn hàng tại BO: khách có sẵn / khách mới / khách bị chặn, nến có sẵn + tự phối, mã giảm giá, cọc, đã nhận tiền", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const { ev, sleep, shot, click, clickText, byText, type, pick, text, go, ok, press } = t;
  const orders = () => ev("JSON.parse(localStorage.getItem('bo-orders-v4')||'null')");
  const customers = () => ev("JSON.parse(localStorage.getItem('bo-customers-v1')||'null')");
  const D = ".ant-drawer-open";
  const help = () => ev(`[...document.querySelectorAll('${D} .ant-form-item')].find(f=>f.innerText.includes('Mã giảm giá'))?.querySelector('.ant-form-item-explain')?.innerText ?? ''`);
  const summary = async () => (await text(`${D} aside.order-summary`))[0];
  const money = (s, label) => Number((s.match(new RegExp(label + "\\s*−?([\\d.]+)")) ?? [])[1]?.replace(/\./g, "") ?? NaN);

  await go(base + "/", 1000);
  await ev("['bo-orders-v4','bo-customers-v1','bo-discounts-v1','bo-products-v2'].forEach(k=>localStorage.removeItem(k))");
  await go(base + "/orders", 2600);
  const before = (await text("main .ant-tabs-tab"))[0];

  // 1. Mở form, bấm tạo khi trống → báo lỗi bắt buộc
  await clickText("main button", "Tạo đơn hàng");
  await sleep(1200);
  ok("1 Mở form tạo đơn (?order=new)", (await t.loc()).includes("order=new") && (await ev(`document.querySelector('${D} .ant-drawer-title')?.innerText`)) === "Tạo đơn hàng");
  await clickText(`${D} .ant-drawer-footer button`, "Tạo đơn");
  await sleep(600);
  const errs = await text(`${D} .ant-form-item-explain-error`);
  ok("1 Trống → báo lỗi tên, SĐT, địa chỉ", ["Nhập tên khách.", "Nhập số điện thoại.", "Nhập địa chỉ giao."].every((e) => errs.includes(e)), errs.join(" | "));
  await shot("o1-empty.png");

  // 2. Chọn khách có sẵn → điền nhanh
  await pick(`document.querySelector('${D} input#customerId').closest('.ant-select')`, "Wing Sun", true);
  await sleep(400);
  const filled = await ev(`['name','phone','email','address'].map(id=>document.querySelector('${D} #'+id)?.value)`);
  ok("2 Chọn 'Wing Sun' → điền tên, SĐT, email, địa chỉ gần nhất", filled[0] === "Wing Sun" && filled[1] === "0977 001 122" && filled[3]?.includes("Hai Bà Trưng"), filled.join(" | "));
  const info = (await text(`${D} .ant-alert`)).join();
  ok("2 Báo số này thuộc hồ sơ có sẵn", info.includes("thuộc hồ sơ Wing Sun"), info);

  // 3. Sản phẩm: 2 Moon Morning + 1 nến tự phối 650.000
  await clickText(`${D} button`, "Nến có sẵn");
  await sleep(500);
  console.log("  dòng:", await text(`${D} .order-line`), await ev(`[...document.querySelectorAll('${D} .order-line [aria-label]')].map(e=>e.tagName+':'+e.getAttribute('aria-label'))`));
  await shot("o3-line.png");
  await pick(`document.querySelectorAll('${D} [aria-label="Chọn sản phẩm"]')[0].closest('.ant-select')`, "Moon Morning", true);
  await type(`document.querySelectorAll('${D} input[aria-label="Số lượng"]')[0]`, 2);
  await clickText(`${D} button`, "Nến có sẵn");
  await sleep(300);
  await pick(`document.querySelectorAll('${D} [aria-label="Chọn sản phẩm"]')[1].closest('.ant-select')`, "Woman Secret", true);
  await sleep(300);
  let s = await summary();
  const subtotal = money(s, "Tạm tính");
  console.log("  tổng:", s);
  ok("3 Tạm tính = 2 × Moon Morning + 1 × Woman Secret", subtotal > 1000000, String(subtotal));

  // 4. Mã giảm giá: sai điều kiện → báo lỗi; đúng → giảm
  await type(`document.querySelector('${D} input#discountCode')`, "welcome10");
  await sleep(300);
  ok("4 WELCOME10 (chỉ đơn đầu) → báo lỗi cho khách quen", (await help()).includes("khách đặt lần đầu"), await help());
  await type(`document.querySelector('${D} input#discountCode')`, "candle2510");
  await sleep(300);
  const expectDisc = Math.min(200000, Math.round((subtotal * 15) / 100 / 1000) * 1000);
  s = await summary();
  ok("4 CANDLE2510 → giảm 15% (tối đa 200.000)", money(s, "Giảm giá \\(CANDLE2510\\)") === expectDisc, `${await help()} | ${expectDisc}`);

  // 5. Giao nhanh + cọc 50% tiền mặt, đã nhận cọc
  await clickText(`${D} .ant-radio-wrapper`, "Nhanh");
  await clickText(`${D} .ant-radio-button-wrapper`, "Cọc 50%");
  await click(`document.querySelector('${D} [aria-label="Đã nhận tiền"]')`);
  await type(`document.querySelector('${D} textarea#note')`, "Gói quà giúp mình");
  await sleep(300);
  s = await summary();
  const total = subtotal - expectDisc + 50000;
  // Cọc 50% trên tiền hàng (tạm tính − giảm), không gồm phí giao
  const deposit = Math.round(((subtotal - expectDisc) * 0.5) / 1000) * 1000;
  ok("5 Tổng = tạm tính − giảm + 50.000 phí nhanh; cọc 50% tiền hàng", money(s, "Tổng") === total && money(s, "Cọc 50% tiền hàng khi đặt") === deposit, s);
  await shot("o5-form.png", true);

  // 6. Tạo đơn → mở chi tiết đơn mới
  await clickText(`${D} .ant-drawer-footer button`, "Tạo đơn");
  await sleep(1800);
  const created = (await orders())[0];
  ok("6 Đơn mới đứng đầu, đúng tiền & trạng thái 'Đã thanh toán'", created.customer.name === "Wing Sun" && created.total === total && created.status === "paid" && created.discountCode === "CANDLE2510" && created.payments[0].amount === deposit && created.payments[0].status === "success", JSON.stringify({ code: created.code, total: created.total, status: created.status }));
  ok("6 Mã đơn theo ngày SCYYMMDD###", /^SC\d{6}\d{3}$/.test(created.code), created.code);
  ok("6 Lịch sử ghi 'Tạo đơn tại BO · Điện thoại' + 'Nhận cọc'", created.history[0].note === "Tạo đơn tại BO · Điện thoại" && created.history[1].note?.startsWith("Nhận cọc"));
  ok("6 Mở luôn chi tiết đơn vừa tạo", (await t.loc()).includes(`order=${created.id}`) && (await ev(`document.querySelector('${D}')?.innerText`))?.includes(created.code), await t.loc());
  await shot("o6-created.png");
  const detail = await ev(`document.querySelector('${D}')?.innerText`);
  ok("6 Lịch sử đơn ghi 'Shop tạo đơn' + 'Khách đặt qua Điện thoại'", detail.includes("Shop tạo đơn") && detail.includes("Khách đặt qua Điện thoại"));
  ok("6 Khoản thu đầu là 'Tiền cọc 50%' (không phải 'Thu nốt khi giao')", detail.includes("Tiền cọc 50%") && !/Thu nốt khi giao\s+1\.100/.test(detail));
  await press("Escape", "Escape", 27);
  await sleep(800);
  const after = (await text("main .ant-tabs-tab"))[0];
  console.log("  tab Tất cả:", before, "→", after);
  ok("6 Đơn có trong danh sách", (await text("main .ant-table-row"))[0]?.includes(created.code));
  const disc = (await ev("JSON.parse(localStorage.getItem('bo-discounts-v1')||'[]')")).find((d) => d.code === "CANDLE2510");
  ok("6 Mã giảm giá tăng 1 lượt dùng", disc?.used === 143, String(disc?.used));

  // 7. Khách mới → tạo hồ sơ khách
  await clickText("main button", "Tạo đơn hàng");
  await sleep(1200);
  await type(`document.querySelector('${D} #name')`, "Phan Thị Hồng");
  await type(`document.querySelector('${D} #phone')`, "0901 222 333");
  await type(`document.querySelector('${D} #address')`, "5 Nguyễn Du, Q.1, TP.HCM");
  await pick(`document.querySelector('${D} input#channel').closest('.ant-select')`, "Zalo");
  await sleep(200);
  ok("7 Số mới → báo 'Khách mới — tạo hồ sơ'", (await text(`${D} .ant-alert`)).join().includes("Khách mới"));
  await clickText(`${D} button`, "Nến có sẵn");
  await sleep(300);
  await pick(`document.querySelector('${D} [aria-label="Chọn sản phẩm"]').closest('.ant-select')`, "Vanilla Relax", true);
  await clickText(`${D} .ant-drawer-footer button`, "Tạo đơn");
  await sleep(1800);
  const o2 = (await orders())[0];
  const cus = (await customers())?.find((c) => c.phone === "0901 222 333");
  ok("7 Đơn chờ thanh toán (chưa nhận tiền) qua Zalo", o2.status === "pending" && o2.payments[0].status === "pending" && o2.history[0].note === "Tạo đơn tại BO · Zalo");
  ok("7 Tạo hồ sơ khách mới", !!cus && !cus.hasAccount, JSON.stringify(cus));
  await press("Escape", "Escape", 27);
  await sleep(800);

  // 8. Khách bị chặn → hỏi xác nhận
  await clickText("main button", "Tạo đơn hàng");
  await sleep(1200);
  await type(`document.querySelector('${D} #name')`, "Trương Văn Lực");
  await type(`document.querySelector('${D} #phone')`, "0973787909");
  await type(`document.querySelector('${D} #address')`, "88 Quang Trung, Gò Vấp");
  await sleep(200);
  ok("8 Khách bị chặn → cảnh báo đỏ", (await text(`${D} .ant-alert-error`)).join().includes("đang bị chặn"));
  await clickText(`${D} button`, "Nến có sẵn");
  await sleep(300);
  await pick(`document.querySelector('${D} [aria-label="Chọn sản phẩm"]').closest('.ant-select')`, "Citrus Bloom", true);
  await clickText(`${D} .ant-drawer-footer button`, "Tạo đơn");
  await sleep(600);
  ok("8 Bấm tạo → hỏi xác nhận trước", (await text(".ant-modal-confirm-title")).join().includes("đang bị chặn"));
  await clickText(".ant-modal-confirm-btns button", "Xem lại");
  await sleep(400);
  // Đóng khi đang nhập dở → không hỏi, giữ làm đơn nháp (docs/pages/orders.md#đơn-nháp)
  await press("Escape", "Escape", 27);
  await sleep(900);
  const draft = await ev("JSON.parse(localStorage.getItem('bo-order-draft-v1')||'null')");
  ok("8 Đóng khi đang nhập dở → lưu nháp, không hỏi", !(await text(".ant-modal-confirm-title")).length && draft?.values?.phone?.replace(/\D/g, "") === "0973787909", JSON.stringify(draft?.values?.phone));
  console.log("  đơn của SĐT bị chặn:", (await orders()).filter((o) => o.customer.phone.replace(/\D/g, "").includes("0973787909")).map((o) => o.code + "|" + o.customer.phone + "|" + o.status));
  ok("8 Không tạo đơn cho khách bị chặn khi chọn 'Xem lại'", (await orders()).filter((o) => o.customer.phone.replace(/[^0-9]/g, "") === "0973787909").length === 1);

  // 9. Từ hồ sơ khách → form điền sẵn
  const vy = (await ev("JSON.parse(localStorage.getItem('bo-customers-v1'))")).find((c) => c.name === "Ngô Thanh Vy");
  await go(base + `/customers?customer=${vy.id}`, 2800);
  await clickText(`${D} button`, "Tạo đơn cho khách này");
  await sleep(2800);
  const pre = await ev(`['name','phone','address'].map(id=>document.querySelector('${D} #'+id)?.value)`);
  ok("9 Hồ sơ khách → 'Tạo đơn cho khách này' điền sẵn", pre[0] === "Ngô Thanh Vy" && pre[1] === "0944 889 900", pre.join(" | "));

  // 10. Điện thoại
  await t.viewport(390, 844, true);
  await go(base + "/orders?order=new", 2800);
  await clickText(`${D} button`, "Nến có sẵn");
  await clickText(`${D} button`, "Tự phối nến"); await sleep(600); await press("Escape", "Escape", 27);
  await sleep(400);
  console.log("mobile overflow:", await t.overflow(".ant-drawer-open .ant-drawer-body"));
  await shot("o10-mobile.png");
  await ev(`document.querySelector('${D} .ant-drawer-body').scrollTop = 900`);
  await sleep(300);
  await shot("o10-mobile-2.png");
  console.log("logs:", t.logs);
});
