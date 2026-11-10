import dayjs from "dayjs";
import "dayjs/locale/vi";
import relativeTime from "dayjs/plugin/relativeTime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import "@/index.css";
import { initMonitoring } from "@/lib/monitoring";

// Lịch, tên thứ/tháng của DatePicker theo tiếng Việt
dayjs.locale("vi");
// "5 phút trước" cho thông báo
dayjs.extend(relativeTime);
// Sentry (chỉ khi có VITE_SENTRY_DSN)
initMonitoring();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
