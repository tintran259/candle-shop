# Ứng dụng trên màn hình chính (PWA)

BO và web bán hàng (`fe`) đều thêm được vào màn hình chính điện thoại: có icon riêng, mở toàn màn hình như ứng dụng (không có thanh địa chỉ). Làm ngày 25/11/2026.

## Cách thêm vào điện thoại

| Máy | Cách làm |
|---|---|
| **iPhone** (Safari) | Mở trang → nút Chia sẻ (ô vuông có mũi tên) → **Thêm vào MH chính** → Thêm |
| **Android** (Chrome) | Mở trang → menu ⋮ → **Cài đặt ứng dụng** (hoặc **Thêm vào màn hình chính**). Chrome có thể tự hiện gợi ý cài |
| Máy tính (Chrome / Edge) | Biểu tượng cài đặt ở cuối thanh địa chỉ |

Tên dưới icon: **2510 BO** (Back Office), **2510 Candle** (web). Icon BO nền nâu mocha (màu thanh menu BO), icon web nền tối — hai icon khác màu cho dễ phân biệt.

**BO trên iPhone:** ứng dụng ở màn hình chính có bộ nhớ riêng, tách với Safari — lần đầu mở phải **đăng nhập PIN lại** (bình thường, không phải lỗi).

## Cách làm (kỹ thuật)

| | BO (`bo/`, Vite) | Web (`fe/`, Next 16) |
|---|---|---|
| Manifest | `public/manifest.webmanifest` | `src/app/manifest.ts` (Next tạo `/manifest.webmanifest`) |
| Icon | `public/pwa/` — `icon-192.png`, `icon-512.png`, `maskable-512.png`, `apple-touch-icon.png` (180) | `public/pwa/` (192, 512, maskable) + `src/app/apple-icon.png` (180, Next tự gắn) |
| Thẻ trong `<head>` | `index.html`: `manifest`, `apple-touch-icon`, `theme-color`, `apple-mobile-web-app-*` | `layout.tsx`: `appleWebApp` trong `metadata`, `themeColor` trong `viewport` |
| Màu | `#6b5242` (mocha) | `#282720` |

- **Không có service worker** (không chạy ngoại tuyến): cài lên màn hình chính không cần service worker, và không có bộ nhớ đệm thì mỗi lần mở luôn là bản mới nhất sau khi deploy (BO đã có hàng đợi ghi khi mất mạng, `lib/write-queue.ts`). Cần chạy ngoại tuyến hoặc thông báo đẩy thì mới thêm.
- **Icon maskable:** Android cắt icon thành hình tròn / bo góc — logo nằm trong vùng an toàn (80% giữa), nền phủ kín.
- **Tạo lại icon** khi đổi logo: BO từ `bo/public/logo-2510-mark-light.png` đặt giữa nền mocha (logo rộng 68%, maskable 56%); web từ `fe/src/app/icon.png` (maskable thu còn 80%). Dùng Python + Pillow, ảnh PNG không trong suốt.
- Kiểm tra: Chrome / Edge DevTools › Application › Manifest (không lỗi, có nút cài). Đổi icon thì điện thoại phải gỡ icon cũ rồi thêm lại mới thấy icon mới.
