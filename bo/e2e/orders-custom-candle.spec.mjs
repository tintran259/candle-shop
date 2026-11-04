// E2E 8 — Drawer tạo đơn bố cục mới + nến tự phối theo các bước Thủ công, dùng nguyên liệu trong Kho
import { SF_URL, test } from "./support/harness.mjs";

test("E2E 8 — Drawer tạo đơn bố cục mới + nến tự phối theo các bước Thủ công, dùng nguyên liệu trong Kho", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const sf = SF_URL;
  const { ev, sleep, shot, click, clickText, byText, type, pick, text, go, ok, press } = t;
  const D = ".ant-drawer-open";
  const M = ".ant-modal-wrap .ant-modal";
  const orders = () => ev("JSON.parse(localStorage.getItem('bo-orders-v3')||'null')");
  const option = (step, name) => `[...document.querySelectorAll('${M} #cfg-step-${step} .cfg-option')].find(b=>b.innerText.includes(${JSON.stringify(name)}))`;

  await go(base + "/", 1000);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  await go(base + "/orders?order=new", 2800);

  // Bố cục 2 cột ở màn rộng
  const layout = await ev(`(()=>{const a=document.querySelector('${D} aside.order-summary');const f=document.querySelector('${D} .ant-form section');if(!a||!f)return null;const ra=a.getBoundingClientRect(),rf=f.getBoundingClientRect();return {summaryLeft:Math.round(ra.left),formRight:Math.round(rf.right),summaryTop:Math.round(ra.top)}})()`);
  ok("L1 Màn 1440: tóm tắt đơn nằm cột phải", layout && layout.summaryLeft > layout.formRight, JSON.stringify(layout));
  await shot("c8-1-layout.png");

  // Mở modal tự phối
  await clickText(`${D} button`, "Tự phối nến");
  await sleep(900);
  const titles = await text(`${M} .cfg-step > div:first-child`);
  ok("C1 Modal đi đúng các bước đang hiện của Thủ công", titles.length === 7 && titles[0].includes("Hũ nến"), titles.join(" | "));
  // Kho: Rose hết → khóa; Hũ gốm 200ml hết → khóa cỡ
  const rose = await ev(`(()=>{const b=${option("fragrance", "Rose")};return b&&(b.disabled+'|'+b.innerText.replace(/\\s+/g,' '))})()`);
  ok("C2 Rose hết tinh dầu trong Kho → khóa 'Hết nguyên liệu'", rose?.startsWith("true") && rose.includes("Hết nguyên liệu"), rose);
  await click(byText(`${M} .ant-modal-footer button`, "Thêm vào đơn"));
  await sleep(500);
  const errs = await text(`${M} [role=alert]`);
  ok("C3 Bấm thêm khi chưa chọn → báo từng bước", errs.some((e) => e.includes("Chọn hũ")) && errs.some((e) => e.includes("Chưa chọn")), errs.join(" | "));
  await click(option("container", "Hũ gốm"));
  await sleep(300);
  const sizes = await ev(`[...document.querySelectorAll('${M} #cfg-step-container .sf-chip')].map(c=>c.innerText+(c.disabled?' [khóa]':''))`);
  ok("C4 Hũ gốm: cỡ 200ml hết hũ → khóa", sizes.some((s) => s.startsWith("200ml") && s.includes("[khóa]")), sizes.join(" | "));
  await click(`[...document.querySelectorAll('${M} #cfg-step-container .sf-chip')].find(c=>c.innerText.startsWith('150ml'))`);
  await clickText(`${M} #cfg-step-container .ant-checkbox-wrapper`, "Thêm nắp");
  await click(option("wax", "Sáp đậu nành"));
  await click(option("fragrance", "Vanilla"));
  await click(option("fragrance", "Lavender"));
  await sleep(200);
  await type(`document.querySelector('${M} input[aria-label="Tỉ lệ Vanilla"]')`, 70);
  await type(`document.querySelector('${M} input[aria-label="Tỉ lệ Lavender"]')`, 30);
  await click(option("wick", "Bấc cotton"));
  await click(option("color", "Trắng kem"));
  await type(`document.querySelector('${M} #cfg-step-personalization input')`, "Sun");
  await sleep(300);
  const sum = (await text(`${M} aside.cfg-summary`))[0];
  console.log("  tóm tắt:", sum);
  ok("C5 Mô tả tự sinh đủ các bước", sum.includes("Hũ gốm 150ml") && sum.includes("Có nắp") && sum.includes("Vanilla 70% + Lavender 30% (vừa)") && sum.includes("“Sun”"), sum.slice(0, 160));
  ok("C5 Giá 1 hũ = 400.000 gốc + 100.000 gốm + 25.000 nắp + …", /Giá 1 hũ\s*[\d.]+/.test(sum));
  ok("C6 Liệt kê nguyên liệu trừ Kho cho 1 hũ (hũ, nắp, sáp 120g, tinh dầu ml)", sum.includes("Hũ gốm trụ 150ml") && sum.includes("Nắp gỗ hũ gốm 150ml") && /Sáp đậu nành\s*120 \/ 9\.000 g/.test(sum) && /Tinh dầu Vanilla\s*7 \//.test(sum), sum);
  const jarsText = await ev(`document.querySelector('${M} .cfg-jars').innerText`);
  ok("C6 Báo số hũ Kho làm được (nắp gốm 150ml còn 6 → 6 hũ)", jarsText === "Kho đủ làm 6 hũ", jarsText);
  const unit = Number((sum.match(/Giá 1 hũ\s*([\d.]+)/) ?? [])[1].replace(/\./g, ""));
  await shot("c8-2-modal.png");
  await click(byText(`${M} .ant-modal-footer button`, "Thêm vào đơn"));
  await sleep(700);

  // Dòng tự phối trong đơn
  const row = (await text(`${D} .order-line`))[0];
  ok("C7 Dòng 'Nến tự phối' có mô tả, 'Kho đủ 6 hũ', đơn giá", row.includes("Nến tự phối") && row.includes("Kho đủ 6 hũ") && row.includes(`Đơn giá`), row);
  await type(`document.querySelector('${D} .order-line input[aria-label="Số lượng"]')`, 8);
  await sleep(300);
  await clickText(`${D} .ant-drawer-footer button`, "Tạo đơn");
  await sleep(600);
  const qErr = (await text(`${D} .order-line .ant-form-item-explain-error`)).join();
  ok("C8 Số lượng 8 > 6 → 'Kho chỉ đủ 6 hũ'", qErr.includes("Kho chỉ đủ 6 hũ"), qErr);
  const short = (await text(`${D} aside.order-summary .ant-alert`)).join();
  ok("C8 Tóm tắt báo nguyên liệu thiếu", short.includes("Nắp gỗ hũ gốm 150ml: cần 8, còn 6"), short);
  await type(`document.querySelector('${D} .order-line input[aria-label="Số lượng"]')`, 2);

  // Sửa cấu hình → mở lại đúng lựa chọn cũ
  await clickText(`${D} .order-line button`, "Sửa cấu hình");
  await sleep(900);
  const kept = await ev(`[...document.querySelectorAll('${M} .cfg-option[aria-checked=true]')].map(b=>b.innerText.split('\\n')[0])`);
  ok("C9 Sửa cấu hình giữ lựa chọn cũ", ["Hũ gốm", "Sáp đậu nành", "Vanilla", "Lavender"].every((n) => kept.includes(n)), kept.join(", "));
  await click(option("wax", "Sáp dừa"));
  await click(byText(`${M} .ant-modal-footer button`, "Cập nhật nến"));
  await sleep(600);
  ok("C9 Cập nhật → mô tả đổi sang Sáp dừa", (await text(`${D} .order-line`))[0].includes("Sáp dừa"));

  // Thêm nến có sẵn + khách → tạo đơn
  await clickText(`${D} button`, "Nến có sẵn");
  await sleep(300);
  await pick(`document.querySelectorAll('${D} [aria-label="Chọn sản phẩm"]')[0].closest('.ant-select')`, "Moon Morning", true);
  await pick(`document.querySelector('${D} input#customerId').closest('.ant-select')`, "Wing Sun", true);
  await sleep(300);
  await shot("c8-3-filled.png");
  const summaryText = (await text(`${D} aside.order-summary`))[0];
  console.log("  tóm tắt đơn:", summaryText.slice(0, 200));
  await clickText(`${D} .ant-drawer-footer button`, "Tạo đơn");
  await sleep(1800);
  const o = (await orders())[0];
  const item = o.items.find((i) => i.custom);
  ok("C10 Đơn lưu cấu hình tự phối (craft) + mô tả + giá", !!item?.craft?.container && item.custom.includes("Sáp dừa") && item.quantity === 2 && item.price > unit - 1, JSON.stringify({ custom: item?.custom, price: item?.price }));
  ok("C10 Tổng đơn khớp tóm tắt", summaryText.includes(new Intl.NumberFormat("vi-VN").format(o.total)), String(o.total));

  // Màn hẹp
  await t.viewport(768, 1000);
  await go(base + "/orders?order=new", 2800);
  await clickText(`${D} button`, "Tự phối nến");
  await sleep(900);
  await shot("c8-4-modal-tablet.png");
  await press("Escape", "Escape", 27);
  await sleep(600);
  await t.viewport(390, 844, true);
  await go(base + "/orders?order=new", 2800);
  await clickText(`${D} button`, "Nến có sẵn");
  await sleep(300);
  console.log("mobile overflow:", await t.overflow(".ant-drawer-open .ant-drawer-body"));
  await shot("c8-5-mobile.png");
  await clickText(`${D} button`, "Tự phối nến");
  await sleep(900);
  console.log("mobile modal overflow:", await t.overflow(".ant-modal"));
  await shot("c8-6-mobile-modal.png");
  console.log("logs:", t.logs);
});
