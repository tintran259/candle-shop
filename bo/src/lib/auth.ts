import { useSyncExternalStore } from "react";
import { API_URL } from "@/lib/api-url";

// Đăng nhập BO bằng PIN 6 số qua BE (POST /api/auth/login, docs/api.md#đăng-nhập). Một người dùng, không phân quyền.
// BE trả token: gửi kèm mọi API (Authorization: Bearer). Ghi nhớ thì giữ 30 ngày trong localStorage, không thì sessionStorage (12 giờ).
// Khóa khi nhập sai nhiều lần do BE quyết định (chung toàn hệ thống), BO chỉ hiện số lần còn lại và đếm ngược.

export type Session = { name: string; expiresAt: number; token?: string };

const KEY = "2510-admin-session";

const listeners = new Set<() => void>();
let cached: Session | null | undefined;

function read(): Session | null {
  try {
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as Session) : null;
    return s && s.expiresAt > Date.now() ? s : null;
  } catch {
    return null;
  }
}

// next: phiên vừa tạo (dùng luôn, kể cả khi trình duyệt chặn bộ nhớ); bỏ trống thì đọc lại từ bộ nhớ
const emit = (next?: Session | null) => {
  cached = next === undefined ? read() : next;
  listeners.forEach((l) => l());
};

// Tab khác đăng xuất / đăng nhập thì tab này cập nhật theo
if (typeof window !== "undefined") window.addEventListener("storage", (e) => e.key === KEY && emit());

export const getSession = () => (cached === undefined ? (cached = read()) : cached && cached.expiresAt > Date.now() ? cached : (cached = null));

export const PIN_LENGTH = 6;

export type LoginResult =
  | { ok: true }
  // remaining: số lần còn thử trước khi bị khóa
  | { ok: false; reason: "invalid"; remaining?: number }
  // retryIn: số giây còn khóa
  | { ok: false; reason: "locked"; retryIn: number }
  // offline: không gọi được máy chủ; server: máy chủ lỗi / chưa cấu hình PIN
  | { ok: false; reason: "offline" | "server"; message?: string };

export async function login(pin: string, remember: boolean): Promise<LoginResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin, remember }) });
  } catch {
    return { ok: false, reason: "offline" };
  }
  const body = (await res.json().catch(() => ({}))) as { token?: string; name?: string; expiresAt?: number; remaining?: number; retryIn?: number; message?: string };
  if (res.status === 401 || res.status === 400) return { ok: false, reason: "invalid", remaining: body.remaining };
  if (res.status === 429) return { ok: false, reason: "locked", retryIn: Math.max(1, body.retryIn ?? 60) };
  if (!res.ok || !body.token) return { ok: false, reason: "server", message: typeof body.message === "string" ? body.message : undefined };
  const session: Session = { name: body.name ?? "Admin", expiresAt: body.expiresAt ?? Date.now() + 12 * 3_600_000, token: body.token };
  try {
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session));
    (remember ? sessionStorage : localStorage).removeItem(KEY);
  } catch {
    // Trình duyệt chặn bộ nhớ: vẫn vào được trong lần mở này
  }
  emit(session);
  return { ok: true };
}

// Token không lưu trên máy chủ nên đăng xuất chỉ cần xóa phiên ở trình duyệt
export function logout() {
  try {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    // bỏ qua
  }
  emit(null);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useSession = () => useSyncExternalStore(subscribe, getSession);

// Đường dẫn quay lại sau khi đăng nhập: chỉ nhận đường dẫn trong BO (tránh chuyển hướng ra trang ngoài)
export const safeNext = (next: string | null) => (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : "/");
