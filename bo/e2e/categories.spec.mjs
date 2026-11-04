// Danh mục: thêm/sửa/sắp xếp/ẩn, chặn xóa khi còn sản phẩm, form & bộ lọc sản phẩm, chuyển dữ liệu cũ
import { test } from "./support/harness.mjs";

test("Danh mục: thêm/sửa/sắp xếp/ẩn, chặn xóa khi còn sản phẩm, form & bộ lọc sản phẩm, chuyển dữ liệu cũ", async ({ t }) => {
  const bo = t.base;
  const { ev, sleep, shot, click, clickText, go, ok, viewport, logs } = t;
  const rows = () => ev("[...document.querySelectorAll('.ant-table-tbody tr.ant-table-row')].map(r=>r.innerText.replace(/\\s+/g,' '))");
  await viewport(1440, 1000);
  await go(bo + "/", 800);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  // Bản lưu cũ còn aromaType
  await ev(`localStorage.setItem('bo-products-v1', JSON.stringify([{id:'old',name:'Nến cũ',slug:'old',price:500000,images:['/x.jpg'],aromaType:'fruits',aromaLevel:'soft',size:'small',status:'active',isNew:false,isFeatured:false,rating:0,reviewCount:0,sold:0,createdAt:'2026-01-01',updatedAt:'2026-01-01'}]))`);
  await go(bo + "/categories", 2000);
  let r = await rows();
  ok("A1 Có 3 danh mục mặc định", r.length === 3, r.join(" | "));
  ok("A2 Dữ liệu cũ aromaType được đếm vào Trái cây", r.find((x) => x.includes("Trái cây"))?.includes("1 sản phẩm"), r.join(" | "));
  ok("A3 Sidebar có Danh mục", await ev("[...document.querySelectorAll('.ant-menu-item')].some(m=>m.innerText.trim()==='Danh mục')"));
  await shot("cat-list.png");

  await clickText("button", "Thêm danh mục");
  await sleep(600);
  await t.type(`document.querySelector('.ant-modal input#vi')`, "Hương gỗ");
  await t.type(`document.querySelector('.ant-modal input#en')`, "Woody");
  await click(`[...document.querySelectorAll('.ant-modal-footer button')].pop()`);
  await sleep(700);
  r = await rows();
  ok("B1 Thêm Hương gỗ ở cuối", r.at(-1)?.includes("Hương gỗ") && r.at(-1)?.includes("Woody"), r.join(" | "));
  await clickText("button", "Thêm danh mục");
  await sleep(600);
  await t.type(`document.querySelector('.ant-modal input#vi')`, "huong go");
  await click(`[...document.querySelectorAll('.ant-modal-footer button')].pop()`);
  await sleep(500);
  ok("B2 Chặn tên trùng", (await ev("document.querySelector('.ant-modal .ant-form-item-explain-error')?.innerText")) === "Đã có danh mục tên này.");
  await click(`[...document.querySelectorAll('.ant-modal-footer button')][0]`);
  await sleep(600);

  // Kéo bằng chuột: tay nắm của Hương gỗ (dòng 4) lên chỗ Trái cây (dòng 3)
  const box = (sel) => ev(`(()=>{const b=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
  const from = await box('[aria-label="Kéo để sắp xếp Hương gỗ"]');
  const to = await box('[aria-label="Kéo để sắp xếp Trái cây"]');
  const mouse = (type, x, y) => t.send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 });
  await mouse("mousePressed", from.x, from.y);
  for (let i = 1; i <= 10; i++) { await mouse("mouseMoved", from.x, from.y + ((to.y - from.y) * i) / 10); await sleep(30); }
  await sleep(200);
  await shot("cat-dragging.png");
  await mouse("mouseReleased", to.x, to.y);
  await sleep(500);
  r = await rows();
  ok("C1 Kéo chuột đưa Hương gỗ lên trên Trái cây", r[2]?.includes("Hương gỗ") && r[3]?.includes("Trái cây"), r.join(" | "));
  // Bàn phím: Space nhấc, mũi tên lên, Space đặt
  const key = (k, code, kc) => Promise.all(["keyDown", "keyUp"].map((type) => t.send("Input.dispatchKeyEvent", { type, key: k, code, windowsVirtualKeyCode: kc })));
  await ev(`document.querySelector('[aria-label="Kéo để sắp xếp Thiên nhiên"]').focus()`);
  await key(" ", "Space", 32); await sleep(300);
  await key("ArrowDown", "ArrowDown", 40); await sleep(300);
  await key(" ", "Space", 32); await sleep(500);
  r = await rows();
  ok("C1b Bàn phím đưa Thiên nhiên xuống 1 bậc", r[0]?.includes("Nước hoa") && r[1]?.includes("Thiên nhiên"), r.join(" | "));
  ok("C1c Có hướng dẫn tiếng Việt cho trình đọc màn hình", (await ev("document.body.innerText + [...document.querySelectorAll('[id^=DndDescribedBy]')].map(e=>e.textContent).join()")).includes("Nhấn Space hoặc Enter để nhấc lên"));
  await key("ArrowUp", "ArrowUp", 38);
  // Trả lại thứ tự cũ cho các bước sau
  await ev(`document.querySelector('[aria-label="Kéo để sắp xếp Thiên nhiên"]').focus()`);
  await key(" ", "Space", 32); await sleep(300);
  await key("ArrowUp", "ArrowUp", 38); await sleep(300);
  await key(" ", "Space", 32); await sleep(500);
  ok("C2 Trái cây còn sản phẩm thì nút xóa bị khóa", await ev(`document.querySelector('[aria-label="Không xóa được Trái cây"]')?.disabled === true`));
  await click(`document.querySelector('[aria-label="Hiện trên web: Nước hoa"]')`);
  await sleep(300);
  const saved = await ev("JSON.parse(localStorage.getItem('bo-categories-v1'))");
  ok("C3 Ẩn Nước hoa được lưu", saved.find((c) => c.id === "parfum").hidden === true && saved[2].id === "huong-go", JSON.stringify(saved.map((c) => c.id)));

  // Sửa tên giữ id
  await click(`document.querySelector('[aria-label="Sửa Hương gỗ"]')`);
  await sleep(600);
  await ev(`(()=>{const i=document.querySelector('.ant-modal input#vi');const set=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;set.call(i,'');i.dispatchEvent(new Event('input',{bubbles:true}))})()`);
  await t.type(`document.querySelector('.ant-modal input#vi')`, "Gỗ ấm");
  await click(`[...document.querySelectorAll('.ant-modal-footer button')].pop()`);
  await sleep(600);
  const s2 = await ev("JSON.parse(localStorage.getItem('bo-categories-v1'))");
  ok("D1 Đổi tên giữ nguyên id", s2.find((c) => c.id === "huong-go")?.name.vi === "Gỗ ấm");

  // Link sang sản phẩm có bộ lọc
  await clickText("a", "1 sản phẩm");
  await sleep(1500);
  const prod = await ev("document.querySelector('.ant-table-tbody')?.innerText.replace(/\\s+/g,' ')");
  ok("E1 Mở Sản phẩm lọc sẵn theo danh mục", (await ev("location.pathname + location.search")).startsWith("/products?category=fruits"), await ev("location.search"));
  ok("E2 Chỉ còn Nến cũ, tag Trái cây", prod?.includes("Nến cũ") && prod.includes("Trái cây"), prod?.slice(0, 120));
  ok("E3 Ô lọc hiện Trái cây", (await ev("document.querySelector('[aria-label=\"Lọc theo danh mục\"]')?.closest('.ant-select')?.innerText")) === "Trái cây");

  // Form sản phẩm: chọn danh mục mới
  await click(`document.querySelector('[aria-label="Sửa Nến cũ"]')`);
  await sleep(1500);
  await click(`document.querySelector('#categoryId')?.closest('.ant-select')`);
  await sleep(500);
  const opts = await ev("[...document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')].map(o=>o.innerText)");
  ok("F1 Form liệt kê danh mục đúng thứ tự, ghi chú danh mục ẩn", opts.join("|") === "Thiên nhiên|Nước hoa (đang ẩn trên web)|Gỗ ấm|Trái cây", opts.join("|"));
  await clickText(".ant-select-item-option", "Gỗ ấm");
  await sleep(400);
  ok("F2 Xem trước đổi tag", (await ev("document.querySelector('section[aria-label=\"Xem trước\"]').innerText")).includes("Gỗ ấm"));
  await shot("cat-form.png");
  await clickText(".ant-drawer-footer button", "Lưu thay đổi");
  await sleep(900);
  const p = await ev("JSON.parse(localStorage.getItem('bo-products-v1'))[0]");
  ok("F3 Lưu categoryId, bỏ aromaType", p.categoryId === "huong-go" && !("aromaType" in p), JSON.stringify(p).slice(0, 160));

  await go(bo + "/categories", 1500);
  r = await rows();
  ok("G1 Trái cây hết sản phẩm thì xóa được", await ev(`!!document.querySelector('[aria-label="Xóa Trái cây"]')`));
  await click(`document.querySelector('[aria-label="Xóa Trái cây"]')`);
  await sleep(400);
  await click(`[...document.querySelectorAll('.ant-popconfirm-buttons button')].pop()`);
  await sleep(500);
  ok("G2 Đã xóa", !(await rows()).some((x) => x.includes("Trái cây")));
  await go(bo + "/", 2500);
  ok("H1 Dashboard vẫn chạy", (await ev("document.querySelector('main').innerText")).includes("Doanh thu"));
  await viewport(390, 844);
  await go(bo + "/categories", 1500);
  ok("I1 Mobile không tràn ngang", await ev("document.documentElement.scrollWidth <= innerWidth"));
  await shot("cat-mobile.png");
});
