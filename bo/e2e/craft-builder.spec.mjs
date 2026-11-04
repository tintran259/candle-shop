// E2E 2 — Thủ công từ trống trên kho đã tạo ở E2E 1: thêm bước, custom từng bước, gắn kho, kiểm tra mapping
import { inventoryFromScratch } from "./flows/inventory-from-scratch.mjs";
import { SF_URL, test } from "./support/harness.mjs";

test("E2E 2 — Thủ công từ trống trên kho đã tạo ở E2E 1: thêm bước, custom từng bước, gắn kho, kiểm tra mapping", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const sf = SF_URL;
  const { ev, sleep, shot, click, clickText, byText, type, pick, text, go, ok, overflow, press } = t;
  const inv = () => ev("JSON.parse(localStorage.getItem('bo-inventory-v2')||'null')");
  // Trang Thủ công sửa bản nháp; chưa có nháp thì là bản đã lưu
  const cfg = () => ev("JSON.parse(localStorage.getItem('bo-craft-builder-v5-draft')||'null') || JSON.parse(localStorage.getItem('bo-craft-builder-v5')||'null')");
  const savedCfg = () => ev("JSON.parse(localStorage.getItem('bo-craft-builder-v5')||'null')");
  const stepOf = async (title) => (await cfg()).steps.find((s) => s.title.vi === title);
  const esc = async () => { await press("Escape", "Escape", 27); await sleep(900); };
  const issues = () => text("main .ant-alert-error li, main .ant-alert-warning li");

  // Kho từ E2E 1 (không ghi lại các mục kiểm tra của kho), rồi về cỡ màn hình chuẩn
  await inventoryFromScratch({ ...t, ok: () => {}, shot: async () => {} });
  await t.viewport(1440, 1000);

  // TC-T0: trang Thủ công trống (kho giữ nguyên từ E2E 1)
  await go(base + "/", 1200);
  await ev(`localStorage.setItem('bo-craft-builder-v5', JSON.stringify({version:1,currency:'VND',steps:[]})); localStorage.removeItem('bo-craft-builder-v5-draft')`);
  await go(base + "/craft", 2600);
  console.log("T0 trang trống:", (await ev("document.querySelector('main').innerText")).replace(/\s+/g, " ").slice(0, 500));
  await shot("t0-empty.png", true);

  // Thêm bước qua modal
  const addStep = async (kindLabel, title) => {
    await clickText("main button", "Thêm bước");
    await sleep(700);
    await clickText(".ant-modal .kind-card", kindLabel);
    await type(`document.querySelector('.ant-modal input#title')`, title);
    await clickText(".ant-modal-footer button", "Tạo bước");
    await sleep(900);
  };
  const tab = async (label) => { await clickText("main .ant-tabs-tab", label); await sleep(500); };

  // TC-T1: bước Hũ + kích thước
  await addStep("Hũ", "Hũ nến");
  ok("TC-T1 tạo bước hũ", (await stepOf("Hũ nến"))?.kind === "vessel", await t.loc());
  await tab("Kích thước");
  await clickText("main button", "Thêm kích thước");
  await clickText("main button", "Thêm kích thước");
  let sizes = (await stepOf("Hũ nến")).sizes;
  ok("TC-T1 cỡ mới mặc định 150ml, 200ml, id không chứa ml", sizes.map((s) => s.ml).join() === "150,200" && sizes.every((s) => s.id.startsWith("size-")), sizes.map((s) => `${s.id}:${s.ml}ml/${s.grams}g`).join(", "));
  const sizeRow = (i) => `document.querySelectorAll('main .ant-table-row')[${i}]`;
  for (const [i, s] of [{ ml: 150, g: 120, price: 350000 }, { ml: 250, g: 200, price: 520000 }].entries()) {
    await type(`${sizeRow(i)}.querySelectorAll('input')[0]`, s.ml);
    await type(`${sizeRow(i)}.querySelectorAll('input')[1]`, s.g);
    await type(`${sizeRow(i)}.querySelectorAll('input')[2]`, s.price);
    await click(`${sizeRow(i)}.querySelector('.ant-switch')`);
  }
  sizes = (await stepOf("Hũ nến")).sizes;
  ok("TC-T1 sửa 2 cỡ 150ml / 250ml", sizes.map((s) => `${s.ml}/${s.grams}/${s.basePrice}/${s.available}`).join() === "150/120/350000/true,250/200/520000/true", JSON.stringify(sizes));
  await shot("t1-sizes.png");

  const t1Issues = await issues();
  ok("TC-T1 không báo trùng khi hũ chưa có lựa chọn", t1Issues.length === 1 && t1Issues[0].includes("chưa có lựa chọn nào"), t1Issues.join(" | "));
  // TC-T2: lựa chọn hũ gắn kho theo cỡ
  await tab("Hũ");
  await clickText("main button", "Thêm lựa chọn");
  await sleep(1200);
  await type(`document.querySelector('.ant-drawer-open input#nameVi')`, "Thủy tinh");
  await type(`document.querySelector('.ant-drawer-open input#price')`, 30000);
  await click(`document.querySelector('.ant-drawer-open #switch-hasLid')`);
  await sleep(300);
  const sel = (label) => `document.querySelector('.ant-drawer-open [aria-label="${label}"]').closest('.ant-select')`;
  await pick(sel("Hũ trong kho 150ml"), "Hũ thủy tinh 150ml", true);
  await pick(sel("Nắp trong kho 150ml"), "Nắp gỗ 150ml", true);
  await pick(sel("Hũ trong kho 250ml"), "Hũ thủy tinh 250ml", true);
  await pick(sel("Nắp trong kho 250ml"), "Không theo dõi");
  console.log("  thẻ xem trước:", (await text(".ant-drawer-open section[aria-label='Xem trước']"))[0]);
  await shot("t2-vessel-drawer.png");
  await clickText(".ant-drawer-open .ant-drawer-footer button", "Thêm lựa chọn");
  await sleep(900);
  const glass = (await stepOf("Hũ nến")).options[0];
  ok("TC-T2 hũ gắn mã theo cỡ", glass?.sizeMaterials?.s150 === undefined
    ? JSON.stringify(Object.values(glass.sizeMaterials)) === JSON.stringify([{ materialId: "hu-thuy-tinh-150ml", lidMaterialId: "nap-go-150ml" }, { materialId: "hu-thuy-tinh-250ml" }])
    : false, JSON.stringify(glass?.sizeMaterials));
  console.log("  bảng hũ:", await text("main .ant-table-row"));

  // Thêm lựa chọn cho bước không phải hũ
  const addOption = async (name, price, material, extra) => {
    await clickText("main button", "Thêm lựa chọn");
    await sleep(1200);
    await type(`document.querySelector('.ant-drawer-open input#nameVi')`, name);
    if (price) await type(`document.querySelector('.ant-drawer-open input#price')`, price);
    if (material) await pick(`document.querySelector('.ant-drawer-open input#materialId').closest('.ant-select')`, material, material !== "Không theo dõi");
    if (extra) await extra();
    await clickText(".ant-drawer-open .ant-drawer-footer button", "Thêm lựa chọn");
    await sleep(900);
  };

  // TC-T3: Sáp (cards) — vai trò minh họa màu sáp
  await addStep("Thẻ lựa chọn", "Sáp");
  await addOption("Sáp đậu nành", 0, "Sáp đậu nành");
  await tab("Cài đặt");
  await clickText("main .ant-radio-button-wrapper", "Màu sáp");
  const wax = await stepOf("Sáp");
  ok("TC-T3 bước Sáp gắn sap-dau-nanh, vai trò màu sáp", wax.options[0]?.materialId === "sap-dau-nanh" && wax.previewRole === "waxColor", JSON.stringify(wax.options[0]));

  // TC-T4: Mùi hương (blend) — gắn kho, Không mùi không theo dõi, bật độ đậm
  await addStep("Phối tỉ lệ", "Mùi hương");
  await addOption("Vanilla", 10000, "Tinh dầu Vanilla");
  await addOption("Oải hương", 0, "Tinh dầu Oải hương");
  await addOption("Không mùi", 0, "Không theo dõi", async () => {
    await click(`document.querySelector('.ant-drawer-open #switch-exclusive')`);
  });
  await tab("Cài đặt");
  await click(`document.querySelector('main [aria-label="Cho chọn độ đậm"]')`);
  const blend = await stepOf("Mùi hương");
  ok("TC-T4 mùi hương 3 lựa chọn, có độ đậm", blend.options.map((o) => `${o.name.vi}:${o.materialId ?? "-"}${o.exclusive ? "!" : ""}`).join() === "Vanilla:tinh-dau-vanilla,Oải hương:tinh-dau-oai-huong,Không mùi:-!" && !!blend.intensity, blend.options.map((o) => `${o.name.vi}:${o.materialId}:${o.exclusive}`).join());

  // TC-T5: Màu sáp (swatches)
  await addStep("Bảng màu", "Màu sáp");
  await addOption("Hồng phấn", 15000, "Màu nhuộm hồng");
  await addOption("Không màu", 0, "Không theo dõi", async () => {
    await clickText(".ant-drawer-open .ant-checkbox-wrapper", "Có màu");
  });
  const dye = await stepOf("Màu sáp");
  ok("TC-T5 màu sáp", dye.options.length === 2 && dye.options[0].materialId === "mau-nhuom-hong" && !dye.options[1].swatch, dye.options.map((o) => `${o.name.vi}:${o.materialId}:${o.swatch}`).join());

  // TC-T6: Bấc (cards)
  await addStep("Thẻ lựa chọn", "Bấc");
  await addOption("Bấc cotton", 0, "Bấc cotton");

  // TC-T7: Cá nhân hóa (inputs) — tuỳ chọn thêm gắn hộp quà
  await addStep("Ô nhập", "Cá nhân hóa");
  await clickText("main button", "Thêm tuỳ chọn");
  await sleep(400);
  console.log("  khung tuỳ chọn:", (await text("main section[aria-label='Tuỳ chọn thêm']"))[0]?.slice(0, 300));
  await shot("t7-inputs.png", true);
  const addonSel = `document.querySelector('main section[aria-label="Tuỳ chọn thêm"] .ant-select')`;
  await pick(addonSel, "Hộp quà", true);
  const pers = await stepOf("Cá nhân hóa");
  ok("TC-T7 tuỳ chọn thêm gắn hộp quà", pers.addons[0]?.materialId === "hop-qua", JSON.stringify(pers.addons));

  // TC-T8: custom bước — đổi tên, mô tả, tắt bắt buộc, đổi thứ tự, bật hiện
  await click(byText("main [role=list] [role=listitem], main [role=list] > *", "Bấc"));
  await tab("Cài đặt");
  await type(`[...document.querySelectorAll('main .ant-form-item')].find(f=>f.innerText.includes('Tên bước (Tiếng Việt)')).querySelector('input')`, "Bấc nến");
  await type(`[...document.querySelectorAll('main .ant-form-item')].find(f=>f.innerText.includes('Mô tả ngắn (VI)')).querySelector('input')`, "Chọn loại bấc");
  await click(`document.querySelector('main [aria-label="Bắt buộc"]')`);
  const wick = await stepOf("Bấc nến");
  ok("TC-T8 sửa tên/mô tả/bắt buộc", wick && wick.hint?.vi === "Chọn loại bấc" && wick.required === false, JSON.stringify({ t: wick?.title, h: wick?.hint, r: wick?.required }));
  await t.moveStep("Màu sáp", -1);
  ok("TC-T8 đổi thứ tự Màu sáp lên trên Mùi hương", (await cfg()).steps.map((s) => s.title.vi).join(" > ").includes("Màu sáp > Mùi hương"), (await cfg()).steps.map((s) => s.title.vi).join(" > "));
  for (const title of ["Sáp", "Mùi hương", "Màu sáp", "Bấc nến", "Cá nhân hóa"]) {
    await click(byText("main [role=list] > *", title, false));
    await sleep(300);
    const on = await ev(`document.querySelector('main .ant-card-extra [aria-label="Hiện trên web"]').getAttribute('aria-checked')`);
    if (on !== "true") await click(`document.querySelector('main .ant-card-extra [aria-label="Hiện trên web"]')`);
  }
  ok("TC-T8 bật hiện mọi bước", (await cfg()).steps.every((s) => s.enabled), (await cfg()).steps.map((s) => `${s.title.vi}:${s.enabled}`).join());
  console.log("T8 cảnh báo cấu hình:", await issues());
  const subs = await ev(`[...document.querySelectorAll('main [role=listitem] .step-row .ant-typography-ellipsis')].map(e=>e.innerText+(e.scrollWidth>e.clientWidth+1?' [bị cắt]':''))`);
  ok("TC-T8 dòng mô tả bước không bị cắt", !subs.some((x) => x.includes("[bị cắt]")), subs.join(" | "));
  console.log("T8 thống kê:", (await text("main .ant-statistic")).join(" | "));
  await shot("t8-craft.png", true);

  // ===== LƯU =====
  const bar = await text("main .save-bar");
  ok("S1 thanh 'chưa lưu' liệt kê bước đã thêm", bar[0]?.includes("ở 6 bước") && bar[0].includes("Hũ nến · Sáp") && bar[0].includes("Cá nhân hóa"), bar[0]);
  ok("S1 bản đã lưu (web) chưa đổi trước khi bấm Lưu", (await savedCfg()).steps.length === 0);
  await go(base + "/inventory", 2500);
  ok("S1 Kho chỉ tính bản đã lưu: 9 nguyên liệu 'Chưa dùng'", (await text("main .ant-statistic"))[3]?.includes("9"), (await text("main .ant-statistic"))[3]);
  await go(base + "/craft", 2600);
  ok("S2 rời trang rồi quay lại vẫn giữ bản nháp", (await text("main .save-bar")).length === 1 && (await cfg()).steps.length === 6);
  await clickText("main .save-bar button", "Lưu thay đổi");
  await sleep(700);
  ok("S3 bấm Lưu → web nhận cấu hình, hết thanh chưa lưu", (await savedCfg()).steps.length === 6 && !(await text("main .save-bar")).length && (await ev("localStorage.getItem('bo-craft-builder-v5-draft')")) === null);
  console.log("S3 nút header:", (await text("main button")).find((b) => b.includes("Đã lưu") || b.includes("Lưu thay đổi")));
  // Sửa một phần: đổi giá 1 lựa chọn → chấm chưa lưu đúng bước; Bỏ thay đổi khôi phục
  await click(byText("main [role=list] > *", "Sáp"));
  await tab("Lựa chọn");
  await click(`document.querySelector('main button[aria-label="Sửa Sáp đậu nành"]')`);
  await sleep(1200);
  await type(`document.querySelector('.ant-drawer-open input#price')`, 20000);
  await clickText(".ant-drawer-open .ant-drawer-footer button", "Áp dụng");
  await sleep(900);
  const dots = await ev(`[...document.querySelectorAll('main [role=listitem]')].filter(li=>li.querySelector('[aria-label="Có thay đổi chưa lưu"]')).map(li=>li.querySelector('.step-row .ant-typography').innerText)`);
  ok("S4 sửa 1 lựa chọn → chỉ bước Sáp có chấm chưa lưu", dots.length === 1 && dots[0] === "Sáp", dots.join());
  ok("S4 thanh ghi '1 thay đổi ở 1 bước · Sáp'", (await text("main .save-bar"))[0]?.includes("1 thay đổi chưa lưu ở 1 bước") && (await text("main .save-bar"))[0]?.includes("Sáp"), (await text("main .save-bar"))[0]);
  await shot("s4-savebar.png");
  await clickText("main .save-bar button", "Bỏ thay đổi");
  await sleep(400);
  await clickText(".ant-popover:not(.ant-popover-hidden) button", "Bỏ thay đổi");
  await sleep(600);
  ok("S5 Bỏ thay đổi → về giá cũ", (await cfg()).steps.find((x) => x.title.vi === "Sáp").options[0].priceDelta === 0 && !(await text("main .save-bar")).length);
  // Lưu khi còn lỗi → hỏi xác nhận, vẫn lưu được
  await click(byText("main [role=list] > *", "Sáp"));
  await tab("Lựa chọn");
  await click(`document.querySelector('main .ant-table-row .ant-switch')`);
  await sleep(400);
  await clickText("main .save-bar button", "Lưu thay đổi");
  await sleep(500);
  const confirm = await text(".ant-modal-confirm-title");
  ok("S6 còn lỗi → hỏi 'vẫn lưu?'", confirm[0]?.includes("lỗi"), confirm.join());
  await clickText(".ant-modal-confirm-btns button", "Vẫn lưu");
  await sleep(600);
  ok("S6 vẫn lưu được khi có lỗi", (await savedCfg()).steps.find((x) => x.title.vi === "Sáp").options[0].available === false);
  await click(`document.querySelector('main .ant-table-row .ant-switch')`);
  await sleep(300);
  await clickText("main .save-bar button", "Lưu thay đổi");
  await sleep(600);

  // ===== MAPPING kho ↔ thủ công =====
  // M1: cột tồn kho trên Thủ công = số trong kho
  const stock = Object.fromEntries((await inv()).materials.map((m) => [m.id, m.stock]));
  await click(byText("main [role=list] > *", "Hũ nến"));
  await tab("Hũ");
  const vesselRow = (await text("main .ant-table-row"))[0];
  ok("M1 tồn hũ theo cỡ khớp kho", vesselRow.includes(`150ml ${stock["hu-thuy-tinh-150ml"]} cái`) && vesselRow.includes(`250ml ${stock["hu-thuy-tinh-250ml"]} cái`), vesselRow);
  await click(byText("main [role=list] > *", "Mùi hương"));
  await tab("Lựa chọn");
  const blendRows = await text("main .ant-table-row");
  ok("M1 tồn tinh dầu khớp kho", blendRows[0].includes(`${stock["tinh-dau-vanilla"]} ml`) && blendRows[1].includes(`${stock["tinh-dau-oai-huong"]} ml`) && blendRows[2].includes("Không theo dõi"), blendRows.join(" | "));

  // M2: kho biết nơi dùng
  await go(base + "/inventory", 2500);
  console.log("M2 thống kê kho:", (await text("main .ant-statistic")).join(" | "));
  ok("M2 mọi nguyên liệu đã dùng (Chưa dùng = 0)", (await text("main .ant-statistic"))[3]?.includes("0"));
  const usageOf = async (id) => { await go(base + "/inventory?material=" + id, 2300); return text(".ant-drawer-open a.list-row-button"); };
  console.log("M2 hũ 150ml dùng ở:", await usageOf("hu-thuy-tinh-150ml"));
  console.log("M2 nắp 150ml dùng ở:", await usageOf("nap-go-150ml"));
  console.log("M2 hộp quà dùng ở:", await usageOf("hop-qua"));
  await shot("m2-usage.png");
  // Link từ kho sang thủ công mở đúng lựa chọn
  await click(`document.querySelector('.ant-drawer-open a.list-row-button')`);
  await sleep(2500);
  console.log("M2 bấm nơi dùng → ", await t.loc());

  // M3: hết hũ 250ml → khóa cỡ 250ml
  await go(base + "/inventory?material=hu-thuy-tinh-250ml", 2300);
  await clickText(".ant-drawer-open .ant-segmented-item", "Kiểm kê");
  await type(`document.querySelector('.ant-drawer-open input[aria-label="Số đếm thực tế"]')`, 0);
  await clickText(".ant-drawer-open button", "Ghi nhận", true);
  await sleep(500);
  await go(base + "/craft?step=" + (await stepOf("Hũ nến")).id, 2600);
  console.log("M3 thống kê:", (await text("main .ant-statistic")).join(" | "));
  console.log("M3 bảng hũ:", (await text("main .ant-table-row"))[0]);
  await tab("Xem trước");
  const chips = await ev(`[...document.querySelectorAll('.sf-chip')].map(c=>c.innerText+(c.disabled?' [khóa]':''))`);
  ok("M3 xem trước khóa cỡ 250ml, còn 150ml", chips.some((c) => c.startsWith("250ml") && c.includes("[khóa]")) && chips.some((c) => c.startsWith("150ml") && !c.includes("[khóa]")), chips.join(" | "));
  await shot("m3-preview.png");

  // M4: hết oải hương → khóa lựa chọn; tạo lựa chọn mới kèm nguyên liệu mới → xuất hiện trong kho
  await go(base + "/inventory?material=tinh-dau-oai-huong", 2300);
  await clickText(".ant-drawer-open .ant-segmented-item", "Kiểm kê");
  await type(`document.querySelector('.ant-drawer-open input[aria-label="Số đếm thực tế"]')`, 0);
  await clickText(".ant-drawer-open button", "Ghi nhận", true);
  await sleep(500);
  await go(base + "/craft?step=" + (await stepOf("Mùi hương")).id + "&view=preview", 2600);
  const cards = await text(".sf-card");
  ok("M4 oải hương hết → Tạm hết trên xem trước", cards.some((c) => c.includes("Oải hương") && c.includes("Tạm hết")), cards.join(" | "));
  await tab("Lựa chọn");
  await addOption("Sả chanh", 5000, null, async () => { await type(`document.querySelector('.ant-drawer-open input#newStock')`, 250); });
  ok("M4 trước khi Lưu: Kho chưa có 'Sả chanh'", !(await inv()).materials.some((m) => m.name === "Sả chanh"));
  await clickText("main .save-bar button", "Lưu thay đổi");
  await sleep(800);
  const newMat = (await inv()).materials.find((m) => m.name === "Sả chanh");
  ok("M4 tạo lựa chọn kèm nguyên liệu mới → có trong kho", newMat && newMat.unit === "ml" && newMat.category === "fragrance" && newMat.stock === 250, JSON.stringify(newMat));

  // M5: xóa nguyên liệu đang dùng → Thủ công cảnh báo + khóa
  await go(base + "/inventory?material=mau-nhuom-hong", 2300);
  await clickText(".ant-drawer-open .ant-drawer-footer button", "Xóa");
  await sleep(400);
  console.log("M5 hỏi xác nhận:", (await text(".ant-popover:not(.ant-popover-hidden) .ant-popconfirm-message"))[0]);
  await clickText(".ant-popover:not(.ant-popover-hidden) button", "Xóa");
  await sleep(600);
  await go(base + "/craft", 2600);
  console.log("M5 cảnh báo:", await issues());
  ok("M5 cảnh báo nguyên liệu đã xóa", (await issues()).some((i) => i.includes("Hồng phấn") && i.includes("đã xóa")));
  console.log("M5 thống kê:", (await text("main .ant-statistic")).join(" | "));

  // Tìm kiếm header
  await click(`document.querySelector('[aria-label^="Tìm"]') || document.querySelector('.shell-search, header input')`);
  await sleep(500);
  await t.send("Input.insertText", { text: "hũ thủy" });
  await sleep(700);
  console.log("search:", (await text(".search-item, [role=option]")).slice(0, 6));
  await esc();

  console.log("overflow desktop:", await overflow());
  await t.viewport(390, 844, true);
  await go(base + "/craft?step=" + (await stepOf("Hũ nến")).id, 2600);
  console.log("mobile overflow:", await overflow(), "scrollW", await ev("document.documentElement.scrollWidth"));
  await shot("t9-mobile.png", true);
  const head = await ev(`(()=>{const e=document.querySelector('#craft-editor .ant-card-head-title .ant-typography');return e.innerText+(e.scrollWidth>e.clientWidth+1?' [bị cắt]':'')})()`);
  ok("T9 tên bước trên header card điện thoại không bị cắt", !head.includes("[bị cắt]"), head);
  await click(byText("main [role=list] > *", "Mùi hương"));
  await sleep(1200);
  const top = await ev(`Math.round(document.getElementById('craft-editor').getBoundingClientRect().top)`);
  ok("T9 chọn bước trên điện thoại → cuộn tới editor", top >= -5 && top < 200, "top=" + top);
  await go(base + "/craft?step=" + (await stepOf("Hũ nến")).id + "&edit=" + glass.id, 2600);
  await shot("t9-mobile-drawer.png");
  console.log("logs:", t.logs);
});
