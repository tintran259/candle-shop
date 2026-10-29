import { useEffect } from "react";

// Đặt tiêu đề tab trình duyệt cho từng trang
export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} — 2510 Back office`;
  }, [title]);
}
