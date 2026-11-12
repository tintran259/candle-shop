// Địa chỉ trong FRONTEND_URL / BO_URL → origin trình duyệt gửi (lỗi CORS thật: ghi "https://2510candle.vercel.app/" có "/" cuối)
import { parseOrigins } from './origins.js';

describe('parseOrigins', () => {
  it('bỏ "/" cuối, đường dẫn, khoảng trắng; nhiều địa chỉ cách dấu phẩy; bỏ giá trị sai / rỗng', () => {
    expect(parseOrigins('https://2510candle.vercel.app/')).toEqual(['https://2510candle.vercel.app']);
    expect(parseOrigins(' https://2510candle.vercel.app/products , http://localhost:3000 ,, khong-phai-dia-chi')).toEqual(['https://2510candle.vercel.app', 'http://localhost:3000']);
    expect(parseOrigins(undefined)).toEqual([]);
  });
});
