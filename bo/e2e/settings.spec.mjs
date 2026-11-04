// E2E 15 — Trang Cài đặt và áp dụng vào tạo đơn
import { test } from "./support/harness.mjs";

test("E2E 15 — Trang Cài đặt và áp dụng vào tạo đơn", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const { ev, sleep, shot, click, clickText, byText, type, pick, text, go, ok } = t;
  const D = ".ant-drawer-open";
  const S = base + "/settings";
  const saved = () => ev("JSON.parse(localStorage.getItem('bo-settings-v1')||'null')");
  const orders = () => ev("JSON.parse(localStorage.getItem('bo-orders-v3')||'null')");
  const input = (id) => `document.querySelector('input#${id}')`;
  const preview = async () => (await text("aside.settings-preview")).join(" ");
  const saveBtn = () => byText("button", "Lưu cài đặt");
  const errors = async () => (await text(".ant-form-item-explain-error")).join(" | ");

  await go(base + "/", 1000);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  await go(S, 2500);
  ok("P1 Trang Cài đặt thật, không còn trang tạm", (await text("h3")).join().includes("Cài đặt") && !(await text("body")).join().includes("đang được xây dựng"));
  ok("P2 Giá trị mặc định", (await ev(`${input("depositPercent")}.value`)) === "50" && (await ev(`${input("maxDeliveryAttempts")}.value`)) === "3");
  ok("P3 Chưa đổi gì: nút Lưu khóa", (await text("button")).some((b) => b.includes("Đã lưu")) && (await ev(`[...document.querySelectorAll('button')].find(b=>b.innerText.includes('Đã lưu')).disabled`)));
  await shot("c15-1-page.png");

  // Xem trước chạy theo số đang nhập
  await type(input("depositPercent"), 30);
  await sleep(300);
  const pv = await preview();
  ok("V1 Xem trước đổi ngay", pv.includes("Cọc 30% khi đặt") && pv.includes("300.000") && pv.includes("700.000"), pv.slice(0, 160));
  ok("V1 Chưa lưu thì chưa ghi", !(await saved()));

  // Rời trang khi chưa lưu
  await clickText(".shell-sider a, aside a, .ant-menu-item", "Đơn hàng");
  await sleep(600);
  ok("B1 Rời trang chưa lưu: hỏi lại", (await text(".ant-modal-confirm")).join().includes("Bỏ các thay đổi chưa lưu"));
  await clickText(".ant-modal-confirm button", "Tiếp tục sửa");
  await sleep(500);
  ok("B1 Tiếp tục sửa: ở lại, giữ số", (await ev("location.pathname")) === "/settings" && (await ev(`${input("depositPercent")}.value`)) === "30");

  // Kiểm tra lỗi
  await type(input("depositPercent"), 30);
  await type(`document.querySelector('input[aria-label="Tên phương thức"]')`, "Nhanh");
  await sleep(200);
  await click(saveBtn());
  await sleep(600);
  ok("E1 Trùng tên phương thức bị chặn", (await errors()).includes("Tên phương thức bị trùng") && !(await saved()), await errors());
  await type(`document.querySelector('input[aria-label="Tên phương thức"]')`, "Tiêu chuẩn");

  // Tắt hết phương thức
  await ev(`[...document.querySelectorAll('.ship-row button[role=switch]')].forEach(b=>b.click())`);
  await sleep(300);
  await click(saveBtn());
  await sleep(600);
  ok("E2 Tắt hết phương thức bị chặn", (await errors()).includes("Cần ít nhất một phương thức"), await errors());
  // Bật lại Tiêu chuẩn, giữ Nhanh tắt
  await ev(`document.querySelectorAll('.ship-row button[role=switch]')[0].click()`);
  await sleep(300);

  // Thêm phương thức mới
  await clickText("button", "Thêm phương thức");
  await sleep(400);
  await click(saveBtn());
  await sleep(600);
  ok("E3 Phương thức mới thiếu tên bị chặn", (await errors()).includes("Nhập tên"), await errors());
  const last = (sel) => `[...document.querySelectorAll('${sel}')].at(-1)`;
  await type(last('input[aria-label="Tên phương thức"]'), "Nội thành");
  await type(last('input[aria-label="Phí vận chuyển"]'), 20000);
  await type(last('input[aria-label="Số ngày giao"]'), 2);
  await type(input("maxDeliveryAttempts"), 4);
  await type(input("resendFee"), 40000);
  await sleep(300);
  await shot("c15-2-filled.png");
  await click(saveBtn());
  await sleep(900);
  const s = await saved();
  ok("S1 Lưu đủ giá trị", s?.depositPercent === 30 && s.maxDeliveryAttempts === 4 && s.resendFee === 40000 && s.shippingOptions.length === 3, JSON.stringify(s));
  ok("S1 Mọi phương thức giữ id", s.shippingOptions.every((o) => o.id) && new Set(s.shippingOptions.map((o) => o.id)).size === 3, s.shippingOptions.map((o) => o.id).join());
  ok("S1 Phương thức mới đúng phí, số ngày", s.shippingOptions.at(-1).name === "Nội thành" && s.shippingOptions.at(-1).fee === 20000 && s.shippingOptions.at(-1).days === 2 && s.shippingOptions[1].enabled === false);
  ok("S2 Lưu xong nút khóa lại", (await text("button")).some((b) => b.includes("Đã lưu")));
  await go(S, 2500);
  ok("S3 Tải lại vẫn giữ", (await ev(`${input("depositPercent")}.value`)) === "30" && (await ev(`document.querySelectorAll('.ship-row:not(.ship-head)').length`)) === 3);

  // Áp dụng vào tạo đơn
  await go(base + "/orders?order=new", 2800);
  const radio = (await text(`${D} .ant-radio-wrapper`)).join(" | ");
  ok("O1 Chỉ hiện phương thức đang dùng", radio.includes("Tiêu chuẩn (3 ngày)") && radio.includes("Nội thành (2 ngày)") && !radio.includes("Nhanh"), radio);
  ok("O2 Nút cọc theo cài đặt", (await text(`${D} .ant-radio-button-wrapper`)).join().includes("Cọc 30%"));
  await clickText(`${D} button`, "Nến có sẵn");
  await sleep(300);
  await pick(`document.querySelectorAll('${D} [aria-label="Chọn sản phẩm"]')[0].closest('.ant-select')`, "Moon Morning", true);
  await pick(`document.querySelector('${D} input#customerId').closest('.ant-select')`, "Wing Sun", true);
  await sleep(300);
  await clickText(`${D} .ant-radio-wrapper`, "Nội thành");
  await sleep(300);
  const fee1 = await ev(`document.querySelector('${D} input#shippingFee').value`);
  ok("O3 Chọn phương thức: phí tự điền", fee1 === "20.000", fee1);
  await type(`document.querySelector('${D} input#shippingFee')`, 15000);
  await sleep(300);
  const sum = (await text(`${D} aside.order-summary`)).join(" ");
  ok("O4 Sửa phí tay: tóm tắt cập nhật, cọc 30%", sum.includes("15.000") && sum.includes("Cọc 30% khi đặt"), sum.slice(0, 200));
  await shot("c15-3-order.png");
  await clickText(`${D} .ant-drawer-footer button`, "Tạo đơn");
  await sleep(1800);
  const o = (await orders())[0];
  ok("O5 Đơn lưu phí sửa tay, tên phương thức, % cọc", o.shippingFee === 15000 && o.shippingName === "Nội thành (2 ngày)" && o.shippingDays === 2 && o.depositPercent === 30, JSON.stringify({ f: o.shippingFee, n: o.shippingName, d: o.depositPercent }));
  ok("O5 Tiền cọc đúng 30%", o.payments[0].amount === Math.round((o.total * 0.3) / 1000) * 1000, `${o.total} -> ${o.payments[0].amount}`);

  // Đổi cài đặt: đơn đã tạo giữ nguyên, đơn cũ vẫn 50%
  await ev(`(()=>{const s=JSON.parse(localStorage.getItem('bo-settings-v1'));s.depositPercent=70;localStorage.setItem('bo-settings-v1',JSON.stringify(s))})()`);
  await go(`${base}/orders?order=${o.id}`, 2800);
  const body = (await text(`${D} .ant-drawer-body`)).join(" ");
  ok("H1 Đơn vừa tạo giữ cọc 30% và tên phương thức", body.includes("Cọc 30%") && body.includes("Nội thành (2 ngày)") && !body.includes("Cọc 70%"), body.slice(0, 120));
  await go(`${base}/orders?order=ord-2`, 2800);
  const old = (await text(`${D} .ant-drawer-body`)).join(" ");
  ok("H2 Đơn mẫu cũ không lỗi hiển thị", old.includes("Hình thức") && (old.includes("Tiêu chuẩn") || old.includes("Nhanh")), old.slice(0, 80));

  // Khôi phục mặc định chỉ có hiệu lực khi lưu
  await go(S, 2500);
  await clickText("button", "Mặc định");
  await sleep(400);
  await clickText(".ant-popconfirm-buttons button", "Khôi phục");
  await sleep(500);
  ok("R1 Mặc định: điền lại nhưng chưa lưu", (await ev(`${input("depositPercent")}.value`)) === "50" && (await saved()).depositPercent === 70);

  // Mobile
  await ev(`localStorage.removeItem('bo-settings-v1')`);
  await t.viewport(390, 844, true);
  await go(S, 2500);
  console.log("mobile overflow:", await t.overflow("body"));
  await shot("c15-4-mobile.png", true);
  await t.viewport(1024, 800);
  await go(S, 2500);
  console.log("1024 overflow:", await t.overflow("body"));
  await shot("c15-5-1024.png");
  console.log("logs:", t.logs);
});
