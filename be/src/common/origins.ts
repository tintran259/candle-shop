// Địa chỉ web / BO trong biến môi trường (FRONTEND_URL, BO_URL — nhiều địa chỉ cách nhau dấu phẩy) → origin chuẩn để so CORS và gửi lệnh làm mới.
// Trình duyệt gửi Origin dạng "https://abc.vercel.app" (không có "/" cuối, không đường dẫn) — nên bỏ "/" cuối, đường dẫn, khoảng trắng; bỏ giá trị sai
export function parseOrigins(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((s) => {
      try {
        return [new URL(s).origin];
      } catch {
        return [];
      }
    });
}
