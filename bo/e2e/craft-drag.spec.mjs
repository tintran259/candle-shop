// Thủ công: kéo thả thứ tự bước bằng chuột và bàn phím, thanh lưu báo "Thứ tự bước", lưu xong web đổi theo
import { SF_URL, test } from "./support/harness.mjs";

test.use({ storefront: true });

test("Thủ công: kéo thả thứ tự bước bằng chuột và bàn phím, thanh lưu báo \"Thứ tự bước\", lưu xong web đổi theo", async ({ t }) => {
  const bo = t.base;
  const sf = SF_URL;
  const { ev, sleep, shot, click, clickText, go, ok, viewport, logs } = t;
  const order = () => ev(`[...document.querySelectorAll('main [role=listitem] .step-row strong')].map(e=>e.innerText)`);
  const box = (name) => ev(`(()=>{const b=document.querySelector('[aria-label="Kéo để sắp xếp ${name}"]').getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
  const mouse = (type, x, y) => t.send("Input.dispatchMouseEvent", { type, x, y, button: "left", buttons: type === "mouseReleased" ? 0 : 1, clickCount: 1 });
  const key = (k, code, kc) => Promise.all(["keyDown", "keyUp"].map((type) => t.send("Input.dispatchKeyEvent", { type, key: k, code, windowsVirtualKeyCode: kc })));

  await viewport(1440, 1000);
  await go(bo + "/", 800);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  await go(bo + "/craft", 3000);
  const o0 = await order();
  console.log("ban đầu:", o0.join(" > "));
  ok("A1 Mỗi bước có tay nắm, không còn nút mũi tên", (await ev("document.querySelectorAll('main [aria-label^=\"Kéo để sắp xếp\"]').length")) === o0.length && !(await ev("!!document.querySelector('[aria-label$=\"lên trên\"]')")));

  // Kéo bước thứ 3 lên vị trí 2
  const [a, b] = [o0[2], o0[1]];
  const from = await box(a), to = await box(b);
  await mouse("mousePressed", from.x, from.y);
  for (let i = 1; i <= 10; i++) { await mouse("mouseMoved", from.x, from.y + ((to.y - from.y) * i) / 10); await sleep(30); }
  await sleep(200);
  await shot("craft-dragging.png");
  await mouse("mouseReleased", to.x, to.y);
  await sleep(500);
  const o1 = await order();
  ok("B1 Kéo chuột đổi thứ tự", o1[1] === a && o1[2] === b, o1.join(" > "));
  ok("B2 Thanh lưu báo Thứ tự bước", (await ev("document.body.innerText")).includes("Thứ tự bước"));
  ok("B3 Số thứ tự cập nhật", (await ev(`[...document.querySelectorAll('main .step-row-index')].map(e=>e.innerText).join()`)) === o1.map((_, i) => i + 1).join());

  // Bấm tay nắm không kéo thì không đổi gì; bấm dòng vẫn mở bước
  const cur = await ev("document.querySelector('main .step-row[aria-current=true] strong')?.innerText");
  const h = await box(o1[4]);
  await mouse("mousePressed", h.x, h.y); await mouse("mouseReleased", h.x, h.y); await sleep(300);
  ok("C1 Bấm tay nắm không đổi thứ tự", (await order()).join() === o1.join());
  await clickText("main .step-row", o1[4]);
  await sleep(500);
  ok("C2 Bấm dòng mở bước", (await ev("document.querySelector('main .step-row[aria-current=true] strong')?.innerText")) === o1[4], cur);

  // Bàn phím: đưa bước 2 xuống 1 bậc
  await ev(`document.querySelector('[aria-label="Kéo để sắp xếp ${o1[1]}"]').focus()`);
  await key(" ", "Space", 32); await sleep(300);
  await key("ArrowDown", "ArrowDown", 40); await sleep(300);
  await key(" ", "Space", 32); await sleep(500);
  const o2 = await order();
  ok("D1 Bàn phím trả lại thứ tự ban đầu", o2.join() === o0.join(), o2.join(" > "));
  ok("D2 Về như cũ thì hết báo Thứ tự bước", !(await ev("document.body.innerText")).includes("Thứ tự bước"));

  // Lưu thứ tự mới, web nhận theo
  await ev(`document.querySelector('[aria-label="Kéo để sắp xếp ${o2[2]}"]').focus()`);
  await key(" ", "Space", 32); await sleep(300);
  await key("ArrowUp", "ArrowUp", 38); await sleep(300);
  await key(" ", "Space", 32); await sleep(500);
  const o3 = await order();
  await clickText("main button", "Lưu thay đổi");
  await sleep(900);
  if (await ev("!!document.querySelector('.ant-modal-confirm-btns')")) { await click(`[...document.querySelectorAll('.ant-modal-confirm-btns button')].pop()`); await sleep(800); }
  await sleep(1500);
  const saved = await ev("JSON.parse(localStorage.getItem('bo-craft-builder-v5')).steps.map(s=>s.title.vi)");
  ok("E1 Lưu đúng thứ tự", saved.join() === o3.join(), saved.join(" > "));
  try {
    const api = await (await fetch(sf + "/api/craft-config")).json();
    ok("E2 Web nhận thứ tự mới", api.config.steps.map((s) => s.title.vi).join() === o3.join());
  } catch { console.log("Web không chạy, bỏ qua E2"); }

  await viewport(390, 844);
  await go(bo + "/craft", 2500);
  ok("F1 Mobile không tràn ngang", await ev("document.documentElement.scrollWidth <= innerWidth"));
  await shot("craft-mobile.png");
});
