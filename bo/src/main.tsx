import dayjs from "dayjs";
import "dayjs/locale/vi";
import relativeTime from "dayjs/plugin/relativeTime";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import "@/index.css";

// Lịch, tên thứ/tháng của DatePicker theo tiếng Việt
dayjs.locale("vi");
// "5 phút trước" cho thông báo
dayjs.extend(relativeTime);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
