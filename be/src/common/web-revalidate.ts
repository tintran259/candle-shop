// Báo web (fe) làm mới ngay phần giao diện web (thanh thông báo, logo, hero — GET /api/shop/home, tag `site-theme` ở fe/src/lib/home.ts)
// khi bản đã đăng đổi: đăng / gỡ / xóa giao diện, xóa toàn bộ dữ liệu. POST {FRONTEND_URL}/api/revalidate?tag=site-theme kèm REVALIDATE_SECRET.
// Gộp các lần sát nhau (500 ms). Lỗi / web chưa chạy thì bỏ qua — web vẫn tự làm mới sau 60 giây (dữ liệu khác, vd sản phẩm, chỉ theo 60 giây đó)
import { Injectable, Logger } from '@nestjs/common';
import { parseOrigins } from './origins.js';

export const SITE_THEME_TAG = 'site-theme';
const DELAY_MS = 500;

@Injectable()
export class WebRevalidate {
  private readonly log = new Logger('WebRevalidate');
  private timer: NodeJS.Timeout | null = null;

  siteTheme() {
    // Mọi địa chỉ web trong FRONTEND_URL (vd web thật + localhost) — địa chỉ không gọi được thì bỏ qua
    const webs = parseOrigins(process.env.FRONTEND_URL);
    if (!webs.length || process.env.NODE_ENV === 'test') return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      for (const web of webs) void this.send(web);
    }, DELAY_MS);
  }

  private async send(web: string) {
    try {
      const res = await fetch(`${web}/api/revalidate?tag=${SITE_THEME_TAG}`, {
        method: 'POST',
        headers: { 'x-revalidate-secret': process.env.REVALIDATE_SECRET ?? '' },
        signal: AbortSignal.timeout(10_000),
      });
      // 401: REVALIDATE_SECRET ở BE và web (Vercel) khác nhau, hoặc web chưa deploy lại sau khi thêm biến
      if (!res.ok) this.log.warn(`${web} trả ${res.status} khi làm mới giao diện${res.status === 401 ? ' — kiểm tra REVALIDATE_SECRET ở hai bên' : ''}`);
    } catch {
      // Web chưa chạy / đang ngủ: bỏ qua
    }
  }
}
