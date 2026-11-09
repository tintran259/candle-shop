# Backend (be/)

NestJS + Prisma + PostgreSQL trên [Neon](https://neon.com) (gói miễn phí, region Singapore). Phục vụ Back Office: một người dùng, đăng nhập bằng PIN 6 số, không phân quyền.

> **Trạng thái:** giai đoạn 1–2 xong (schema, nhập dữ liệu, đăng nhập bằng PIN). API từng trang (giai đoạn 3) và BO gọi API (giai đoạn 4) đang làm; BO vẫn lưu trên trình duyệt.

## Cài đặt lần đầu

1. `cd be && pnpm install`
2. Tạo `be/.env` theo `be/.env.example`. **Không commit `.env`, không dán chuỗi kết nối hay mật khẩu vào `.env.example`.**

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` | Connection string của Neon (bản `-pooler`). Migrate tự dùng kết nối trực tiếp (bỏ `-pooler`), hoặc đặt `DIRECT_URL` |
| `JWT_SECRET` | Chuỗi ngẫu nhiên ≥ 32 ký tự để ký token đăng nhập. Tạo: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `ADMIN_PIN_HASH` | Mã băm PIN đăng nhập BO. Tạo: `pnpm auth:pin <6 số>` rồi dán dòng in ra vào `.env`. Đổi PIN: chạy lại lệnh, thay dòng cũ, khởi động lại BE |
| `BO_URL` | Địa chỉ BO được gọi API (CORS), nhiều địa chỉ cách nhau dấu phẩy. Mặc định `http://localhost:5173,http://localhost:3011` |
| `PORT` | Cổng chạy BE, mặc định 4000 |

3. Tạo bảng: `pnpm db:deploy` (máy mới / server) hoặc `pnpm db:migrate` (khi sửa schema lúc dev).
4. Chạy: `pnpm start:dev`. Tài liệu API (Swagger): `http://localhost:4000/api/docs`.

## Nhập dữ liệu từ BO

BO đang lưu dữ liệu trên trình duyệt. Chuyển sang DB:

1. BO › Cài đặt › Sao lưu dữ liệu › **Sao lưu (tải file)**.
2. `pnpm db:import <đường-dẫn-file.json>`

Lệnh **xóa sạch dữ liệu BO trong DB** rồi ghi lại toàn bộ trong một giao dịch (lỗi giữa chừng thì không đổi gì). Mục tham chiếu tới thứ đã xóa (vd công thức trỏ tới nguyên liệu không còn) được bỏ qua và in ra "Lưu ý".

## Bảng

| Nhóm | Bảng |
|---|---|
| Cài đặt | `ShopSettings` (1 dòng `shop`, gồm người gửi), `ShippingOption`, `Carrier` |
| Sản phẩm | `Category`, `Product`, `ProductRecipeLine` |
| Kho | `Material`, `MaterialRecipeLine` (xưởng tự sản xuất), `StockMovement` |
| Khách, mã giảm giá | `Customer`, `Discount`, `DiscountCustomer` (mã riêng) |
| Đơn hàng | `Order` (gồm lượt giao hiện tại, hủy, hoàn tiền), `OrderItem`, `Payment`, `OrderEvent` (lịch sử), `Complaint` |
| Khác | `CancelledProduct`, `CraftConfig` (JSON, `saved` / `draft`), `OrderDraft`, `NotificationRead`, `LoginGuard` (khóa đăng nhập) |

id giữ đúng id của BO. Tiền là VNĐ, số nguyên. Ảnh tạm lưu dạng chuỗi như BO (sau chuyển sang kho file, chỉ lưu URL).

## Đăng nhập

| API | Mô tả |
|---|---|
| `POST /api/auth/login` | `{ pin, remember? }` → `{ token, name, expiresAt }`. Ghi nhớ thiết bị 30 ngày, không thì 12 giờ. PIN sai → 401 kèm `remaining` (số lần còn thử) |
| `GET /api/auth/me` | Phiên hiện tại |
| `GET /api/health` | Không cần đăng nhập. `{ ok: true }` khi kết nối được DB (Render health check) |

Mọi API khác cần `Authorization: Bearer <token>`, thiếu hoặc sai thì 401. Chưa đặt `ADMIN_PIN_HASH` / `JWT_SECRET` thì đăng nhập báo 503.

**PIN:** đúng 6 chữ số; lệnh `auth:pin` từ chối PIN dễ đoán (6 số giống nhau, dãy tăng / giảm như 123456, PIN phổ biến như 112233).

**Chặn đoán thử PIN:** sai 5 lần liên tiếp thì **khóa chung toàn hệ thống** (không theo IP, đổi máy hay đổi mạng vẫn bị khóa) — trả 429 kèm `retryIn` (giây). Thời gian khóa tăng dần mỗi lần bị khóa: 15 phút → 1 giờ → 6 giờ → 24 giờ. Đăng nhập đúng thì đếm lại từ đầu. Trạng thái lưu ở bảng `LoginGuard` nên khởi động lại BE không xóa khóa; muốn mở khóa ngay thì xóa dòng `admin` trong bảng này (Prisma Studio: `pnpm db:studio`).

## Kiểm thử

- `pnpm test`: chuyển file sao lưu BO (dữ liệu mẫu thật ở `test/fixtures/bo-backup-sample.json`), mã băm, token, PIN dễ đoán, thời gian khóa.
- `pnpm test:e2e`: PIN đúng / sai / sai định dạng, khóa 15 phút rồi 1 giờ, đăng nhập đúng thì đếm lại, chặn khi không có token, health. DB thay bằng bản giả, không chạm Neon.
