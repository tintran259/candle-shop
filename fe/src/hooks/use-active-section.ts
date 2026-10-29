"use client";

import { useEffect, useState } from "react";

// Mục đang xem trên màn hình (cho thanh tiến trình), theo vị trí cuộn
export function useActiveSection<T extends string>(ids: readonly T[], prefix = "") {
  const [active, setActive] = useState<T>(ids[0]);

  useEffect(() => {
    const visible = new Map<T, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = e.target.id.slice(prefix.length) as T;
          if (e.isIntersecting) visible.set(id, e.boundingClientRect.top);
          else visible.delete(id);
        }
        const first = ids.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      // Vùng "đang đọc" là dải ngay dưới header
      { rootMargin: "-160px 0px -55% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(prefix + id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids, prefix]);

  return active;
}
