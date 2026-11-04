// E2E 4 — sửa nhiều chỗ ở nhiều bước → danh sách thay đổi đầy đủ, mở đúng chỗ, hoàn tác từng bước, lưu tất cả
import { test } from "./support/harness.mjs";

test("E2E 4 — sửa nhiều chỗ ở nhiều bước → danh sách thay đổi đầy đủ, mở đúng chỗ, hoàn tác từng bước, lưu tất cả", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const { ev, sleep, shot, click, clickText, byText, type, text, go, ok } = t;
  const draft = () => ev("JSON.parse(localStorage.getItem('bo-craft-builder-v5-draft')||'null')");
  const saved = () => ev("JSON.parse(localStorage.getItem('bo-craft-builder-v5')||'null')");
  const tab = async (label) => { await clickText("main .ant-tabs-tab", label); await sleep(500); };
  const keyMove = t.moveStep;
  const pickStep = async (title) => { await click(byText("main [role=list] > *", title)); await sleep(500); };

  await go(base + "/", 1000);
  await ev("['bo-inventory-v2','bo-craft-builder-v5','bo-craft-builder-v5-draft'].forEach(k=>localStorage.removeItem(k))");
  await go(base + "/craft", 2800);

  // 1. Sáp: đổi phụ thu Sáp đậu nành trong drawer
  await pickStep("Sáp");
  await click(`document.querySelector('main button[aria-label="Sửa Sáp đậu nành"]')`);
  await sleep(1200);
  await type(`document.querySelector('.ant-drawer-open input#price')`, 20000);
  await type(`document.querySelector('.ant-drawer-open input#descVi')`, "Cháy sạch, ít khói");
  await clickText(".ant-drawer-open .ant-drawer-footer button", "Áp dụng");
  await sleep(900);
  // 2. Mùi hương: tắt bán Rose ngay trên bảng
  await pickStep("Mùi hương");
  await click(`document.querySelector('main [aria-label="Đang bán: Rose"]')`);
  // 3. Hũ nến: giá gốc cỡ 150ml
  await pickStep("Hũ nến");
  await tab("Kích thước");
  await type(`document.querySelector('main input[aria-label="Giá gốc 150ml"]')`, 420000);
  // 4. Bấc: đổi tên bước
  await pickStep("Bấc");
  await tab("Cài đặt");
  await type(`[...document.querySelectorAll('main .ant-form-item')].find(f=>f.innerText.includes('Tên bước (Tiếng Việt)')).querySelector('input')`, "Bấc nến");
  // 5. Thêm bước mới
  await clickText("main button", "Thêm bước");
  await sleep(700);
  await t.type(`document.querySelector('.ant-modal input#title')`, "Thiệp");
  await clickText(".ant-modal-footer button", "Tạo bước");
  await sleep(900);
  // 6. Đổi thứ tự
  await keyMove("Màu sáp", -1);
  await sleep(400);

  const d = await draft();
  ok("Bản nháp giữ MỌI chỉnh sửa (không chỉ lần cuối)",
    d.steps.find((s) => s.id === "wax").options[0].priceDelta === 20000 &&
    d.steps.find((s) => s.id === "fragrance").options.find((o) => o.id === "rose").available === false &&
    d.steps.find((s) => s.id === "container").sizes[0].basePrice === 420000 &&
    d.steps.find((s) => s.id === "wick").title.vi === "Bấc nến" &&
    d.steps.some((s) => s.title.vi === "Thiệp"));
  const bar = (await text("main .save-bar"))[0];
  console.log("bar:", bar);
  ok("Thanh lưu đếm đủ thay đổi ở 5 bước", bar.includes("ở 5 bước"), bar);
  const tag = await text("main .ant-card-head .ant-tag");
  console.log("tag trên bước đang mở:", tag);
  await shot("c1-bar.png");

  // Mở danh sách chi tiết
  await clickText("main .save-bar button", "Xem thay đổi");
  await sleep(900);
  const groups = await text(".ant-drawer-open section.change-group");
  console.log(groups.join("\n---\n"));
  const all = groups.join(" | ");
  for (const expect of ["Phụ thu: 0 ₫ → 20.000 ₫", "Mô tả: Tiêu chuẩn, cháy sạch → Cháy sạch, ít khói", "Đang bán: Bật → Tắt", "Giá gốc: 400.000 ₫ → 420.000 ₫", "Tên bước: Bấc / Wick → Bấc nến / Wick", "Bước mới"])
    ok(`Danh sách có "${expect}"`, all.includes(expect));
  ok("Có mục thứ tự bước", (await text(".ant-drawer-open .change-group")).some((g) => g.includes("Thứ tự các bước")));
  await shot("c2-drawer.png");

  // Bấm một dòng → mở đúng lựa chọn
  await click(byText(".ant-drawer-open button.change-row", "Phụ thu: 0 ₫ → 20.000 ₫"));
  await sleep(1500);
  ok("Bấm dòng → mở drawer sửa Sáp đậu nành", (await t.loc()).includes("step=wax") && (await t.loc()).includes("edit=soy") && (await ev("document.querySelector('.ant-drawer-open .ant-drawer-title')?.innerText")).includes("Sửa lựa chọn"), await t.loc());
  await t.press("Escape", "Escape", 27);
  await sleep(900);

  // Hoàn tác riêng bước Mùi hương
  await clickText("main .save-bar button", "Xem thay đổi");
  await sleep(900);
  await click(`document.querySelector('.ant-drawer-open [aria-label="Hoàn tác Mùi hương"]')`);
  await sleep(300);
  await clickText(".ant-popover:not(.ant-popover-hidden) button", "Hoàn tác");
  await sleep(600);
  const d2 = await draft();
  ok("Hoàn tác Mùi hương: Rose bán lại, các bước khác giữ thay đổi",
    d2.steps.find((s) => s.id === "fragrance").options.find((o) => o.id === "rose").available === true && d2.steps.find((s) => s.id === "wax").options[0].priceDelta === 20000);
  ok("Mùi hương biến khỏi danh sách", !(await text(".ant-drawer-open section.change-group")).some((g) => g.startsWith("Mùi hương")));

  // Lưu tất cả
  await clickText(".ant-drawer-open .ant-drawer-footer button", "Lưu tất cả");
  await sleep(700);
  const s = await saved();
  ok("Lưu tất cả → web nhận đủ", s.steps.find((x) => x.id === "container").sizes[0].basePrice === 420000 && s.steps.some((x) => x.title.vi === "Thiệp") && !(await draft()));

  // Điện thoại
  await t.viewport(390, 844, true);
  await keyMove("Màu sáp", 1);
  await sleep(400);
  await go(base + "/craft", 2600);
  await ev("window.scrollTo(0, document.body.scrollHeight)");
  await sleep(400);
  await shot("c3-mobile-bar.png");
  await clickText("main .save-bar button", "Xem thay đổi");
  await sleep(900);
  await shot("c4-mobile-drawer.png");
  console.log("logs:", t.logs);
});
