// PIN đăng nhập BO: đúng 6 chữ số, không quá dễ đoán
export const PIN_LENGTH = 6;

const COMMON = new Set(['123123', '112233', '121212', '696969', '159753', '147258', '258369', '102030', '010203', '111222', '520520', '131313']);

// Lý do PIN không dùng được, hoặc null nếu dùng được
export function weakPin(pin: string): string | null {
  if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)) return `PIN phải đúng ${PIN_LENGTH} chữ số.`;
  if (/^(\d)\1+$/.test(pin)) return 'PIN không được là các số giống nhau (vd 000000).';
  const d = pin.split('').map(Number);
  const step = d[1] - d[0];
  if ((step === 1 || step === -1) && d.every((n, i) => i === 0 || n - d[i - 1] === step)) return 'PIN không được là dãy số liên tiếp (vd 123456, 654321).';
  if (COMMON.has(pin)) return 'PIN quá phổ biến, chọn PIN khác.';
  return null;
}

// Thời gian khóa theo số lần đã bị khóa liên tiếp: 15 phút → 1 giờ → 6 giờ → 24 giờ (giữ 24 giờ từ đó)
const LOCKS_MS = [15 * 60_000, 60 * 60_000, 6 * 60 * 60_000, 24 * 60 * 60_000];
export const lockDuration = (level: number) => LOCKS_MS[Math.min(level, LOCKS_MS.length - 1)];
export const MAX_TRIES = 5;
