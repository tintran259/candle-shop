import { useSyncExternalStore } from "react";
import { ApiError } from "@/lib/api";
import { REMOTE } from "@/lib/data-mode";
import { notifyError } from "@/lib/notify";
import { enqueue, flushWrites, pendingWrites } from "@/lib/write-queue";

// Giả lập độ trễ tải ở chế độ dữ liệu trên trình duyệt để giao diện xử lý trạng thái "đang tải" giống khi có BE. Đặt 0 để tắt.
export const MOCK_LATENCY_MS = 400;

// Kho dữ liệu dùng chung: mọi component đọc một bản, đổi là cùng render lại.
// - Có `remote` và đang dùng BE (data-mode.ts): tải bằng API khi có component đầu tiên cần, set() chỉ đổi bản trong bộ nhớ.
//   Thao tác sửa dùng sync(): đổi ngay trên giao diện rồi gọi API, BE trả về thì lấy bản của BE, lỗi thì báo và tải lại.
// - Không thì lưu trên trình duyệt (localStorage) như trước. migrate: đổi bản lưu cũ sang cấu trúc mới ngay khi đọc
// Mọi kho đã tạo, theo khóa — để sao lưu lấy đủ dữ liệu đang hiển thị (cả dữ liệu mặc định chưa từng ghi)
export const registeredStores = new Map<string, { get: () => unknown; online: boolean; loaded: () => boolean; reload: () => Promise<unknown> }>();

export { flushWrites };

// Dữ liệu luôn mới khi dùng nhiều thiết bị: quay lại tab / mở lại app sau REFRESH_AFTER_MS thì tải lại các kho đang dùng
// (sau khi gửi xong thay đổi đang chờ — không ghi đè thao tác chưa lưu)
const REFRESH_AFTER_MS = 30_000;
let hiddenAt = 0;
export async function refreshStores() {
  if (pendingWrites() > 0) await flushWrites();
  await Promise.all([...registeredStores.values()].filter((s) => s.online && s.loaded()).map((s) => s.reload()));
}
if (typeof document !== "undefined" && REMOTE)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") hiddenAt = Date.now();
    else if (hiddenAt && Date.now() - hiddenAt >= REFRESH_AFTER_MS) void refreshStores();
  });

export function createLocalStore<T>(key: string, fallback: T, migrate?: (saved: T) => T, remote?: () => Promise<T>) {
  const online = REMOTE && !!remote;
  // undefined = chưa tải xong
  let state: T | undefined;
  let loading = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const read = (): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw) as T;
        return migrate ? migrate(saved) : saved;
      }
    } catch {
      // Dữ liệu hỏng hoặc trình duyệt chặn bộ nhớ — dùng dữ liệu mẫu
    }
    return fallback;
  };

  // Tải (lại) từ BE. Lỗi thì báo và để lần mở trang sau thử lại
  const load = async () => {
    loading = true;
    try {
      const data = await remote!();
      state = migrate ? migrate(data) : data;
      emit();
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) notifyError(e instanceof Error ? e.message : "Không tải được dữ liệu.");
    } finally {
      loading = false;
    }
  };

  // Bắt đầu tải một lần duy nhất
  const ensureLoaded = () => {
    if (state !== undefined || loading) return;
    if (online) return void load();
    loading = true;
    setTimeout(() => {
      state = read();
      loading = false;
      emit();
    }, MOCK_LATENCY_MS);
  };

  const snapshot = () => state;
  // Dùng khi ghi: nếu chưa tải xong thì đọc ngay để không mất dữ liệu (BE: chưa tải thì dùng dữ liệu mặc định)
  const get = () => (online ? (state ?? fallback) : (state ??= read()));

  // null = xóa bản lưu, quay về dữ liệu mẫu.
  // Trả false khi trình duyệt hết chỗ lưu (thường do quá nhiều ảnh) — giữ nguyên dữ liệu cũ
  const set = (next: T | null) => {
    if (!online)
      try {
        if (next) localStorage.setItem(key, JSON.stringify(next));
        else localStorage.removeItem(key);
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") return false;
      }
    state = next ?? fallback;
    emit();
    return true;
  };

  // Đổi ngay trên giao diện, rồi gọi BE (chỉ khi dùng BE). request trả hàm áp bản BE trả về vào dữ liệu hiện tại,
  // hoặc "reload" để tải lại cả kho (thao tác đổi nhiều thứ cùng lúc, vd sản xuất trừ nhiều nguyên liệu).
  // Các yêu cầu chạy lần lượt theo thứ tự gọi, chung mọi kho (tạo nguyên liệu xong mới sản xuất mẻ đầu; tạo sản phẩm xong mới gắn vào nến hủy đơn).
  // BE từ chối (vd tên trùng) thì báo lỗi của BE và tải lại để giao diện khớp dữ liệu thật
  const sync = (next: T, request?: () => Promise<((current: T) => T) | "reload" | void>) => {
    const ok = set(next);
    // Mất mạng thì write-queue giữ thao tác và tự gửi lại; BE từ chối thì báo lỗi, tải lại
    if (online && request)
      void enqueue(
        () => request().then((apply) => (apply === "reload" ? load() : apply && set(apply(get())))),
        (e) => {
          if (!(e instanceof ApiError && e.status === 401)) notifyError(e instanceof Error ? e.message : "Không lưu được, thử lại.");
          return load();
        },
      );
    return ok;
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    ensureLoaded();
    return () => listeners.delete(listener);
  };

  const reload = () => (online ? load() : Promise.resolve());
  registeredStores.set(key, { get, online, loaded: () => state !== undefined, reload });
  return { get, set, sync, subscribe, snapshot, fallback, online, reload };
}

export type LocalStore<T> = ReturnType<typeof createLocalStore<T>>;

// Trả về dữ liệu (dữ liệu mẫu trong lúc tải) + cờ loading để trang hiện skeleton
export function useLocalStore<T>(store: LocalStore<T>) {
  const value = useSyncExternalStore(store.subscribe, store.snapshot);
  return { data: value ?? store.fallback, loading: value === undefined };
}

// Thay một phần tử theo id bằng bản BE trả về (thêm vào nếu chưa có)
export const upsert =
  <T extends { id: string }>(item: T, atStart = false) =>
  (list: T[]) =>
    list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : atStart ? [item, ...list] : [...list, item];
