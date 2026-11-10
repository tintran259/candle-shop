import { defineConfig } from "@playwright/test";
import { randomBytes, scryptSync } from "node:crypto";
import { API, BE_DIR, BE_PORT, BO_PORT, PIN, SCHEMA } from "./e2e-be/support/env";

// E2E BO + BE thật (luồng chính): BE build rồi chạy cổng 4099 trên schema bo_e2e của DB trong be/.env,
// BO build chế độ API (gọi BE đó) chạy cổng 3013. Mỗi test nạp lại dữ liệu mẫu. Chạy: pnpm test:e2e:be
// PIN test 739214 — mã băm tạo mới mỗi lần chạy, không dùng PIN thật. Không có khóa Cloudinary: ảnh lưu data URL
const salt = randomBytes(16);
const pinHash = `scrypt$${salt.toString("base64url")}$${scryptSync(PIN, salt, 32).toString("base64url")}`;

export default defineConfig({
  testDir: "e2e-be",
  testMatch: "**/*.spec.ts",
  globalSetup: "./e2e-be/support/global-setup.ts",
  timeout: 3 * 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  // Cùng một DB: chạy lần lượt
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report-be" }]],
  outputDir: "test-results-be",
  use: {
    baseURL: `http://localhost:${BO_PORT}`,
    channel: process.env.PW_CHANNEL ?? "msedge",
    headless: true,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    trace: "retain-on-failure",
    actionTimeout: 15_000,
  },
  webServer: [
    {
      command: "npx nest build && node dist/main.js",
      cwd: BE_DIR,
      url: `${API}/health`,
      env: {
        PORT: String(BE_PORT),
        DB_SCHEMA: SCHEMA,
        ADMIN_PIN_HASH: pinHash,
        JWT_SECRET: "bi-mat-ky-token-cho-e2e-bo-dai-hon-32-ky-tu",
        BO_URL: `http://localhost:${BO_PORT}`,
        CLOUDINARY_CLOUD_NAME: "",
        CLOUDINARY_API_KEY: "",
        CLOUDINARY_API_SECRET: "",
      },
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: `pnpm exec vite build --outDir dist-be && pnpm exec vite preview --outDir dist-be --port ${BO_PORT} --strictPort`,
      url: `http://localhost:${BO_PORT}`,
      // Sentry trỏ tới địa chỉ giả: test monitoring.spec.ts chặn gói gửi đi để kiểm tra; test khác không gửi được thì thôi
      env: { VITE_API_URL: API, VITE_DATA_SOURCE: "api", VITE_SENTRY_DSN: "https://pubkey@sentry.invalid/1" },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
});
