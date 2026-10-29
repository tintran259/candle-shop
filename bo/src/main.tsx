import dayjs from "dayjs";
import "dayjs/locale/vi";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import "@/index.css";

// Lịch, tên thứ/tháng của DatePicker theo tiếng Việt
dayjs.locale("vi");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
