// Chạy một lần trước bộ test: tạo / cập nhật bảng trong schema bo_e2e (tách khỏi dữ liệu thật ở public và bo_test của BE)
import { execSync } from "node:child_process";
import { resolve } from "node:path";
import { BE_DIR, SCHEMA } from "./env";

export default function setup() {
  process.loadEnvFile(resolve(BE_DIR, ".env"));
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL trong be/.env — bộ e2e BE cần DB.");
  const direct = url.replace("-pooler.", ".");
  const withSchema = `${direct}${direct.includes("?") ? "&" : "?"}schema=${SCHEMA}`;
  execSync("npx prisma migrate deploy", { cwd: BE_DIR, stdio: "pipe", env: { ...process.env, DIRECT_URL: withSchema } });
}
