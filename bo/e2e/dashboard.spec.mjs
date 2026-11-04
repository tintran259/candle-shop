// E2E 23 — Dashboard số thật: doanh thu theo tiền thực nhận, kỳ, việc cần xử lý, link lọc đơn
import { test } from "./support/harness.mjs";

test("E2E 23 — Dashboard số thật: doanh thu theo tiền thực nhận, kỳ, việc cần xử lý, link lọc đơn", async ({ t }) => {
  const base = t.base;
  const bo = t.base;
  const { ev, sleep, shot, click, clickText, go, ok, text, viewport, overflow, logs } = t;

  await go(base + "/", 1000);
  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");

  const now = Date.now();
  const ago = (d) => new Date(now - d * 86400000).toISOString();
  const make = (id, over) => ({
    id, code: "T" + id.toUpperCase(), status: "completed", customer: { name: "Khách " + id, email: "", phone: "09" + String(id.length * 7) + "0000" + id.charCodeAt(0) }, shippingAddress: "1 A", shippingMethod: "standard", depositPercent: 50,
    items: [{ id: "i", productId: "vanilla-relax", name: "Vanilla Relax", image: "/products/product-vanilla.jpg", price: 1000000, quantity: 1 }], subtotal: 1000000, discount: 0, shippingFee: 0, total: 1000000, paymentPlan: "full", paymentMethod: "cod",
    payments: [{ id: "p-" + id, provider: "cod", amount: 1000000, status: "success", createdAt: ago(1) }],
    readyDate: "2099-12-30", history: [{ at: ago(1), status: "pending", by: "x" }], createdAt: ago(1), updatedAt: ago(1), ...over,
  });
  const pay = (id, amount, d) => [{ id: "p-" + id, provider: "cod", amount, status: "success", createdAt: ago(d) }];
  const list = [
    make("a", {}), // 1.000.000 thu đủ
    make("b", { status: "paid", paymentPlan: "deposit", payments: pay("b", 500000, 2), createdAt: ago(2) }), // cọc 500.000
    make("c", { status: "cancelled", payments: pay("c", 1000000, 3), refund: { amount: 500000, images: [], at: ago(1), by: "x" }, refundDue: 500000, cancelFault: "customer", createdAt: ago(3) }), // còn 500.000
    make("d", { status: "cancelled", payments: pay("d", 1000000, 3), refundDue: 1000000, cancelFault: "shop", createdAt: ago(3), updatedAt: ago(1) }), // chờ hoàn: 0
    make("e", { status: "cancelled", paymentPlan: "deposit", payments: pay("e", 500000, 3), cancelFault: "customer", createdAt: ago(3) }), // giữ cọc 500.000
    make("f", { status: "delivery_failed", createdAt: ago(4), payments: pay("f", 1000000, 4), items: [{ id: "c", name: "Nến tự phối", custom: "Hũ gốm", price: 1000000, quantity: 3 }], total: 1000000 }), // 1.000.000
    make("g", { createdAt: ago(10), payments: pay("g", 2000000, 10), total: 2000000 }), // ngoài kỳ 7 ngày
    make("h", { createdAt: ago(9), payments: pay("h", 1000000, 9), customer: { name: "Khách a", email: "", phone: "0970000097" } }),
    make("l", { status: "producing", readyDate: "2020-01-01", createdAt: ago(20), payments: pay("l", 1000000, 20) }),
  ];
  await ev(`localStorage.setItem('bo-orders-v3', ${JSON.stringify(JSON.stringify(list))})`);

  await go(base + "/?days=7", 2600);
  const page = () => ev("document.querySelector('main').innerText.replace(/\\s+/g,' ')");
  const p7 = await page();
  await shot("d23-7.png", true);
  const expected = "3,5 tr"; // 1 + 0,5 + 0,5 + 0 + 0,5 + 1 = 3,5
  ok("A1 Doanh thu theo tiền thực nhận", p7.includes(expected), p7.slice(0, 400));
  ok("A2 Đơn hàng không tính đơn hủy (3)", /Đơn hàng 3/.test(p7), p7.match(/Đơn hàng \S+/)?.[0]);
  ok("A3 Việc cần xử lý: trễ hạn 1, giao lỗi 1, chờ hoàn 1 tr", /Đơn trễ hạn 1/.test(p7) && /Giao lỗi cần xử lý 1/.test(p7) && /Chờ hoàn tiền 1 tr/.test(p7) && p7.includes("1 đơn"), p7.slice(0, 260));
  ok("A4 Bán chạy: Nến tự phối 3 cái đứng đầu", /1 Nến tự phối 3 đã bán/.test(p7), p7.match(/Sản phẩm bán chạy.{0,120}/)?.[0]);
  ok("A5 Có nhóm Tự phối trong biểu đồ theo danh mục", /Theo danh mục.*Tự phối/.test(p7));
  const before = p7.match(/Doanh thu (\S+ \S+)/)?.[1];

  await clickText(".ant-segmented-item", "30 ngày");
  await sleep(600);
  const p30 = await page();
  ok("B1 Đổi kỳ thì đổi số và URL sạch", (await t.loc()) === "/" && /30 ngày qua/.test(p30) && p30.match(/Doanh thu (\S+ \S+)/)?.[1] !== before, `${before} -> ${p30.match(/Doanh thu (\S+ \S+)/)?.[1]}`);
  ok("B2 Cột biểu đồ vẽ ra", (await ev("document.querySelectorAll('.recharts-bar-rectangle').length")) > 0);
  await clickText(".ant-segmented-item", "90 ngày");
  await sleep(600);
  ok("B3 Kỳ 90 nằm trên URL", (await t.loc()).includes("days=90"));
  await go(base + "/?days=90", 2400);
  ok("B4 Tải lại giữ kỳ", (await page()).includes("trong 90 ngày qua"));

  await go(base + "/", 2400);
  await click(`[...document.querySelectorAll('main a')].find(a=>a.getAttribute('href')==='/orders?payment=refunding')`);
  await sleep(1600);
  ok("C1 Link Chờ hoàn tiền lọc đúng", (await text("main .ant-table-row")).length === 1 && (await text("main .ant-table-row")).join().includes("TD"), (await text("main .ant-table-row")).length + "");
  await go(base + "/", 2400);
  await click(`[...document.querySelectorAll('main a')].find(a=>a.getAttribute('href').startsWith('/orders?status='))`);
  await sleep(1600);
  ok("C2 Link Giao lỗi mở đúng tab", (await text("main .ant-table-row")).length === 1 && (await text(".ant-tabs-tab-active")).join().includes("Giao không thành"), (await text(".ant-tabs-tab-active")).join());

  await ev("localStorage.setItem('bo-orders-v3','[]')");
  await go(base + "/", 2400);
  const empty = await page();
  await shot("d23-empty.png", true);
  ok("D1 Không có đơn: hiện rỗng, không lỗi", empty.includes("Chưa có đơn trong kỳ này.") && empty.includes("chưa có số để so sánh"));

  await ev("Object.keys(localStorage).filter(k=>k.startsWith('bo-')).forEach(k=>localStorage.removeItem(k))");
  await viewport(390, 844, true);
  await go(base + "/", 2600);
  await shot("d23-m.png", true);
  ok("M1 Điện thoại không tràn ngang", (await overflow()).length === 0, (await overflow()).join());

  console.log(logs.length ? "LOGS:\n" + logs.slice(0, 5).join("\n") : "Không có lỗi console");
});
