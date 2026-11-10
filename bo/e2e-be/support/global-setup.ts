// Chạy một lần trước bộ test: tạo / cập nhật bảng trong schema bo_e2e (tách khỏi dữ liệu thật ở public và bo_test của BE)
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { BE_DIR, SCHEMA } from "./env";

export default function setup() {
  // Trên máy: đọc be/.env. CI: DATABASE_URL có sẵn trong biến môi trường (secret)
  const envFile = resolve(BE_DIR, ".env");
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL (be/.env hoặc biến môi trường) — bộ e2e BE cần DB.");
  const direct = url.replace("-pooler.", ".");
  const withSchema = `${direct}${direct.includes("?") ? "&" : "?"}schema=${SCHEMA}`;
  execSync("npx prisma migrate deploy", { cwd: BE_DIR, stdio: "pipe", env: { ...process.env, DIRECT_URL: withSchema } });
}
