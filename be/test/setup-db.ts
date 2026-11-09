// Chạy một lần trước test e2e: tạo bảng trong schema bo_test trên DB (Neon), tách khỏi dữ liệu thật ở schema public
import 'dotenv/config';
import { execSync } from 'node:child_process';

export const TEST_SCHEMA = 'bo_test';

export default function setup() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Thiếu DATABASE_URL trong be/.env — test e2e cần DB.');
  const direct = url.replace('-pooler.', '.');
  const withSchema = `${direct}${direct.includes('?') ? '&' : '?'}schema=${TEST_SCHEMA}`;
  execSync('npx prisma migrate deploy', { stdio: 'pipe', env: { ...process.env, DIRECT_URL: withSchema } });
}
