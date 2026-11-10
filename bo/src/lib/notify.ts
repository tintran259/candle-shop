// Báo lỗi / máy chủ chậm từ chỗ không có hook (gọi API, đồng bộ dữ liệu với BE chạy nền). NotifyBridge trong App gắn message của antd vào đây
import { App } from "antd";
import { useEffect } from "react";

type Show = (text: string) => void;
let showError: Show = (text) => console.error(text);
let showSlow: (on: boolean) => void = () => {};
let showOffline: (waiting: number) => void = () => {};

export const notifyError = (text: string) => showError(text);
// Mất kết nối khi đang lưu: waiting = số thay đổi chưa gửi được; 0 = đã gửi hết
export const notifyOffline = (waiting: number) => showOffline(waiting);

// Máy chủ chậm trả lời (BE gói Free trên Render ngủ khi lâu không dùng, khởi động lại mất ~30–60 giây):
// request nào quá SLOW_MS chưa xong thì hiện thông báo chờ, mọi request chậm xong thì ẩn
const SLOW_MS = 5000;
let slow = 0;
export async function watchSlow<T>(request: Promise<T>): Promise<T> {
  let late = false;
  const timer = setTimeout(() => {
    late = true;
    if (slow++ === 0) showSlow(true);
  }, SLOW_MS);
  try {
    return await request;
  } finally {
    clearTimeout(timer);
    if (late && --slow === 0) showSlow(false);
  }
}

const SLOW_KEY = "server-slow";
const OFFLINE_KEY = "offline";

export function NotifyBridge() {
  const { message } = App.useApp();
  useEffect(() => {
    showError = (text) => void message.error(text);
    showSlow = (on) =>
      on
        ? void message.open({ key: SLOW_KEY, type: "loading", content: "Máy chủ đang khởi động (lâu không dùng nên máy chủ tạm ngủ) — chờ khoảng 30–60 giây…", duration: 0 })
        : message.destroy(SLOW_KEY);
    showOffline = (waiting) => {
      if (waiting > 0)
        return void message.open({
          key: OFFLINE_KEY,
          type: "warning",
          content: `Mất kết nối máy chủ — ${waiting} thay đổi chưa lưu, sẽ tự gửi lại khi có mạng. Đừng đóng trang.`,
          duration: 0,
        });
      message.destroy(OFFLINE_KEY);
      void message.success("Đã kết nối lại — đã lưu các thay đổi.");
    };
  }, [message]);
  return null;
}
