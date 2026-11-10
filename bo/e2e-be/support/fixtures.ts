// Mỗi test: nạp lại dữ liệu mẫu vào DB (file sao lưu BO mẫu, qua pnpm db:import), đăng nhập sẵn bằng token thật của BE.
// api.get / api.post gọi thẳng BE để đối chiếu / đổi dữ liệu ngoài giao diện (như thiết bị khác) với những gì làm trên giao diện.
import { test as base, expect, type Page } from "@playwright/test";
import { execSync } from "node:child_process";
import { API, BE_DIR, PIN, SCHEMA } from "./env";

const SESSION_KEY = "2510-admin-session";

function seed() {
  execSync("node dist/scripts/import-backup.js test/fixtures/bo-backup-sample.json", { cwd: BE_DIR, stdio: "pipe", env: { ...process.env, DB_SCHEMA: SCHEMA } });
}

async function login() {
  const res = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin: PIN, remember: true }) });
  if (!res.ok) throw new Error(`Đăng nhập BE thất bại: ${res.status}`);
  return (await res.json()) as { token: string; name: string; expiresAt: number };
}

export type Api = { get: <T = unknown>(path: string) => Promise<T>; post: <T = unknown>(path: string, body?: unknown) => Promise<T> };

export const test = base.extend<{ api: Api }>({
  api: async ({ page }, provide) => {
    seed();
    const session = await login();
    await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [SESSION_KEY, JSON.stringify(session)]);
    const call = async <T>(method: string, path: string, body?: unknown) => {
      const res = await fetch(`${API}${path}`, {
        method,
        headers: { Authorization: `Bearer ${session.token}`, ...(body !== undefined && { "Content-Type": "application/json" }) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`${method} ${path}: ${res.status}`);
      return (await res.json()) as T;
    };
    await provide({ get: (path) => call("GET", path), post: (path, body) => call("POST", path, body) });
  },
});

export { expect };

export const drawer = (page: Page) => page.locator(".ant-drawer-open").last();
export const modal = (page: Page) => page.locator(".ant-modal-wrap:not([style*='none']) .ant-modal").last();

// Tồn kho một nguyên liệu theo BE
export const stockOf = async (api: Api, id: string) => (await api.get<{ stock: number }>(`/admin/materials/${id}`)).stock;
