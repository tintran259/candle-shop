// Báo lỗi từ chỗ không có hook (đồng bộ dữ liệu với BE chạy nền). NotifyBridge trong App gắn message của antd vào đây
import { App } from "antd";
import { useEffect } from "react";

type Show = (text: string) => void;
let showError: Show = (text) => console.error(text);

export const notifyError = (text: string) => showError(text);

export function NotifyBridge() {
  const { message } = App.useApp();
  useEffect(() => {
    showError = (text) => void message.error(text);
  }, [message]);
  return null;
}
