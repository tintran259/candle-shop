// Mật khẩu (scrypt) và token đăng nhập (JWT HS256)
import { hashPassword, verifyPassword } from './password.js';
import { signToken, verifyToken } from './token.js';

const SECRET = 'x'.repeat(40);

describe('mật khẩu', () => {
  it('băm rồi kiểm tra đúng / sai; mỗi lần băm khác nhau (có salt)', async () => {
    const a = await hashPassword('2510candle');
    const b = await hashPassword('2510candle');
    expect(a).toMatch(/^scrypt\$[\w-]+\$[\w-]+$/);
    expect(a).not.toBe(b);
    expect(await verifyPassword('2510candle', a)).toBe(true);
    expect(await verifyPassword('2510Candle', a)).toBe(false);
    expect(await verifyPassword('2510candle', 'khong-hop-le')).toBe(false);
  });
});

describe('token', () => {
  const payload = { sub: 'admin@2510.vn', name: 'Admin 2510', exp: Date.now() + 60_000 };

  it('ký và đọc lại đúng nội dung', () => {
    expect(verifyToken(signToken(payload, SECRET), SECRET)).toEqual(payload);
  });

  it('sai khóa ký, bị sửa nội dung, hết hạn, sai định dạng thì từ chối', () => {
    const token = signToken(payload, SECRET);
    expect(verifyToken(token, 'y'.repeat(40))).toBeNull();
    const [h, , s] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ ...payload, sub: 'ke-gian@x.vn' })).toString('base64url');
    expect(verifyToken(`${h}.${forged}.${s}`, SECRET)).toBeNull();
    expect(verifyToken(signToken({ ...payload, exp: Date.now() - 1 }, SECRET), SECRET)).toBeNull();
    expect(verifyToken('abc', SECRET)).toBeNull();
  });
});

describe('PIN', () => {
  it('đúng 6 chữ số, không quá dễ đoán', async () => {
    const { weakPin } = await import('./pin.js');
    expect(weakPin('739214')).toBeNull();
    expect(weakPin('25101')).toMatch('6 chữ số');
    expect(weakPin('25a101')).toMatch('6 chữ số');
    expect(weakPin('000000')).toMatch('giống nhau');
    expect(weakPin('123456')).toMatch('liên tiếp');
    expect(weakPin('987654')).toMatch('liên tiếp');
    expect(weakPin('112233')).toMatch('phổ biến');
  });

  it('khóa lâu dần: 15 phút → 1 giờ → 6 giờ → 24 giờ', async () => {
    const { lockDuration } = await import('./pin.js');
    expect([0, 1, 2, 3, 9].map((l) => lockDuration(l) / 60_000)).toEqual([15, 60, 360, 1440, 1440]);
  });
});
