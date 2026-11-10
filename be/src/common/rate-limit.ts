// Giới hạn số request mỗi IP (cửa sổ 1 phút, trong bộ nhớ) — chặn script dò quét / gọi dồn dập làm sập gói Free.
// Mức đủ rộng cho BO dùng bình thường (mở trang tải ~10 API). Vượt thì 429. Đăng nhập sai PIN có khóa riêng (auth.service.ts)
import type { NextFunction, Request, Response } from 'express';

const WINDOW_MS = 60_000;

export function rateLimit(limit = Number(process.env.RATE_LIMIT_PER_MIN) || 600) {
  const hits = new Map<string, { count: number; start: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    if (hits.size > 5000) for (const [ip, h] of hits) if (now - h.start >= WINDOW_MS) hits.delete(ip);
    const ip = req.ip ?? 'unknown';
    const h = hits.get(ip);
    if (!h || now - h.start >= WINDOW_MS) {
      hits.set(ip, { count: 1, start: now });
      return next();
    }
    h.count += 1;
    if (h.count > limit) {
      res.setHeader('Retry-After', String(Math.ceil((h.start + WINDOW_MS - now) / 1000)));
      return res.status(429).json({ statusCode: 429, message: 'Gọi máy chủ quá nhiều, thử lại sau ít phút.' });
    }
    next();
  };
}
