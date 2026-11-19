import { useMemo } from "react";
import { api, ApiError } from "@/lib/api";
import { comboSet } from "@/lib/color-mix/combo";
import { defaultColorMix, migrateColorMix } from "@/lib/color-mix/defaults";
import type { ColorMixData, MixPrefs, MixSet, MixView } from "@/lib/color-mix/types";
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

// Kết hợp: bộ ghép từ hai bộ (lib/color-mix/combo.ts), chỉ ghi lại mẫu kiểm chứng của nó (comboChecks)
export function useColorMix(view: MixView) {
  const { data, loading } = useLocalStore(store);
  // Bộ Kết hợp chỉ ghép lại khi hai bộ hoặc mẫu kiểm chứng kết hợp đổi (lưu thông số Pha màu thì không) — giữ được kết quả đã tính (solveMixCached)
  const { oxide, liquid } = data.sets;
  const { comboChecks } = data;
  const combo = useMemo(() => comboSet({ version: 2, sets: { oxide, liquid }, comboChecks }), [oxide, liquid, comboChecks]);
  const set = view === "combo" ? combo : data.sets[view];
  return useMemo(() => {
    // touch = sửa dữ liệu mẫu (mẫu trắng, màu cơ bản, thông số màu nước) → bỏ nhãn "dữ liệu minh họa". Mẫu kiểm chứng không tính
    const update = (fn: (s: MixSet) => MixSet, touch = true) => {
      const current = store.get();
      if (view === "combo") return save({ ...current, comboChecks: fn(comboSet(current)).checks });
      const next = fn(current.sets[view]);
      save({ ...current, sets: { ...current.sets, [view]: touch ? { ...next, demo: false } : next } });
    };
    // Thông số tab Pha màu (nước, độ chính xác cân, tổng màu tối đa) — nhớ riêng từng loại; undefined = bỏ (vd nước quay về theo mẫu)
    const savePrefs = (patch: MixPrefs) => {
      const current = store.get();
      const next = { ...current.prefs?.[view], ...patch };
      for (const k of Object.keys(next) as (keyof MixPrefs)[]) if (next[k] === undefined) delete next[k];
      save({ ...current, prefs: { ...current.prefs, [view]: next } });
    };
    return { set, data, loading, update, prefs: data.prefs?.[view] ?? {}, savePrefs };
  }, [set, data, loading, view]);
}
