import { useSyncExternalStore } from "react";

// Đăng nhập một tài khoản quản trị (shop chỉ có 1 người dùng, không phân quyền).
// ⚠️ Chưa có BE: so mật khẩu ngay trên trình duyệt nên chỉ là cổng chặn người lạ mở BO, không phải bảo mật thật.
// Khi có BE: thay checkCredentials bằng POST /api/auth/login (cookie httpOnly), giữ nguyên trang và cách chặn route.

export type Session = { email: string; name: string; expiresAt: number };

const KEY = "2510-admin-session";
const DAY = 24 * 60 * 60 * 1000;
// Ghi nhớ: 30 ngày. Không ghi nhớ: hết khi đóng trình duyệt (sessionStorage), tối đa 12 giờ
const REMEMBER_MS = 30 * DAY;
const SESSION_MS = 12 * 60 * 60 * 1000;

// Đổi tài khoản trong bo/.env.local: VITE_ADMIN_EMAIL và VITE_ADMIN_PASSWORD_SHA256 (sha256 hex của mật khẩu)
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL ?? "admin@2510.vn").toLowerCase();
// Mặc định là sha256("2510candle")
const ADMIN_HASH = import.meta.env.VITE_ADMIN_PASSWORD_SHA256 ?? "bcb8ef8840e45c2e87a10de808af2b32a35b51553b3d3ee7782a727e0e62cf0d";
const ADMIN_NAME = "Admin 2510";

// Sai liên tiếp 5 lần thì khóa 30 giây
const MAX_TRIES = 5;
const LOCK_MS = 30_000;
let failed = 0;
let lockedUntil = 0;

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

async function sha256(text: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function checkCredentials(email: string, password: string) {
  return email.trim().toLowerCase() === ADMIN_EMAIL && (await sha256(password)) === ADMIN_HASH;
}

export type LoginResult = { ok: true } | { ok: false; reason: "invalid" | "locked"; retryIn?: number };

export async function login(email: string, password: string, remember: boolean): Promise<LoginResult> {
  if (Date.now() < lockedUntil) return { ok: false, reason: "locked", retryIn: Math.ceil((lockedUntil - Date.now()) / 1000) };
  if (!(await checkCredentials(email, password))) {
    failed += 1;
    if (failed >= MAX_TRIES) {
      failed = 0;
      lockedUntil = Date.now() + LOCK_MS;
      return { ok: false, reason: "locked", retryIn: LOCK_MS / 1000 };
    }
    return { ok: false, reason: "invalid" };
  }
  failed = 0;
  const session: Session = { email: ADMIN_EMAIL, name: ADMIN_NAME, expiresAt: Date.now() + (remember ? REMEMBER_MS : SESSION_MS) };
  try {
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(session));
    (remember ? sessionStorage : localStorage).removeItem(KEY);
  } catch {
    // Trình duyệt chặn bộ nhớ: vẫn vào được trong lần mở này
  }
  emit(session);
  return { ok: true };
}

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
