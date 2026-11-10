// Theo dõi lỗi bằng Sentry (docs/backend.md#theo-dõi-lỗi-sentry). Chỉ bật khi build có VITE_SENTRY_DSN — không có thì không làm gì.
// Tải thư viện Sentry sau khi app chạy (không làm chậm lần mở đầu). Bắt lỗi chưa xử lý trên trang + lỗi máy chủ 5xx khi gọi API.
// Không gửi dữ liệu khách: tắt thông tin cá nhân, chỉ giữ dấu vết gọi API / chuyển trang, bỏ nội dung request
const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

type Sentry = typeof import("@sentry/react");
let sentry: Sentry | null = null;
// Lỗi xảy ra trong lúc thư viện Sentry đang tải — gửi ngay khi tải xong
const early: [unknown, Record<string, unknown> | undefined][] = [];

export function initMonitoring() {
  if (!DSN) return;
  void import("@sentry/react").then((S) => {
    S.init({
      dsn: DSN,
      environment: import.meta.env.MODE,
      release: import.meta.env.VITE_RELEASE || undefined,
      sendDefaultPii: false,
      tracesSampleRate: 0,
      beforeBreadcrumb: (b) => (b.category === "fetch" || b.category === "xhr" || b.category === "navigation" ? b : null),
      beforeSend: (event) => {
        if (event.request) delete event.request.data;
        return event;
      },
    });
    sentry = S;
    for (const [e, extra] of early.splice(0)) S.captureException(e, extra && { extra });
  });
}

// Báo một lỗi đã bắt được (vd máy chủ trả 5xx) kèm vài thông tin để tra
export function reportError(error: unknown, extra?: Record<string, unknown>) {
  if (!DSN) return;
  if (sentry) sentry.captureException(error, extra && { extra });
  else if (early.length < 20) early.push([error, extra]);
}
