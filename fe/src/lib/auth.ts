import type { User } from "@/stores/auth-store";

export type LoginInput = { email: string; password: string; remember: boolean };
export type RegisterInput = { name: string; email: string; phone?: string; password: string };

export class AuthError extends Error {
  constructor(public code: "INVALID_CREDENTIALS" | "EMAIL_TAKEN" | "UNKNOWN") {
    super(code);
  }
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

async function request<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${apiUrl}${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "include", // BE đặt cookie httpOnly
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 401) throw new AuthError("INVALID_CREDENTIALS");
  if (res.status === 409) throw new AuthError("EMAIL_TAKEN");
  if (!res.ok) throw new AuthError("UNKNOWN");
  return res.status === 204 ? (undefined as T) : res.json();
}

/* ------------------------------------------------------------------ */
/* Chế độ giả lập khi chưa có BE: không lưu mật khẩu, chỉ để test UI.  */
/* ------------------------------------------------------------------ */
const MOCK_KEY = "scandleted-mock-accounts";
const delay = () => new Promise((r) => setTimeout(r, 700));

const readMock = (): Record<string, User> => {
  try {
    return JSON.parse(localStorage.getItem(MOCK_KEY) ?? "{}");
  } catch {
    return {};
  }
};

const nameFromEmail = (email: string) =>
  email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export async function login(input: LoginInput): Promise<User> {
  if (apiUrl) return (await request<{ user: User }>("/auth/login", input)).user;

  await delay();
  const email = input.email.toLowerCase();
  return readMock()[email] ?? { id: `mock-${email}`, email, name: nameFromEmail(email) };
}

export async function register(input: RegisterInput): Promise<User> {
  if (apiUrl) return (await request<{ user: User }>("/auth/register", input)).user;

  await delay();
  const accounts = readMock();
  const email = input.email.toLowerCase();
  if (accounts[email]) throw new AuthError("EMAIL_TAKEN");
  const user: User = { id: `mock-${email}`, email, name: input.name, phone: input.phone };
  localStorage.setItem(MOCK_KEY, JSON.stringify({ ...accounts, [email]: user }));
  return user;
}

export async function logout(): Promise<void> {
  if (apiUrl) await request<void>("/auth/logout", {});
}

/** Chỉ cho phép chuyển hướng nội bộ sau khi đăng nhập (chặn open redirect) */
export const safeRedirect = (value: string | null) =>
  value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
