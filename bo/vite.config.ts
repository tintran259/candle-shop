import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { port: 3001 },
  preview: { port: 3001 },
  // antd + React nằm chung chunk chính (~270KB gzip) — chấp nhận được với trang quản trị nội bộ
  build: { chunkSizeWarningLimit: 900 },
});
