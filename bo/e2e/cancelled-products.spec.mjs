// E2E 10 — Sản phẩm hủy đơn: 2 cách xử lý (tạo sản phẩm trưng bày / bỏ)
import { test } from "./support/harness.mjs";

test("E2E 10 — Sản phẩm hủy đơn: 2 cách xử lý (tạo sản phẩm trưng bày / bỏ)", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const { ev, sleep, shot, click, clickText, type, pick, text, go, ok } = t;
  const D = ".ant-drawer-open";
  // Bản ghi hủy đơn chưa có công thức: thêm ở phần Phụ kiện khác
  const recipe = async () => {
    await clickText(`${D} button`, "Thêm phụ kiện");
    await sleep(300);
    await pick(`document.querySelector('${D} [aria-label="Phụ kiện dòng 1"]').closest('.ant-select')`, "Sáp dừa", true);
    await type(`document.querySelector('${D} input[aria-label="Lượng phụ kiện dòng 1"]')`, "150");
  };
  const P = base + "/cancelled-products";
  const KEY = "bo-cancelled-products-v4";
  const store = () => ev(`JSON.parse(localStorage.getItem('${KEY}')||'null')`);
  const products = () => ev("JSON.parse(localStorage.getItem('bo-products-v2')||'null')");
  const rows = () => ev(`document.querySelectorAll('.ant-table-tbody tr.ant-table-row').length`);
  const rowText = () => text(".ant-table-tbody tr.ant-table-row");
  const val = (id) => ev(`document.querySelector('${D} input#${id}')?.value`);
  const rowBtn = (i, name) => `[...document.querySelectorAll('.ant-table-tbody tr.ant-table-row')].filter(r=>r.innerText.includes('Chờ xử lý'))[${i}].querySelectorAll('button')[${name === "Bỏ" ? 1 : 0}]`;

  await go(base + "/", 1000);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  const row = (id, extra) => ({ id, name: "Beach Sunshine", custom: "Hũ gốm · " + id, personalized: false, images: ["/products/product-brown.jpg"], price: 1000000, quantity: 1, orderId: "ord-24", orderCode: "SC" + id, customerName: "A", cancelReason: "r", cancelledAt: new Date().toISOString(), status: "pending", updatedAt: new Date().toISOString(), ...extra });
  await ev(`localStorage.setItem('${KEY}', ${JSON.stringify(JSON.stringify([row("r1", { status: "converted", displayProductId: "beach-sunshine" }), row("r2", { quantity: 2 }), row("r3")]))})`);
  await go(P, 2500);

  // Danh sách & 2 lựa chọn
  const total = await rows();
  const pending = (await rowText()).filter((r) => r.includes("Chờ xử lý"));
  ok("L1 Dòng chờ xử lý có đúng 2 nút", pending.length >= 2 && pending.every((r) => r.includes("Tạo sản phẩm trưng bày") && r.includes("Bỏ")), pending[0]);
  const seg = (await text(".ant-segmented-item")).join(" | ");
  ok("L2 Chỉ còn các trạng thái mới", seg.includes("Đã tạo trưng bày") && seg.includes("Đã bỏ") && !seg.includes("Đang bán lại"), seg);
  ok("L3 Dòng đã chuyển có nhãn và link sản phẩm", (await rowText()).some((r) => r.includes("Đã tạo trưng bày") && r.includes("Xem sản phẩm")));
  await shot("c10-1-page.png");

  // Tạo trưng bày: đóng không lưu thì không đổi gì
  await click(rowBtn(0, "Tạo"));
  await sleep(2800);
  const url1 = decodeURIComponent(await ev("location.pathname + location.search"));
  const title1 = (await text(`${D} .ant-drawer-title`)).join();
  ok("C1 Sang trang trưng bày, mở drawer tạo", url1.startsWith("/products") && url1.includes("edit=from:") && title1.includes("Tạo sản phẩm trưng bày"), `${url1} | ${title1}`);
  ok("C2 Điền sẵn tên, giá; slug tự tránh trùng", (await val("name")) === "Beach Sunshine" && (await val("slug")) === "beach-sunshine-2" && (await val("price")).startsWith("1.000.000"), `${await val("name")} | ${await val("slug")} | ${await val("price")}`);
  ok("C3 Có ghi rõ nguồn từ đơn hủy", (await text(`${D} .ant-alert`)).join().includes("Lấy từ nến của đơn hủy"));
  await shot("c10-2-prefill.png");
  await click(`document.querySelector('${D} .ant-drawer-close, ${D} button[aria-label="Close"]')`);
  await sleep(900);
  const unsaved = (await store());
  ok("C4 Đóng không tạo: nến vẫn chờ xử lý, không thêm sản phẩm", unsaved.filter((c) => c.status === "pending").length === 2 && !(await products())?.some((p) => p.slug === "beach-sunshine-2"), String(unsaved.length));

  // Tạo thật
  await go(P, 2500);
  await click(rowBtn(0, "Tạo"));
  await sleep(2800);
  await recipe();
  await clickText(`${D} .ant-drawer-footer button`, "Tạo sản phẩm trưng bày");
  await sleep(1200);
  const list = await products();
  const made = list?.find((p) => p.id === "beach-sunshine-2");
  const orig = list?.find((p) => p.id === "beach-sunshine");
  ok("C5 Có sản phẩm mới", !!made && made.price === 1000000 && made.images.length > 0, JSON.stringify(made && { id: made.id, price: made.price }));
  ok("C5 Sản phẩm gốc không bị ghi đè", orig?.sold > 0 && orig?.rating > 0, JSON.stringify(orig && { sold: orig.sold, rating: orig.rating }));
  const conv = (await store()).filter((c) => c.displayProductId === "beach-sunshine-2");
  ok("C6 Cây nến chuyển 'Đã tạo trưng bày', lưu id sản phẩm", conv.length === 1 && conv[0].status === "converted");

  await go(P, 2500);
  ok("C7 Bảng hiện nhãn cho cây vừa tạo", (await rowText()).filter((r) => r.includes("Đã tạo trưng bày")).length === 2, String((await rowText()).filter((r) => r.includes("Đã tạo trưng bày")).length));

  // Bỏ
  await click(rowBtn(0, "Bỏ"));
  await sleep(500);
  await clickText(".ant-popconfirm .ant-popconfirm-buttons button", "Bỏ");
  await sleep(800);
  const after = await rowText();
  ok("D1 Bỏ: nhãn Đã bỏ, hết nút xử lý", after.some((r) => r.includes("Đã bỏ") && !r.includes("Tạo sản phẩm")) && !after.some((r) => r.includes("Chờ xử lý")), after.join(" // ").slice(0, 200));
  await shot("c10-3-done.png");

  // Link cũ của cây đã xử lý không tạo lại được
  const usedId = conv[0].id;
  await go(`${base}/products?edit=from:${usedId}`, 2800);
  ok("D2 Cây đã xử lý không mở lại drawer tạo", (await ev(`!document.querySelector('${D}')`)));

  // Lỗi ghi đè: đủ giá và ảnh nhưng slug trùng sản phẩm cũ thì phải bị chặn
  await ev(`(()=>{const l=JSON.parse(localStorage.getItem('${KEY}'));l.unshift({id:'dup-1',name:'Beach Sunshine',personalized:false,quantity:1,images:['/products/product-brown.jpg'],price:1000000,orderId:'x',orderCode:'SCDUP',customerName:'A',cancelReason:'r',cancelledAt:new Date().toISOString(),status:'pending',updatedAt:new Date().toISOString()});localStorage.setItem('${KEY}',JSON.stringify(l))})()`);
  await go(`${base}/products?edit=from:dup-1`, 2800);
  ok("S0 Slug tự tránh cả sản phẩm vừa tạo", (await val("slug")) === "beach-sunshine-3", await val("slug"));
  await type(`document.querySelector('${D} input#slug')`, "beach-sunshine");
  await sleep(300);
  await recipe();
  await clickText(`${D} .ant-drawer-footer button`, "Tạo sản phẩm trưng bày");
  await sleep(700);
  const errs = (await text(`${D} .ant-form-item-explain-error`)).join();
  const origAfter = (await products()).find((p) => p.id === "beach-sunshine");
  ok("S1 Trùng slug bị chặn, sản phẩm cũ giữ nguyên", errs.includes("Slug đã được dùng") && origAfter.sold === orig.sold && (await store()).find((c) => c.id === "dup-1").status === "pending", errs);

  // Nến tự phối: mô tả lấy từ cấu hình, chưa có ảnh thì admin phải thêm
  await ev(`(()=>{const l=JSON.parse(localStorage.getItem('${KEY}'));l.unshift({id:'cus-1',name:'Nến tự phối',custom:'Hũ gốm 150ml · Sáp đậu nành',personalized:true,images:[],price:525000,quantity:1,orderId:'x',orderCode:'SCTEST',customerName:'A',cancelReason:'r',cancelledAt:new Date().toISOString(),status:'pending',updatedAt:new Date().toISOString()});localStorage.setItem('${KEY}',JSON.stringify(l))})()`);
  await go(`${base}/products?edit=from:cus-1`, 2800);
  ok("U1 Nến tự phối: điền mô tả cấu hình", (await ev(`document.querySelector('${D} textarea#description')?.value`)).includes("Hũ gốm 150ml"));
  await recipe();
  await clickText(`${D} .ant-drawer-footer button`, "Tạo sản phẩm trưng bày");
  await sleep(800);
  ok("U2 Thiếu ảnh thì không tạo được", (await text(`${D} .ant-form-item-explain-error`)).join().includes("Thêm ít nhất một ảnh") && (await store()).find((c) => c.id === "cus-1").status === "pending");

  // Mobile: cột Xử lý ẩn, thao tác nằm trong drawer
  await t.viewport(390, 844, true);
  await go(`${P}?item=cus-1`, 2800);
  const foot = (await text(`${D} .ant-drawer-footer button`)).join(" | ");
  ok("M1 Mobile: drawer có đủ 2 nút", foot.includes("Bỏ") && foot.includes("Tạo sản phẩm trưng bày"), foot);
  console.log("mobile drawer overflow:", await t.overflow(".ant-drawer-open .ant-drawer-body"));
  await shot("c10-4-mobile-drawer.png");
  await go(P, 2500);
  console.log("mobile overflow:", await t.overflow("body"));
  await shot("c10-5-mobile.png");
  console.log("logs:", t.logs);
});
