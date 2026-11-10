// Hàng đợi ghi lên BE, chung mọi kho (local-store.ts): chạy lần lượt theo thứ tự gọi.
// Mất mạng / máy chủ không trả lời (ApiError 0): KHÔNG bỏ thao tác — giữ nguyên thứ tự, chờ rồi gửi lại (khi có mạng hoặc sau RETRY_MS),
// báo "N thay đổi chưa lưu" và chặn đóng trang. Mỗi thao tác có Idempotency-Key riêng (api.ts) nên gửi lại không bị ghi trùng.
// Lỗi khác (BE từ chối) thì gọi fail: báo lỗi, tải lại kho.
import { ApiError, runWithWriteKey } from "@/lib/api";
import { notifyOffline } from "@/lib/notify";

const RETRY_MS = 10_000;

let chain: Promise<unknown> = Promise.resolve();
// Số thao tác đã xếp hàng chưa xong
let waiting = 0;
let offline = false;
let wake: (() => void) | null = null;

const isNetwork = (e: unknown) => e instanceof ApiError && e.status === 0;

// Chờ có mạng lại (sự kiện online) hoặc hết RETRY_MS
const pause = () =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(done, RETRY_MS);
    function done() {
      clearTimeout(timer);
      wake = null;
      resolve();
    }
    wake = done;
  });

if (typeof window !== "undefined") {
  window.addEventListener("online", () => wake?.());
  // Còn thay đổi chưa gửi được: trình duyệt hỏi trước khi đóng / tải lại trang
  window.addEventListener("beforeunload", (e) => {
    if (waiting > 0) e.preventDefault();
  });
}

const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

export function enqueue(task: () => Promise<unknown>, fail: (e: unknown) => Promise<unknown>) {
  waiting += 1;
  const key = newKey();
  chain = chain.then(async () => {
    for (;;) {
      try {
        await runWithWriteKey(key, task);
        break;
      } catch (e) {
        if (!isNetwork(e)) {
          await fail(e);
          break;
        }
        offline = true;
        notifyOffline(waiting);
        await pause();
      }
    }
    waiting -= 1;
    if (offline) {
      if (waiting === 0) offline = false;
      notifyOffline(waiting);
    }
  });
  return chain;
}

// Chờ mọi yêu cầu ghi đang chờ chạy xong (vd trước khi tải lại dữ liệu liên quan)
export const flushWrites = () => chain;
export const pendingWrites = () => waiting;
