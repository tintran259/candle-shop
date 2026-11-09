// E2E 6 — nguyên liệu tạo từ Thủ công chỉ vào Kho khi Lưu; Bỏ thay đổi / xóa lựa chọn / hoàn tác thì không sót lại
import { test } from "./support/harness.mjs";

test("E2E 6 — nguyên liệu tạo từ Thủ công chỉ vào Kho khi Lưu; Bỏ thay đổi / xóa lựa chọn / hoàn tác thì không sót lại", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const { ev, sleep, shot, click, clickText, byText, type, text, go, ok } = t;
  const inv = () => ev("JSON.parse(localStorage.getItem('bo-inventory-v2')||'null')");
  const inKho = async (name) => ((await inv())?.materials ?? []).find((m) => m.name === name);
  const tab = async (label) => { await clickText("main .ant-tabs-tab", label); await sleep(500); };

  const addWithNewMaterial = async (step, name, stock) => {
    await go(base + `/craft?step=${step}`, 2600);
    await clickText("main button", "Thêm lựa chọn");
    await sleep(1200);
    await type(`document.querySelector('.ant-drawer-open input#nameVi')`, name);
    if (stock !== undefined) await type(`document.querySelector('.ant-drawer-open input#newStock')`, stock);
    // Có tồn ban đầu thì nhập tiền đã trả (giá nhập ban đầu)
    if (stock) await type(`document.querySelector('.ant-drawer-open input[aria-label="Tổng tiền đã trả"]')`, stock * 1000);
    await clickText(".ant-drawer-open .ant-drawer-footer button", "Thêm lựa chọn");
    await sleep(900);
  };

  await go(base + "/", 1000);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-craft')||k.startsWith('bo-inventory')).forEach(k=>localStorage.removeItem(k))");

  // 1. Đúng kịch bản lỗi: tạo lựa chọn + nguyên liệu mới → Bỏ thay đổi → Kho không có gì
  await addWithNewMaterial("fragrance", "Gỗ tuyết tùng", 350);
  ok("1 Vừa thêm: Kho CHƯA có nguyên liệu (chờ Lưu)", !(await inKho("Gỗ tuyết tùng")));
  const row = (await text("main .ant-table-row")).find((r) => r.includes("Gỗ tuyết tùng"));
  ok("1 Bảng lựa chọn hiện tồn 350 ml + 'Chờ lưu'", row?.includes("350 ml") && row.includes("Chờ lưu"), row);
  const bar = (await text("main .save-bar"))[0];
  ok("1 Thanh lưu báo '1 nguyên liệu mới vào Kho khi Lưu'", bar?.includes("1 nguyên liệu mới vào Kho khi Lưu"), bar);
  await clickText("main .save-bar button", "Xem thay đổi");
  await sleep(800);
  const group = (await text(".ant-drawer-open section[aria-label='Nguyên liệu mới']"))[0];
  ok("1 Danh sách thay đổi có mục nguyên liệu mới", group?.includes("Gỗ tuyết tùng") && group.includes("tồn ban đầu 350 ml"), group);
  await shot("p1-drawer.png");
  await t.press("Escape", "Escape", 27);
  await sleep(800);
  await shot("p1-table.png");
  await clickText("main .save-bar button", "Bỏ thay đổi");
  await sleep(300);
  await clickText(".ant-popover:not(.ant-popover-hidden) button", "Bỏ thay đổi");
  await sleep(600);
  await go(base + "/inventory", 2500);
  ok("1 Bỏ thay đổi → Kho KHÔNG có 'Gỗ tuyết tùng'", !(await inKho("Gỗ tuyết tùng")) && !(await text("main .ant-table-row")).some((r) => r.includes("Gỗ tuyết tùng")));
  ok("1 Không còn nguyên liệu chờ tạo", (await ev("localStorage.getItem('bo-craft-builder-v5-new-materials')")) === null);

  // 2. Tạo lại rồi Lưu → vào Kho, có phiếu "Tồn ban đầu"
  await addWithNewMaterial("fragrance", "Gỗ tuyết tùng", 350);
  await clickText("main .save-bar button", "Lưu thay đổi");
  await sleep(800);
  const m = await inKho("Gỗ tuyết tùng");
  ok("2 Lưu → Kho có nguyên liệu đúng loại / đơn vị / tồn", m?.category === "fragrance" && m.unit === "ml" && m.stock === 350 && !m.draft, JSON.stringify(m));
  ok("2 Có phiếu 'Tồn ban đầu'", (await inv()).movements.some((mv) => mv.materialId === m?.id && mv.note === "Tồn ban đầu"));
  const row2 = (await text("main .ant-table-row")).find((r) => r.includes("Gỗ tuyết tùng"));
  ok("2 Sau Lưu: hết nhãn 'Chờ lưu', link sang Kho", row2 && !row2.includes("Chờ lưu"), row2);

  // 3. Tạo rồi xóa lựa chọn trước khi Lưu → không tạo nguyên liệu
  await addWithNewMaterial("wax", "Sáp cọ", 2000);
  await click(`document.querySelector('main button[aria-label="Sửa Sáp cọ"]')`);
  await sleep(1200);
  await clickText(".ant-drawer-open .ant-drawer-footer button", "Xóa");
  await sleep(300);
  await clickText(".ant-popover:not(.ant-popover-hidden) button", "Xóa");
  await sleep(700);
  await addWithNewMaterial("wax", "Sáp gạo", 1000);
  await clickText("main .save-bar button", "Lưu thay đổi");
  await sleep(800);
  ok("3 Xóa lựa chọn trước khi Lưu → 'Sáp cọ' không vào Kho; 'Sáp gạo' có", !(await inKho("Sáp cọ")) && (await inKho("Sáp gạo"))?.stock === 1000);

  // 4. Hoàn tác bước → nguyên liệu chờ tạo của bước đó cũng bỏ
  await addWithNewMaterial("wick", "Bấc gai dầu", 60);
  await clickText("main .save-bar button", "Xem thay đổi");
  await sleep(800);
  await click(`document.querySelector('.ant-drawer-open [aria-label="Hoàn tác Bấc"]')`);
  await sleep(300);
  await clickText(".ant-popover:not(.ant-popover-hidden) button", "Hoàn tác");
  await sleep(600);
  ok("4 Hoàn tác bước → hết thay đổi, không tạo 'Bấc gai dầu'", !(await text("main .save-bar")).length && !(await inKho("Bấc gai dầu")));
  await t.press("Escape", "Escape", 27);
  await sleep(600);

  // 5. Hũ: các cỡ lấy từ Kho theo Loại hũ — không tạo mã hũ mới từ trang Thủ công
  await go(base + "/craft?step=container", 2600);
  await clickText("main button", "Thêm lựa chọn");
  await sleep(1200);
  await type(`document.querySelector('.ant-drawer-open input#nameVi')`, "Hũ sứ");
  await type(`document.querySelector('.ant-drawer-open input#price')`, 300000);
  await t.pick(`document.querySelector('.ant-drawer-open [aria-label="Loại hũ trong Kho"]').closest('.ant-select')`, "Hộp thiếc", true);
  await sleep(400);
  await clickText(".ant-drawer-open .ant-drawer-footer button", "Thêm lựa chọn");
  await sleep(900);
  const vrow = (await text("main .ant-table-row")).find((r) => r.includes("Hũ sứ"));
  ok("5 Hũ mới theo Loại hũ: cỡ 150ml, 200ml từ Kho, không có nguyên liệu chờ tạo", /150ml\s*300\.000/.test(vrow ?? "") && /200ml\s*300\.000/.test(vrow ?? "") && !vrow.includes("Chờ lưu"), vrow);
  await shot("p5-vessel.png");
  console.log("logs:", t.logs);
});
