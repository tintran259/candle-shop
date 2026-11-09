# Đăng nhập

**Đường dẫn:** `/login`, quay lại trang đang mở bằng `?next=<đường dẫn>`

**Mục đích:** chặn người lạ mở BO. Shop chỉ có một người dùng nên không có phân quyền, không có trang quản lý tài khoản.

## Cách hoạt động

- Chưa đăng nhập hoặc hết phiên mà mở bất kỳ trang nào thì chuyển sang `/login`, đăng nhập xong quay lại đúng trang đó. `next` chỉ nhận đường dẫn trong BO.
- Đã đăng nhập mà mở `/login` thì vào thẳng Dashboard.
- **Ghi nhớ đăng nhập** (mặc định bật): giữ 30 ngày trên máy này. Tắt: hết khi đóng trình duyệt, tối đa 12 giờ.
- **Sai 5 lần liên tiếp:** khóa 30 giây.
- Email không phân biệt hoa thường, tự bỏ khoảng trắng thừa.
- **Đăng xuất:** nút ở góc dưới sidebar. Đăng xuất ở một tab thì các tab khác cũng thoát.

## Tài khoản (màn BO hiện tại, bỏ ở giai đoạn 4)

Mặc định khi chạy trên máy: `admin@2510.vn` / `2510candle`. **Đổi trước khi đưa BO lên mạng**, trong `bo/.env.local`:

```
VITE_ADMIN_EMAIL=email-cua-ban@...
VITE_ADMIN_PASSWORD_SHA256=<sha256 của mật khẩu>
```

Tạo mã sha256: `node -e "console.log(require('crypto').createHash('sha256').update('mat-khau-moi').digest('hex'))"`

## Giới hạn hiện tại

BO chưa gọi BE: mật khẩu được so ngay trên trình duyệt, mã sha256 nằm trong code đã build. Người rành kỹ thuật có thể vượt qua bằng công cụ trình duyệt. Đây chỉ là cổng chặn người lạ, chưa phải bảo mật thật.

## Đăng nhập bằng PIN (BE đã có)

BE đăng nhập bằng **PIN 6 số**, không dùng email / mật khẩu. Chi tiết endpoint ở [api.md](../api.md#đăng-nhập), cài đặt ở [backend.md](../backend.md#đăng-nhập).

- **Đặt PIN:** `cd be && pnpm auth:pin <6 số>` rồi dán dòng `ADMIN_PIN_HASH=...` in ra vào `be/.env`. PIN chỉ lưu dạng băm (scrypt). Lệnh từ chối PIN dễ đoán (111111, 123456, 112233…).
- `POST /api/auth/login { pin, remember? }` → `{ token, name, expiresAt }`. Ghi nhớ: 30 ngày, không: 12 giờ.
- `GET /api/auth/me` → phiên hiện tại. Mọi API khác gửi `Authorization: Bearer <token>`, thiếu / sai / hết hạn trả 401.
- **Sai PIN:** 401 kèm `remaining` (số lần còn thử). Sai 5 lần liên tiếp thì khóa chung toàn hệ thống (không theo IP), 429 kèm `retryIn` (giây); khóa tăng dần 15 phút → 1 giờ → 6 giờ → 24 giờ, đúng PIN thì đếm lại.
- Đăng xuất: BO xóa token đã lưu (token không lưu trên máy chủ nên không cần API đăng xuất).

**Việc ở giai đoạn 4 (BO gọi API):** đổi màn này sang ô nhập PIN 6 số (thay email / mật khẩu), gọi `/api/auth/login`, lưu token (ghi nhớ: `localStorage`, không: `sessionStorage`), gặp 401 thì về `/login`; hiện số lần còn thử và đếm ngược `retryIn` khi bị khóa. Bỏ `VITE_ADMIN_EMAIL`, `VITE_ADMIN_PASSWORD_SHA256` và khóa 30 giây phía trình duyệt.

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md).

**Đã có test:**

- `login`: chặn khi chưa đăng nhập và nhớ trang đang mở, bỏ trống, sai mật khẩu, khóa sau 5 lần sai, ghi nhớ và không ghi nhớ, đăng xuất, phiên hết hạn, chặn chuyển hướng ra ngoài, Caps Lock, điện thoại.
- `login-extra`: đếm ngược khi bị khóa, hết 30 giây tự mở lại; đăng xuất ở tab khác thì tab đang mở cũng thoát.
