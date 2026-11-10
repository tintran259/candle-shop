// Gọi API của BE kèm token đăng nhập (docs/api.md). Hết phiên (401) thì đăng xuất để về trang đăng nhập.
// Lỗi trả ApiError với thông báo tiếng Việt của BE (message) và các trường kèm theo (vd shortages, customerId)
import { API_URL } from "@/lib/api-url";
import { getSession, logout } from "@/lib/auth";
import { reportError } from "@/lib/monitoring";
import { watchSlow } from "@/lib/notify";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Khóa chống ghi trùng của thao tác đang chạy trong hàng đợi (write-queue.ts). Mỗi yêu cầu ghi trong thao tác lấy khóa <gốc>:<thứ tự>,
// gửi lại cả thao tác thì thứ tự đánh lại từ 0 → cùng khóa như lần trước, BE trả kết quả cũ thay vì ghi lần hai
let writeKey: { base: string; n: number } | null = null;
export async function runWithWriteKey<T>(base: string, task: () => Promise<T>) {
  writeKey = { base, n: 0 };
  try {
    return await task();
  } finally {
    writeKey = null;
  }
}

// Máy chủ không trả lời quá lâu (gồm cả lúc BE khởi động ~60 giây) thì coi như mất kết nối
const TIMEOUT_MS = 90_000;

export async function api<T = unknown>(method: Method, path: string, body?: unknown): Promise<T> {
  const token = getSession()?.token;
  const key = method !== "GET" && writeKey ? `${writeKey.base}:${writeKey.n++}` : undefined;
  let res: Response;
  try {
    res = await watchSlow(
      fetch(`${API_URL}${path}`, {
        method,
        headers: {
          ...(body !== undefined && { "Content-Type": "application/json" }),
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(key && { "Idempotency-Key": key }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }),
    );
  } catch {
    throw new ApiError(0, "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.ok) return data as T;
  if (res.status === 401) logout();
  // Lỗi phía máy chủ (5xx) là lỗi cần sửa — báo Sentry. Lỗi 4xx là BE từ chối hợp lệ (dữ liệu sai, trùng…), không báo
  if (res.status >= 500) reportError(new ApiError(res.status, `API ${method} ${path.split("?")[0]} → ${res.status}`, data), { message: data.message });
  // Lỗi kiểm tra dữ liệu: message là danh sách
  const message = Array.isArray(data.message) ? data.message.join(" ") : typeof data.message === "string" ? data.message : `Lỗi máy chủ (${res.status}).`;
  throw new ApiError(res.status, message, data);
}
