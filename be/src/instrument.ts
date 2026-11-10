// Theo dõi lỗi bằng Sentry (docs/backend.md#theo-dõi-lỗi-sentry) — import đầu tiên trong main.ts. Chỉ bật khi có SENTRY_DSN.
// Không gửi dữ liệu khách: tắt thông tin cá nhân, bỏ nội dung request, cookie, header đăng nhập
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN)
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.RENDER ? 'production' : 'development',
    release: process.env.RENDER_GIT_COMMIT || undefined,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    beforeSend(event) {
      if (event.request) {
        delete event.request.data;
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
      }
      return event;
    },
  });
