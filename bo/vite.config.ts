import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Bản build trên Render: mã commit (RENDER_GIT_COMMIT) làm phiên bản cho Sentry — biết lỗi thuộc bản nào
export default defineConfig({
  define: { "import.meta.env.VITE_RELEASE": JSON.stringify(process.env.RENDER_GIT_COMMIT ?? "") },
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { port: 3001 },
  preview: { port: 3001 },
  // React tách file riêng: tên file theo nội dung nên trình duyệt lưu đệm lâu — sửa code BO không phải tải lại.
  // antd để Vite tự chia theo trang (mỗi trang chỉ tải thành phần mình dùng); recharts nằm trong file của trang Tổng quan
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/.test(id)) return "react";
        },
      },
    },
  },
});
