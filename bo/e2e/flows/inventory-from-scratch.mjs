// Luồng E2E 1 dựng kho nguyên liệu từ trống. Dùng ở inventory.spec.mjs (kiểm tra) và craft-builder.spec.mjs (cần kho này để dựng Thủ công).
// t.ok là no-op khi chỉ cần dữ liệu.
export async function inventoryFromScratch(t) {
  const base = t.base;
  const bo = t.base;
  const out = t.out;
  const { ev, sleep, shot, click, clickText, byText, type, pick, text, go, ok, overflow } = t;
  const inv = () => ev("JSON.parse(localStorage.getItem('bo-inventory-v2')||'null')");
  const mat = async (name) => (await inv()).materials.find((m) => m.name === name);

  // TC-K0: xóa sạch dữ liệu 2 trang
  await go(base + "/", 1200);
  await ev(`localStorage.setItem('bo-inventory-v2', JSON.stringify({materials:[],movements:[]}));
  localStorage.setItem('bo-craft-builder-v5', JSON.stringify({version:1,currency:'VND',steps:[]}));`);
  await go(base + "/inventory", 2500);
  const empty = await ev("document.querySelector('main').innerText");
  ok("TC-K0 kho trống hướng dẫn thêm nguyên liệu (không báo 'khớp bộ lọc')", empty.includes("Kho chưa có nguyên liệu") && !empty.includes("khớp bộ lọc"), empty.replace(/\s+/g, " ").slice(0, 400));
  await shot("k0-empty.png", true);

  // TC-K1: thêm nguyên liệu qua drawer (đủ loại & đơn vị)
  const seeds = [
    { name: "Hũ thủy tinh 150ml", sku: "HU-TT-150", cat: "Hũ & nắp", unit: "Cái", stock: 20, low: 5, paid: 360000 },
    { name: "Hũ thủy tinh 250ml", sku: "HU-TT-250", cat: "Hũ & nắp", unit: "Cái", stock: 4, low: 5, paid: 100000 },
    { name: "Nắp gỗ 150ml", cat: "Hũ & nắp", unit: "Cái", stock: 10, paid: 50000 },
    { name: "Sáp đậu nành", sku: "SAP-DN", cat: "Sáp", unit: "Gram", stock: 5000, low: 1000, paid: 300000 },
    { name: "Tinh dầu Vanilla", cat: "Tinh dầu", unit: "Mililít", stock: 300, paid: 540000 },
    { name: "Tinh dầu Oải hương", cat: "Tinh dầu", unit: "Mililít", stock: 0 },
    { name: "Bấc cotton", cat: "Bấc", unit: "Cái", stock: 100, paid: 150000 },
    { name: "Hộp quà", cat: "Bao bì", unit: "Cái", stock: 3, free: true },
    { name: "Màu nhuộm hồng", cat: "Màu nhuộm", unit: "Mililít", stock: 50, untracked: false, paid: 75000 },
  ];
  const freeBox = (scope) => click(`[...document.querySelectorAll('${scope} .ant-checkbox-wrapper')].find(l=>l.innerText.includes('Không mất tiền'))`);
  const drawerText = () => ev("document.querySelector('.ant-drawer-open').innerText");
  for (const [i, s] of seeds.entries()) {
    await clickText("main button", "Thêm nguyên liệu");
    await sleep(900);
    await type(`document.querySelector('.ant-drawer-open input#name')`, s.name);
    if (s.sku) await type(`document.querySelector('.ant-drawer-open input#sku')`, s.sku);
    await pick(`document.querySelector('.ant-drawer-open input#category').closest('.ant-select')`, s.cat);
    await clickText(".ant-drawer-open .ant-radio-button-wrapper", s.unit, true);
    await type(`document.querySelector('.ant-drawer-open input#stock')`, s.stock);
    if (s.low !== undefined) await type(`document.querySelector('.ant-drawer-open input#lowStock')`, s.low);
    if (i === 0) {
      // Có tồn ban đầu mà chưa ghi tiền mua → chặn, báo ngay ô tiền
      await clickText(".ant-drawer-open .ant-drawer-footer button", "Thêm vào kho");
      await sleep(500);
      ok("TC-K1 tồn ban đầu chưa ghi tiền mua → chặn lưu", (await drawerText()).includes("Nhập tổng tiền đã trả cho lô") && !(await inv())?.materials.length);
    }
    if (s.paid) await type(`document.querySelector('.ant-drawer-open input[aria-label="Tổng tiền đã trả"]')`, s.paid);
    if (s.free) await freeBox(".ant-drawer-open");
    if (i === 3) ok("TC-K1 xem trước giá mỗi gam từ tiền mua", (await drawerText()).includes("= 60"), (await drawerText()).match(/= [^\n]*/)?.[0]);
    if (i === 0) await shot("k1-add-drawer.png");
    await clickText(".ant-drawer-open .ant-drawer-footer button", "Thêm vào kho");
    await sleep(700);
  }
  const all = (await inv()).materials;
  ok("TC-K1 thêm 9 nguyên liệu", all.length === 9, all.map((m) => `${m.id}:${m.category}/${m.unit}/${m.stock}/${m.lowStock}`).join(", "));
  ok("TC-K1 đơn vị ml lưu đúng", (await mat("Tinh dầu Vanilla"))?.unit === "ml");
  ok("TC-K1 ngưỡng mặc định ml = 500", (await mat("Tinh dầu Vanilla"))?.lowStock === 500, String((await mat("Tinh dầu Vanilla"))?.lowStock));
  ok("TC-K1 tạo mới có tồn ban đầu → có phiếu 'Tồn ban đầu'", (await inv()).movements.filter((m) => m.note === "Tồn ban đầu").length === 8, `${(await inv()).movements.length} phiếu`);
  ok("TC-K1 id phiếu không trùng", new Set((await inv()).movements.map((m) => m.id)).size === (await inv()).movements.length);
  const waxOpening = (await inv()).movements.find((m) => m.note === "Tồn ban đầu" && m.materialId === (all.find((x) => x.name === "Sáp đậu nành") ?? {}).id);
  ok("TC-K1 tiền mua tồn ban đầu → giá nhập 300.000 ₫ ÷ 5.000 g = 60 ₫/g", (await mat("Sáp đậu nành"))?.unitCost === 60 && waxOpening?.totalCost === 300000 && waxOpening?.unitCost === 60, JSON.stringify(waxOpening));
  ok("TC-K1 hàng không mất tiền → giá 0, phiếu ghi tiền 0", (await mat("Hộp quà"))?.unitCost === 0, String((await mat("Hộp quà"))?.unitCost));
  ok("TC-K1 tồn 0 → chưa có giá nhập", (await mat("Tinh dầu Oải hương"))?.unitCost === undefined);
  console.log("stats:", (await text("main .ant-statistic")).join(" | "));
  console.log("restock:", (await text("main [aria-label='Cần nhập thêm'], main .restock-panel")).join(" | ").slice(0, 300));
  console.log("nav:", (await text(".ant-menu-item")).filter((x) => x.includes("Kho")).join());
  await shot("k1-list.png", true);

  // TC-K2: nhập kho trong drawer
  await click(byText("main .ant-table-row a, main .ant-table-row .ant-typography", "Tinh dầu Oải hương"));
  await sleep(1200);
  await type(`document.querySelector('.ant-drawer-open input[aria-label="Số lượng"]')`, 200);
  await type(`document.querySelector('.ant-drawer-open input[aria-label="Ghi chú phiếu"]')`, "Lô tháng 11");
  // Chưa ghi tiền lô → không ghi phiếu, báo lỗi
  await clickText(".ant-drawer-open button", "Ghi nhận", true);
  await sleep(400);
  const lotHint = await ev(`document.querySelector('.ant-drawer-open section[aria-label="Tồn kho hiện tại"] [role=status]').innerText`);
  ok("TC-K2 nhập thêm chưa ghi tiền lô → chặn", (await mat("Tinh dầu Oải hương"))?.stock === 0 && lotHint.includes("Nhập tổng tiền đã trả cho lô"), lotHint);
  await type(`document.querySelector('.ant-drawer-open input[aria-label="Tổng tiền lô"]')`, 440000);
  const lotOk = await ev(`document.querySelector('.ant-drawer-open section[aria-label="Tồn kho hiện tại"] [role=status]').innerText`);
  ok("TC-K2 xem trước giá lô 2.200 ₫/ml", lotOk.includes("giá lô 2.200"), lotOk);
  await clickText(".ant-drawer-open button", "Ghi nhận", true);
  await sleep(500);
  ok("TC-K2 nhập 200ml oải hương", (await mat("Tinh dầu Oải hương"))?.stock === 200);
  ok("TC-K2 giá nhập từ lô đầu tiên = 2.200 ₫/ml", (await mat("Tinh dầu Oải hương"))?.unitCost === 2200, String((await mat("Tinh dầu Oải hương"))?.unitCost));
  const hist = await text(".ant-drawer-open [role=listitem]");
  ok("TC-K2 lịch sử trong drawer cập nhật", hist.some((h) => h.includes("+200")), hist.join(" | "));

  // TC-K3: xuất quá số tồn
  await clickText(".ant-drawer-open .ant-segmented-item", "Xuất kho");
  await type(`document.querySelector('.ant-drawer-open input[aria-label="Số lượng"]')`, 500);
  await sleep(200);
  await shot("k3-out-over.png");
  const hint = await ev(`document.querySelector('.ant-drawer-open section[aria-label="Tồn kho hiện tại"]').innerText`);
  console.log("  khung phiếu khi xuất 500 > 200:", hint.replace(/\s+/g, " "));
  ok("TC-K3 báo 'Chỉ còn 200 ml' và khóa nút", hint.includes("Chỉ còn 200 ml") && await ev(`[...document.querySelectorAll('.ant-drawer-open button')].find(b=>b.innerText.trim()==='Ghi nhận').disabled`));
  await clickText(".ant-drawer-open button", "Ghi nhận", true);
  await sleep(500);
  const lastMv = (await inv()).movements[0];
  ok("TC-K3 xuất quá tồn bị chặn hoặc cảnh báo", (await mat("Tinh dầu Oải hương"))?.stock === 200, `stock=${(await mat("Tinh dầu Oải hương"))?.stock}, phiếu ${lastMv.type} ${lastMv.change}`);

  // TC-K4: kiểm kê
  await clickText(".ant-drawer-open .ant-segmented-item", "Kiểm kê");
  await type(`document.querySelector('.ant-drawer-open input[aria-label="Số đếm thực tế"]')`, 180);
  await clickText(".ant-drawer-open button", "Ghi nhận", true);
  await sleep(500);
  const adj = (await inv()).movements[0];
  ok("TC-K4 kiểm kê đặt lại tồn", (await mat("Tinh dầu Oải hương"))?.stock === 180 && adj.type === "adjust", `${adj.type} change ${adj.change} after ${adj.after}`);
  await shot("k4-drawer.png", true);
  const xCovered = await ev(`(()=>{const b=document.querySelector('.ant-drawer-open .ant-drawer-close');const r=b.getBoundingClientRect();const top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !b.contains(top) ? (top.closest('.ant-message')?'toast':top.tagName) : ''})()`);
  ok("TC-K4b nút X của drawer không bị che sau khi ghi phiếu", !xCovered, xCovered);
  await t.press("Escape", "Escape", 27);
  await sleep(1500);

  // TC-K5: nút + trên bảng → modal phiếu, nguyên liệu đặt sẵn
  console.log("  trước khi bấm +:", await t.loc(), await ev("document.querySelectorAll('.ant-drawer-open,.ant-drawer-mask').length"));
  await click(`document.querySelector('main button[aria-label="Nhập thêm Hộp quà"]')`);
  await sleep(900);
  await shot("k5-after-plus.png");
  console.log("  sau khi bấm +:", await t.loc(), await ev("[...document.querySelectorAll('.ant-modal-wrap,.ant-drawer-open')].map(x=>x.className.slice(0,60))"));
  const preset = await ev(`document.querySelector('.ant-modal .ant-select')?.innerText`);
  ok("TC-K5 modal mở với Hộp quà chọn sẵn", preset?.includes("Hộp quà"), preset);
  await type(`document.querySelector('.ant-modal input#amount')`, 20);
  const preview = await ev(`document.querySelector('.ant-modal-body').innerText`);
  ok("TC-K5 xem trước số tồn sau phiếu", preview.includes("Sau phiếu: 23"), preview.replace(/\s+/g, " ").slice(-80));
  await clickText(".ant-modal-footer button", "Ghi nhận");
  await sleep(400);
  const lotErr = (await text(".ant-modal .ant-form-item-explain-error")).join();
  ok("TC-K5 modal chặn nhập thiếu tiền lô", lotErr.includes("Nhập tổng tiền đã trả cho lô") && (await mat("Hộp quà"))?.stock === 3, lotErr);
  await type(`document.querySelector('.ant-modal input[aria-label="Tổng tiền lô"]')`, 100000);
  await clickText(".ant-modal-footer button", "Ghi nhận");
  await sleep(600);
  ok("TC-K5 nhập 20 hộp quà", (await mat("Hộp quà"))?.stock === 23);
  // 3 hộp 0 ₫ + 20 hộp 5.000 ₫, chia 23 hộp
  ok("TC-K5 giá bình quân tính cả hàng không mất tiền", (await mat("Hộp quà"))?.unitCost === 4347.83, String((await mat("Hộp quà"))?.unitCost));

  // TC-K6: phiếu kho từ header — xuất hao hụt hũ
  await clickText("main button", "Phiếu kho");
  await sleep(700);
  await clickText(".ant-modal .ant-segmented-item", "Xuất");
  await click(`document.querySelector('.ant-modal input#materialId').closest('.ant-select')`); await sleep(300);
  const modalOpts = await text(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item");
  ok("TC-K6 phiếu kho không có mục 'Không theo dõi'", !modalOpts.some((o) => o.includes("Không theo dõi")), modalOpts.slice(0, 3).join(" | "));
  await t.send("Input.insertText", { text: "hu thuy" }); await sleep(300);
  const folded = await text(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option");
  ok("TC-K6 tìm nguyên liệu không dấu 'hu thuy'", folded.length === 2 && folded.every((o) => o.includes("Hũ thủy tinh")), folded.join(" | "));
  await t.press("Escape", "Escape", 27); await sleep(200);
  await pick(`document.querySelector('.ant-modal input#materialId').closest('.ant-select')`, "Hũ thủy tinh 150ml", true);
  console.log("  ô chọn nguyên liệu trong phiếu có mục:", (await text(".ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item")).slice(0, 4));
  await type(`document.querySelector('.ant-modal input#amount')`, 99);
  await clickText(".ant-modal-footer button", "Ghi nhận"); await sleep(400);
  const err = (await text(".ant-modal .ant-form-item-explain-error")).join();
  ok("TC-K6 modal chặn xuất quá tồn", err.includes("Chỉ còn 20 cái"), err);
  await type(`document.querySelector('.ant-modal input#amount')`, 2);
  await type(`document.querySelector('.ant-modal textarea')`, "Vỡ khi vận chuyển");
  await shot("k6-modal.png");
  await clickText(".ant-modal-footer button", "Ghi nhận");
  await sleep(600);
  ok("TC-K6 xuất 2 hũ 150ml", (await mat("Hũ thủy tinh 150ml"))?.stock === 18);

  // TC-K7: phân loại / lọc / tìm / sắp xếp
  await clickText("main .ant-segmented-item", "Sắp hết");
  await sleep(400);
  let rows = await text("main .ant-table-row");
  ok("TC-K7 lọc sắp hết", rows.length && rows.every((r) => r.includes("Sắp hết")), rows.map((r) => r.slice(0, 40)).join(" | "));
  await clickText("main .ant-segmented-item", "Tất cả");
  await pick(`document.querySelector('main [aria-label="Loại nguyên liệu"]')?.closest('.ant-select') || document.querySelector('main .ant-select')`, "Tinh dầu");
  await sleep(300);
  rows = await text("main .ant-table-row");
  ok("TC-K7 lọc loại Tinh dầu", rows.length === 2, rows.map((r) => r.slice(0, 30)).join(" | "));
  await type(`document.querySelector('main input[aria-label="Tìm nguyên liệu"]')`, "vani");
  await sleep(300);
  rows = await text("main .ant-table-row");
  ok("TC-K7 tìm không dấu 'vani'", rows.length === 1 && rows[0].includes("Vanilla"), rows.join(" | ").slice(0, 100));
  await shot("k7-filter.png");
  await type(`document.querySelector('main input[aria-label="Tìm nguyên liệu"]')`, "");
  await click(`document.querySelector('main .ant-select-clear') || document.querySelector('main .ant-select')`);
  await sleep(300);
  rows = await text("main .ant-table-row");
  console.log("  sắp xếp cần nhập trước:", rows.map((r) => r.split(" ").slice(0, 4).join(" ")).join(" | "));

  // TC-K8: sửa thông tin + không theo dõi
  await click(byText("main .ant-table-row a, main .ant-table-row .ant-typography", "Bấc cotton"));
  await sleep(1100);
  await type(`document.querySelector('.ant-drawer-open input#sku')`, "BAC-CT");
  await clickText(".ant-drawer-open .ant-drawer-footer button", "Lưu thông tin");
  await sleep(600);
  ok("TC-K8 sửa mã nội bộ", (await mat("Bấc cotton"))?.sku === "BAC-CT");
  ok("TC-K8 lưu thông tin không đụng giá nhập", (await mat("Bấc cotton"))?.unitCost === 1500, String((await mat("Bấc cotton"))?.unitCost));

  console.log("movements:", (await inv()).movements.map((m) => `${m.materialId}:${m.type}${m.change}→${m.after}`).join(", "));
  console.log("overflow:", await overflow());
  await t.viewport(390, 844, true);
  await go(base + "/inventory", 2500);
  console.log("mobile overflow:", await overflow(), "scrollW", await ev("document.documentElement.scrollWidth"));
  await shot("k9-mobile.png", true);
  await go(base + "/inventory?material=" + (await mat("Tinh dầu Oải hương")).id, 2500);
  await shot("k9-mobile-drawer.png");
  console.log("logs:", t.logs);
}
