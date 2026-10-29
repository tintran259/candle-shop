import { useSyncExternalStore } from "react";

// Giả lập độ trễ gọi API ở lần tải đầu để giao diện xử lý trạng thái "đang tải" giống khi có BE.
// Đặt 0 để tắt.
export const MOCK_LATENCY_MS = 400;

// Kho dữ liệu tạm lưu trên trình duyệt (chưa có API). Mọi component dùng chung một bản, đổi là cùng render lại.
// Khi có BE: thay load (bất đồng bộ) bằng fetch, set bằng gọi API — giao diện get/set/subscribe giữ nguyên.
export function createLocalStore<T>(key: string, fallback: T) {
  // undefined = chưa tải xong
  let state: T | undefined;
  let loading = false;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  const read = (): T => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // Dữ liệu hỏng hoặc trình duyệt chặn bộ nhớ — dùng dữ liệu mẫu
    }
    return fallback;
  };

  // Bắt đầu tải một lần duy nhất
  const ensureLoaded = () => {
    if (state !== undefined || loading) return;
    loading = true;
    setTimeout(() => {
      state = read();
      loading = false;
      emit();
    }, MOCK_LATENCY_MS);
  };

  const snapshot = () => state;
  // Dùng khi ghi: nếu chưa tải xong thì đọc ngay để không mất dữ liệu
  const get = () => (state ??= read());

  // null = xóa bản lưu, quay về dữ liệu mẫu.
  // Trả false khi trình duyệt hết chỗ lưu (thường do quá nhiều ảnh) — giữ nguyên dữ liệu cũ
  const set = (next: T | null) => {
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

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    ensureLoaded();
    return () => listeners.delete(listener);
  };

  return { get, set, subscribe, snapshot, fallback };
}

export type LocalStore<T> = ReturnType<typeof createLocalStore<T>>;

// Trả về dữ liệu (dữ liệu mẫu trong lúc tải) + cờ loading để trang hiện skeleton
export function useLocalStore<T>(store: LocalStore<T>) {
  const value = useSyncExternalStore(store.subscribe, store.snapshot);
  return { data: value ?? store.fallback, loading: value === undefined };
}
