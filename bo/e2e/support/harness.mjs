// Bộ hàm test E2E chạy trên Playwright. Giữ đúng API của bộ test CDP cũ (ev, click, clickText, type, pick, go…)
// để các kịch bản viết trước đó chạy nguyên vẹn: thao tác bằng chuột/bàn phím thật qua CDP, không set value trực tiếp.
// Test mới nên ưu tiên locator của Playwright (page.getByRole…); lớp này để giữ các kịch bản cũ.
import { test as base, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sampleStorage } from "./samples.ts";

export { expect };

const here = path.dirname(fileURLToPath(import.meta.url));
export const fixture = (name) => path.join(here, "..", "fixtures", name);
export const readFixture = (name) => JSON.parse(fs.readFileSync(fixture(name), "utf8"));

// Web (fe) chạy dev ở cổng 3000. BO tự đẩy cấu hình Thủ công sang đó — test nào cần thì bật `storefront`.
export const SF_URL = process.env.SF_URL ?? "http://localhost:3000";
const SF_FILE = path.join(here, "..", "..", "..", "fe", ".craft-config.local.json");
const SESSION_KEY = "2510-admin-session";

export const sfReachable = async () => {
  try {
    return (await fetch(SF_URL + "/api/craft-config")).ok;
  } catch {
    return false;
  }
};

