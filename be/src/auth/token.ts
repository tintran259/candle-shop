// Token đăng nhập dạng JWT HS256 (ký bằng JWT_SECRET), dùng crypto có sẵn của Node
import { createHmac, timingSafeEqual } from 'node:crypto';

export type TokenPayload = { sub: string; name: string; exp: number };

const b64 = (s: string | Buffer) => Buffer.from(s).toString('base64url');
const sign = (data: string, secret: string) => createHmac('sha256', secret).update(data).digest('base64url');

export function signToken(payload: TokenPayload, secret: string) {
  const head = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64(JSON.stringify(payload));
  return `${head}.${body}.${sign(`${head}.${body}`, secret)}`;
}

// Trả payload nếu chữ ký đúng và chưa hết hạn (exp tính bằng ms), không thì null
export function verifyToken(token: string, secret: string, now = Date.now()): TokenPayload | null {
  const [head, body, sig] = token.split('.');
  if (!head || !body || !sig) return null;
  const expected = Buffer.from(sign(`${head}.${body}`, secret));
  const actual = Buffer.from(sig);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const header = JSON.parse(Buffer.from(head, 'base64url').toString()) as { alg?: string };
    if (header.alg !== 'HS256') return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as TokenPayload;
    return typeof payload.exp === 'number' && payload.exp > now ? payload : null;
  } catch {
    return null;
  }
}
