# Đăng nhập

**Đường dẫn:** `/login`, quay lại trang đang mở bằng `?next=<đường dẫn>`

**Mục đích:** chặn người lạ mở BO. Shop chỉ có một người dùng nên không có phân quyền, không có trang quản lý tài khoản. Đăng nhập bằng **PIN 6 số**, BE kiểm tra (endpoint ở [api.md](../api.md#đăng-nhập), cài đặt ở [backend.md](../backend.md#đăng-nhập)).

## Màn hình

| Phần | Nội dung |
|---|---|
| Khối thương hiệu | Ảnh nến 2510, logo, "BACK OFFICE" (điện thoại: dải ảnh thấp phía trên) |
| Tiêu đề | Biểu tượng khóa, **Nhập mã PIN**, "Mã 6 số để vào trang quản lý 2510." |
| **Ô PIN** (thành phần duy nhất cần thao tác) | 6 ô, focus sẵn khi mở trang. Ô đã nhập hiện chấm (nền kem, viền nâu). Ô kế tiếp có viền nhấn và vạch nháy |
| Dòng trạng thái | Ngay dưới ô PIN, giữ sẵn chỗ để bố cục không nhảy: "Đang kiểm tra…" lúc gửi, hoặc lỗi (đỏ / cam) gắn với ô PIN qua `aria-describedby`, đọc cho trình đọc màn hình |
| Ghi nhớ | "Ghi nhớ trên máy này 30 ngày" (mặc định bật). Bỏ chọn khi dùng máy chung |

Không có nút Đăng nhập, bàn phím số trên màn hay nút hiện PIN: đủ 6 số là tự gửi, Enter cũng gửi. Điện thoại: thẻ PIN nằm sát dưới ảnh để bàn phím số của hệ thống không che.

## Cách hoạt động

- Chưa đăng nhập hoặc hết phiên mà mở bất kỳ trang nào thì chuyển sang `/login`, đăng nhập xong quay lại đúng trang đó. `next` chỉ nhận đường dẫn trong BO (chặn `//trang-ngoai`).
- Đã đăng nhập mà mở `/login` thì vào thẳng Dashboard.
- **Nhập PIN:** gõ bàn phím, **dán** (tự bỏ ký tự không phải số, vd "739 214") hoặc để trình quản lý mật khẩu điền — không chặn dán (WCAG 2.2 Accessible Authentication). Đủ 6 số thì tự đăng nhập; Enter cũng gửi.
- **Điện thoại:** ô PIN bật bàn phím số của hệ thống.
- **PIN sai:** ô PIN viền đỏ, rung nhẹ (tắt khi máy bật giảm chuyển động), xóa các số đã nhập và focus lại để nhập tiếp. Thông báo "PIN không đúng. Còn 4 lần thử."; còn 2 lần trở xuống thì đổi sang màu cam "… trước khi bị tạm khóa."
- **Sai 5 lần liên tiếp:** BE khóa đăng nhập **chung toàn hệ thống**, tăng dần 15 phút → 1 giờ → 6 giờ → 24 giờ. Màn hiện "Nhập sai PIN nhiều lần nên đăng nhập đang tạm khóa. Thử lại sau 14:58." đếm ngược từng giây (trên 1 giờ ghi "1 giờ 05 phút"), khóa ô PIN. Hết giờ tự mở lại. Đang khóa thì nhập đúng PIN cũng bị từ chối; tải lại trang không mở khóa.
- **Không gọi được máy chủ:** "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại." Máy chủ chưa đặt PIN / lỗi: hiện thông báo của BE.
- **Ghi nhớ** (mặc định bật): phiên 30 ngày trong `localStorage`. Tắt: `sessionStorage`, hết khi đóng trình duyệt, tối đa 12 giờ.
- Phiên gồm tên, hạn và **token**; mọi API gửi kèm `Authorization: Bearer <token>`. API trả 401 (hết hạn, đổi `JWT_SECRET`) thì tự đăng xuất về `/login`.
- **Đăng xuất:** nút ở góc dưới sidebar, xóa phiên trên trình duyệt (token không lưu trên máy chủ). Đăng xuất ở một tab thì các tab khác cũng thoát.

## Cài đặt

- **Đặt / đổi PIN:** `cd be && pnpm auth:pin <6 số>` rồi dán dòng `ADMIN_PIN_HASH=...` in ra vào `be/.env`, khởi động lại BE. PIN chỉ lưu dạng băm (scrypt). Lệnh từ chối PIN dễ đoán (111111, 123456, 112233…).
- **Địa chỉ BE:** `VITE_API_URL` trong `bo/.env.local`, mặc định `http://localhost:4000/api`. BE phải cho phép địa chỉ của BO trong `BO_URL` (CORS).
- **Mở khóa ngay** khi chính mình bị khóa: xóa dòng `admin` trong bảng `LoginGuard` (`pnpm db:studio` ở `be/`).

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md). Test giả lập BE đăng nhập (`e2e/support/mock-auth.ts`, PIN đúng `739214`), không cần chạy BE.

**Đã có test (`login`):**

- Chặn khi chưa đăng nhập và nhớ trang đang mở; chỉ có ô PIN, focus sẵn; hiện chấm, bỏ chữ, xóa lùi.
- PIN sai: báo số lần còn lại ngay dưới ô (gắn `aria-describedby`), xóa ô, giữ focus. Dán PIN có khoảng trắng. Đủ 6 số tự đăng nhập, quay lại đúng trang, gửi đúng `remember`.
- Không ghi nhớ → `sessionStorage` kèm token; ghi nhớ → `localStorage` 30 ngày; đã đăng nhập mở `/login` về Dashboard; đăng xuất xóa phiên, không vào lại được; phiên hết hạn; chặn chuyển hướng ra ngoài.
- Sai 5 lần: đếm ngược theo `retryIn`, khóa ô PIN, hết giờ tự mở.
- Mất kết nối máy chủ; điện thoại không tràn ngang, 6 ô vừa màn, bật bàn phím số.
- Đăng xuất ở tab khác thì tab đang mở cũng thoát.
