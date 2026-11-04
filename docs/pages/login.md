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

## Tài khoản

Mặc định khi chạy trên máy: `admin@2510.vn` / `2510candle`. **Đổi trước khi đưa BO lên mạng**, trong `bo/.env.local`:

```
VITE_ADMIN_EMAIL=email-cua-ban@...
VITE_ADMIN_PASSWORD_SHA256=<sha256 của mật khẩu>
```

Tạo mã sha256: `node -e "console.log(require('crypto').createHash('sha256').update('mat-khau-moi').digest('hex'))"`

## Giới hạn khi chưa có BE

Mật khẩu được so ngay trên trình duyệt, mã sha256 nằm trong code đã build. Người rành kỹ thuật có thể vượt qua bằng công cụ trình duyệt. Đây chỉ là cổng chặn người lạ, chưa phải bảo mật thật.

## Việc của BE

- `POST /api/auth/login { email, password, remember }`: kiểm tra mật khẩu đã băm (bcrypt/argon2), trả cookie phiên `httpOnly`, `Secure`, `SameSite=Lax`; giới hạn số lần sai theo IP.
- `POST /api/auth/logout`, `GET /api/auth/me`.
- Mọi API của BO trả 401 khi chưa đăng nhập. BO chỉ cần thay hàm `checkCredentials` trong `bo/src/lib/auth.ts` và đọc phiên từ `/api/auth/me`.

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md).

**Đã có test:**

- `login`: chặn khi chưa đăng nhập và nhớ trang đang mở, bỏ trống, sai mật khẩu, khóa sau 5 lần sai, ghi nhớ và không ghi nhớ, đăng xuất, phiên hết hạn, chặn chuyển hướng ra ngoài, Caps Lock, điện thoại.
- `login-extra`: đếm ngược khi bị khóa, hết 30 giây tự mở lại; đăng xuất ở tab khác thì tab đang mở cũng thoát.
