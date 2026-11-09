// Tạo mã băm PIN đăng nhập BO cho ADMIN_PIN_HASH: pnpm auth:pin <6 số>
import { hashPassword } from '../auth/password.js';
import { weakPin } from '../auth/pin.js';

const pin = process.argv[2] ?? '';
const reason = weakPin(pin);
if (reason) {
  console.error(`${reason}
Cách dùng: pnpm auth:pin <6 chữ số>`);
  process.exit(1);
}
console.log(`ADMIN_PIN_HASH=${await hashPassword(pin)}`);
