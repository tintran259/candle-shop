// Giả BE đăng nhập PIN (POST /api/auth/login, docs/api.md#đăng-nhập) để test màn đăng nhập không cần chạy BE.
// PIN đúng 739214; sai 5 lần liên tiếp thì khóa (429, retryIn giây)
import type { Page } from "@playwright/test";

export const PIN = "739214";

export async function mockAuth(page: Page, opts: { retryIn?: number } = {}) {
  let failed = 0;
  let lockedUntil = 0;
  const calls: { pin: string; remember: boolean }[] = [];
  await page.route("**/api/auth/login", async (route) => {
    const body = route.request().postDataJSON() as { pin: string; remember: boolean };
    calls.push(body);
    const json = (status: number, data: object) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
    if (Date.now() < lockedUntil) return json(429, { message: "Nhập sai PIN nhiều lần, tạm khóa đăng nhập.", retryIn: Math.ceil((lockedUntil - Date.now()) / 1000) });
    if (body.pin !== PIN) {
      failed++;
      if (failed >= 5) {
        failed = 0;
        const retryIn = opts.retryIn ?? 900;
        lockedUntil = Date.now() + retryIn * 1000;
        return json(429, { message: "Nhập sai PIN nhiều lần, tạm khóa đăng nhập.", retryIn });
      }
      return json(401, { message: "PIN không đúng.", remaining: 5 - failed });
    }
    failed = 0;
    const ms = body.remember ? 30 * 864e5 : 12 * 3_600_000;
    return json(200, { token: "token-test", name: "Admin 2510", expiresAt: Date.now() + ms });
  });
  return { calls };
}
