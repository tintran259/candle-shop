import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Tạo bảng trong schema bo_test (Neon) trước khi chạy; các file test chạy lần lượt vì dùng chung schema
    globalSetup: ['./test/setup-db.ts'],
    fileParallelism: false,
    // CI xa DB (Mỹ → Singapore) nên cho phép tăng qua biến môi trường
    testTimeout: Number(process.env.E2E_TEST_TIMEOUT_MS) || 30_000,
    hookTimeout: 120_000,
  },
});