export const test = base.extend({
  // false: không tạo sẵn phiên đăng nhập (test trang Đăng nhập)
  autoLogin: [true, { option: true }],
  // true: cho BO gửi cấu hình sang web thật (mặc định chặn để test không ghi đè cấu hình web đang dev)
  storefront: [false, { option: true }],
  // true: nạp đơn hàng, sản phẩm trưng bày, sản phẩm hủy đơn mẫu khi khóa còn trống (app thật bắt đầu trống)
  samples: [true, { option: true }],

  t: async ({ page, baseURL, autoLogin, storefront, samples }, use, testInfo) => {
    if (samples)
      await page.addInitScript((data) => {
        for (const [key, value] of Object.entries(data)) if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
      }, sampleStorage);
    if (autoLogin)
      await page.addInitScript(
        ([key]) => {
          if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ email: "admin@2510.vn", name: "Admin 2510", expiresAt: Date.now() + 864e5 }));
        },
        [SESSION_KEY],
      );
    // Giữ lại cấu hình web trước test để trả về sau
    const sfBackup = storefront && fs.existsSync(SF_FILE) ? fs.readFileSync(SF_FILE) : null;
    if (!storefront) await page.route("**/api/craft-config", (route) => route.abort());

    const client = await page.context().newCDPSession(page);
    const logs = [];
    client.on("Runtime.exceptionThrown", (m) => logs.push("EXC " + m.exceptionDetails.exception?.description?.slice(0, 300)));
    client.on("Runtime.consoleAPICalled", (m) => {
      if (["error", "warning"].includes(m.type)) logs.push(m.type + " " + m.args.map((a) => a.value ?? a.description).join(" ").slice(0, 300));
    });
    await client.send("Runtime.enable");
    await client.send("Page.enable");
    const send = (method, params = {}) => client.send(method, params).catch((e) => ({ error: String(e) }));

    const out = testInfo.outputPath("shots");
    fs.mkdirSync(out, { recursive: true });
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const ev = async (expression) => {
      const r = await client.send("Runtime.evaluate", { returnByValue: true, awaitPromise: true, expression });
      if (r.exceptionDetails) throw new Error("eval: " + r.exceptionDetails.exception?.description?.slice(0, 200) + "\n" + expression.slice(0, 200));
      return r.result?.value;
    };
    let width = 1440, height = 1000, mobile = false;
    const viewport = async (w, h, isMobile = false) => {
      width = w;
      height = h;
      mobile = isMobile;
      await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: isMobile ? 2 : 1, mobile: isMobile });
    };
    await viewport(1440, 1000);
    const shot = async (name, full = false) => {
      let h = height;
      if (full) h = Math.min(4000, await ev("Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)"));
      if (h !== height) await send("Emulation.setDeviceMetricsOverride", { width, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
      await sleep(250);
      const r = await send("Page.captureScreenshot", { format: "png" });
      if (r.data) {
        const file = path.join(out, name.endsWith(".png") ? name : name + ".png");
        fs.writeFileSync(file, Buffer.from(r.data, "base64"));
        await testInfo.attach(path.basename(file), { path: file, contentType: "image/png" });
      }
      if (h !== height) await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
    };
    // Tìm phần tử bằng JS (biểu thức trả về Element), cuộn vào view rồi bấm chuột thật ở tâm
    const click = async (findExpr, label = findExpr) => {
      const rect = await ev(`(()=>{const el=(${findExpr});if(!el)return null;el.scrollIntoView({block:'center',inline:'center'});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,w:r.width}})()`);
      if (!rect || !rect.w) throw new Error("Không tìm thấy để bấm: " + label);
      await sleep(80);
      const rect2 = await ev(`(()=>{const el=(${findExpr});const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);
      for (const type of ["mouseMoved", "mousePressed", "mouseReleased"]) await send("Input.dispatchMouseEvent", { type, x: rect2.x, y: rect2.y, button: "left", clickCount: 1 });
      await sleep(150);
    };
    const byText = (sel, text, exact = false) =>
      `[...document.querySelectorAll(${JSON.stringify(sel)})].filter(x=>x.offsetParent!==null||getComputedStyle(x).position==='fixed').find(x=>{const t=x.innerText.replace(/\\s+/g,' ').trim();return ${exact ? "t===" + JSON.stringify(text) : "t.includes(" + JSON.stringify(text) + ")"}})`;
    const clickText = (sel, text, exact) => click(byText(sel, text, exact), `${sel} "${text}"`);
    const press = async (key, code = key, keyCode) => {
      await send("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: keyCode });
      await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: keyCode });
    };
    // Gõ vào ô: bấm, chọn hết, xóa, gõ chữ
    const type = async (findExpr, text) => {
      await click(findExpr);
      await ev(`(()=>{const el=(${findExpr});const i=el.matches('input,textarea')?el:el.querySelector('input,textarea');i.focus();i.select&&i.select()})()`);
      await press("Backspace", "Backspace", 8);
      if (text !== "") await send("Input.insertText", { text: String(text) });
      await sleep(120);
    };
    // antd Select: bấm vào ô rồi chọn option có chữ
    const pick = async (selectExpr, optionText, search = false) => {
      await click(selectExpr);
      await sleep(300);
      if (search) {
        await send("Input.insertText", { text: optionText });
        await sleep(300);
      }
      await click(
        `[...document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')].find(o=>o.innerText.replace(/\\s+/g,' ').includes(${JSON.stringify(optionText)}))`,
        `option "${optionText}"`,
      );
      await sleep(250);
    };
    const text = (sel) => ev(`[...document.querySelectorAll(${JSON.stringify(sel)})].map(x=>x.innerText.replace(/\\s+/g,' ').trim())`);
    const loc = () => ev("location.pathname + location.search");
    const go = async (url, wait = 2200) => {
      await send("Page.navigate", { url });
      await sleep(wait);
    };
    // Đổi thứ tự một mục kéo thả bằng bàn phím: Tab tới tay nắm, Space nhấc, mũi tên, Space đặt
    const moveStep = async (name, dir) => {
      const key = async (k, code, kc) => {
        for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key: k, code, windowsVirtualKeyCode: kc });
      };
      await ev(`document.querySelector('[aria-label="Kéo để sắp xếp ${name}"]').focus()`);
      await key(" ", "Space", 32);
      await sleep(250);
      for (let i = 0; i < Math.abs(dir); i++) {
        await (dir < 0 ? key("ArrowUp", "ArrowUp", 38) : key("ArrowDown", "ArrowDown", 40));
        await sleep(200);
      }
      await key(" ", "Space", 32);
      await sleep(350);
    };
    const results = [];
    // Mỗi mục kiểm tra là một expect.soft: sai một mục vẫn chạy tiếp, báo cáo ghi đủ tên các mục sai
    const ok = (name, cond, detail = "") => {
      results.push({ name, pass: !!cond, detail });
      expect.soft(!!cond, `${name}${detail ? " — " + String(detail).slice(0, 300) : ""}`).toBe(true);
    };
    // Phát hiện tràn ngang trong vùng chọn (lỗi layout)
    const overflow = (sel = "main") =>
      ev(
        `(()=>{const out=[];const root=document.querySelector(${JSON.stringify(sel)});if(!root)return out;const W=document.documentElement.clientWidth;for(const el of root.querySelectorAll('*')){const r=el.getBoundingClientRect();if(r.width&&r.right>W+1&&!el.closest('.ant-table-content,.ant-table-body,.ant-tabs-nav-list,.ant-segmented'))out.push((el.className&&el.className.baseVal===undefined?String(el.className).split(' ')[0]:el.tagName)+':'+Math.round(r.right));}return [...new Set(out)].slice(0,8)})()`,
      );

    await use({ base: baseURL, out, overflow, send, ev, sleep, shot, click, clickText, byText, type, pick, press, text, loc, go, ok, results, logs, viewport, moveStep, page, close: () => {} });

    // Lỗi console mới (bỏ qua favicon) cũng làm test trượt
    const bad = logs.filter((l) => !l.includes("favicon") && !/api\/craft-config|ERR_FAILED|net::/.test(l));
    expect.soft(bad, "Không có lỗi console").toEqual([]);
    if (storefront) {
      if (sfBackup) fs.writeFileSync(SF_FILE, sfBackup);
      else fs.rmSync(SF_FILE, { force: true });
    }
  },
});
