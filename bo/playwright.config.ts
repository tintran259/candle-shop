import { defineConfig } from "@playwright/test";

// E2E của BO: build rồi chạy bản preview ở cổng 3011 (giống lúc dùng thật), trình duyệt Edge có sẵn trên máy.
// Chạy: pnpm test:e2e (tất cả) · pnpm test:e2e e2e/orders-create (một file) · pnpm test:e2e:report (xem báo cáo)
export default defineConfig({
  testDir: "e2e",
  // .mjs: kịch bản trên trình duyệt · .ts: quy tắc nghiệp vụ gọi thẳng hàm trong src (không mở trình duyệt)
  testMatch: "**/*.spec.{mjs,ts}",
  // Kịch bản dài (đi hết một luồng nghiệp vụ) nên cho mỗi test tối đa 6 phút
  timeout: 6 * 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  // Các kịch bản có chờ cố định theo thời gian: chạy song song làm máy chậm, nhiều mục trượt giả → chạy lần lượt
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3011",
    channel: process.env.PW_CHANNEL ?? "msedge",
    headless: true,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    trace: "retain-on-failure",
    // Thao tác không thấy phần tử thì báo lỗi sau 10 giây, không treo tới hết thời gian của test
    actionTimeout: 10_000,
  },
  webServer: {
    command: "pnpm exec vite build && pnpm exec vite preview --port 3011 --strictPort",
    url: "http://localhost:3011",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
