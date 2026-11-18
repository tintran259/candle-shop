import { useMemo } from "react";
import { api, ApiError } from "@/lib/api";
import { defaultColorMix, defaultMixSet, migrateColorMix } from "@/lib/color-mix/defaults";
import type { ColorMixData, MixMode, MixSet } from "@/lib/color-mix/types";
import { createLocalStore, useLocalStore } from "@/lib/local-store";
import { notifyError } from "@/lib/notify";
import { enqueue } from "@/lib/write-queue";

// Dữ liệu Pha màu (docs/pages/color-mix.md): một bản JSON cho cả BO. Chế độ BE lưu ở /api/admin/color-mix
// (gửi sau khi ngừng sửa 0,8 giây — kéo bảng chọn màu bắn nhiều thay đổi liên tục), không thì trên trình duyệt này.
// BE trả rỗng khi chưa lưu lần nào → dùng dữ liệu minh họa
const store = createLocalStore<ColorMixData>("bo-color-mix-v1", defaultColorMix(), migrateColorMix, async () => migrateColorMix(await api<ColorMixData | null | undefined>("GET", "/admin/color-mix")));

// Gửi qua hàng đợi ghi chung (lib/write-queue.ts): mất mạng thì giữ lại, tự gửi lại, chặn đóng trang; BE từ chối thì báo lỗi, tải lại.
// Gửi bản mới nhất lúc tới lượt (không phải bản lúc sửa). Còn thay đổi chờ gửi thì gửi ngay khi rời tab / đóng trang
let timer: ReturnType<typeof setTimeout> | undefined;
let dirty = false;
const flush = () => {
  clearTimeout(timer);
  timer = undefined;
  if (!dirty) return false;
  dirty = false;
  void enqueue(
    () => api("PUT", "/admin/color-mix", { data: store.get() }),
    (e) => {
      if (!(e instanceof ApiError && e.status === 401)) notifyError(`Chưa lưu được dữ liệu pha màu: ${e instanceof Error ? e.message : "thử lại"}`);
      return store.reload();
    },
  );
  return true;
};
const push = () => {
  dirty = true;
  clearTimeout(timer);
  timer = setTimeout(flush, 800);
};
if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && flush());
  window.addEventListener("beforeunload", (e) => {
    if (flush()) e.preventDefault();
  });
}

const save = (data: ColorMixData) => {
  const ok = store.set(data);
  if (!ok) notifyError("Trình duyệt hết chỗ lưu, chưa lưu được dữ liệu pha màu.");
  if (store.online) push();
};

export function useColorMix(mode: MixMode) {
  const { data, loading } = useLocalStore(store);
  const set = data.sets[mode];
  return useMemo(() => {
    // touch = sửa dữ liệu mẫu (mẫu trắng, màu cơ bản, thông số màu nước) → bỏ nhãn "dữ liệu minh họa". Mẫu kiểm chứng không tính
    const update = (fn: (s: MixSet) => MixSet, touch = true) => {
      const current = store.get();
      const next = fn(current.sets[mode]);
      save({ ...current, sets: { ...current.sets, [mode]: touch ? { ...next, demo: false } : next } });
    };
    const reset = () => {
      const current = store.get();
      save({ ...current, sets: { ...current.sets, [mode]: defaultMixSet(mode) } });
    };
    return { set, loading, update, reset };
  }, [set, loading, mode]);
}
