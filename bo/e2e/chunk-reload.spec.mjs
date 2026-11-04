// E2E 5 — file code của trang không còn (vừa build/deploy): tự tải lại 1 lần, vẫn lỗi thì trang báo lỗi tiếng Việt giữ sidebar
import { test } from "./support/harness.mjs";

test("E2E 5 — file code của trang không còn (vừa build/deploy): tự tải lại 1 lần, vẫn lỗi thì trang báo lỗi tiếng Việt giữ sidebar", async ({ t }) => {
  const base = t.base;
  const { ev, sleep, shot, click, clickText, go, ok, send } = t;
  await send("Network.enable");
  await send("Page.enable");
  let loads = 0;
  await go(base + "/", 2500);
  await ev("sessionStorage.clear()");
  // Giả lập: file trang Kho đã bị xóa sau khi build
  await send("Network.setBlockedURLs", { urls: ["*/assets/inventory-*"] });
  const nav0 = await ev("performance.getEntriesByType('navigation')[0].startTime + ':' + performance.timeOrigin");
  await clickText(".ant-menu-item", "Kho nguyên liệu");
  await sleep(4000);
  const nav1 = await ev("performance.timeOrigin");
  ok("Lỗi tải code trang → tự tải lại trang 1 lần", String(nav0).split(":")[1] !== String(nav1), `${nav0} → ${nav1}`);
  ok("Tải lại đúng trang đang mở (/inventory), không về Tổng quan", (await t.loc()).startsWith("/inventory"), await t.loc());
  const body = await ev("document.body.innerText");
  ok("Vẫn lỗi sau khi tải lại → trang báo lỗi tiếng Việt", body.includes("Trang quản trị vừa được cập nhật") && !body.includes("Unexpected Application Error"), body.replace(/\s+/g, " ").slice(0, 160));
  ok("Sidebar vẫn còn để chuyển trang", (await ev("document.querySelectorAll('.ant-menu-item').length")) > 3);
  await shot("x1-chunk-error.png");
  // Hết lỗi (file mới đã có) → bấm Tải lại trang
  await send("Network.setBlockedURLs", { urls: [] });
  await clickText("button", "Tải lại trang");
  await sleep(3500);
  ok("Bấm 'Tải lại trang' → vào được trang Kho", (await ev("document.querySelector('main h3')?.innerText")) === "Kho nguyên liệu");
  console.log("logs:", t.logs.filter((l) => !l.includes("inventory-")));
});
