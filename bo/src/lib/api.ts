// Gọi API của BE kèm token đăng nhập (docs/api.md). Hết phiên (401) thì đăng xuất để về trang đăng nhập.
// Lỗi trả ApiError với thông báo tiếng Việt của BE (message) và các trường kèm theo (vd shortages, customerId)
import { API_URL } from "@/lib/api-url";
import { getSession, logout } from "@/lib/auth";

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

export async function api<T = unknown>(method: Method, path: string, body?: unknown): Promise<T> {
  const token = getSession()?.token;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: { ...(body !== undefined && { "Content-Type": "application/json" }), ...(token && { Authorization: `Bearer ${token}` }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.");
  }
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.ok) return data as T;
  if (res.status === 401) logout();
  // Lỗi kiểm tra dữ liệu: message là danh sách
  const message = Array.isArray(data.message) ? data.message.join(" ") : typeof data.message === "string" ? data.message : `Lỗi máy chủ (${res.status}).`;
  throw new ApiError(res.status, message, data);
}
