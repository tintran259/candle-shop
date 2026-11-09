# Backend (be/)

NestJS + Prisma + PostgreSQL trên [Neon](https://neon.com) (gói miễn phí, region Singapore). Phục vụ Back Office: một người dùng, đăng nhập bằng PIN 6 số, không phân quyền.

> **Trạng thái:** giai đoạn 1–2 xong (schema, nhập dữ liệu, đăng nhập bằng PIN). Giai đoạn 3 (API từng trang): xong nhóm 1 (cài đặt, danh mục, khách, mã giảm giá), nhóm 2 (kho nguyên liệu, phiếu kho, sản xuất, sản phẩm) và nhóm 3 (Thủ công, sản phẩm hủy đơn); còn đơn hàng. BO gọi API (giai đoạn 4) chưa làm; BO vẫn lưu trên trình duyệt.

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
4. Chạy: `pnpm start:dev`. Tài liệu API: [api.md](./api.md); Swagger khi đang chạy: `http://localhost:4000/api/docs`.

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

Đầu vào, đầu ra, mã lỗi của từng endpoint: **[api.md](./api.md)**.

| API | Mô tả |
|---|---|
| `POST /api/auth/login` | `{ pin, remember? }` → `{ token, name, expiresAt }`. Ghi nhớ thiết bị 30 ngày, không thì 12 giờ. PIN sai → 401 kèm `remaining` (số lần còn thử) |
| `GET /api/auth/me` | Phiên hiện tại |
| `GET /api/health` | Không cần đăng nhập. `{ ok: true }` khi kết nối được DB (Render health check) |

Mọi API khác cần `Authorization: Bearer <token>`, thiếu hoặc sai thì 401. Chưa đặt `ADMIN_PIN_HASH` / `JWT_SECRET` thì đăng nhập báo 503.

**PIN:** đúng 6 chữ số; lệnh `auth:pin` từ chối PIN dễ đoán (6 số giống nhau, dãy tăng / giảm như 123456, PIN phổ biến như 112233).

**Chặn đoán thử PIN:** sai 5 lần liên tiếp thì **khóa chung toàn hệ thống** (không theo IP, đổi máy hay đổi mạng vẫn bị khóa) — trả 429 kèm `retryIn` (giây). Thời gian khóa tăng dần mỗi lần bị khóa: 15 phút → 1 giờ → 6 giờ → 24 giờ. Đăng nhập đúng thì đếm lại từ đầu. Trạng thái lưu ở bảng `LoginGuard` nên khởi động lại BE không xóa khóa; muốn mở khóa ngay thì xóa dòng `admin` trong bảng này (Prisma Studio: `pnpm db:studio`).

## API cho Back Office

Tất cả dưới `/api/admin/…`, cần đăng nhập. Dữ liệu trả về đúng dạng BO đang dùng (`bo/src/lib/*/types.ts`) để BO thay kho trên trình duyệt bằng API. Lỗi trả thông báo tiếng Việt trong `message` (400 dữ liệu sai, 404 không có, 409 trùng / không được phép). Bảng dưới là tóm tắt; chi tiết từng trường gửi lên / trả về ở [api.md](./api.md).

| Nhóm | API | Quy tắc |
|---|---|---|
| Cài đặt | `GET`, `PUT /admin/settings` | Lần đầu tạo mặc định giống BO. `PUT` thay toàn bộ (cả phương thức giao, đơn vị vận chuyển, người gửi). Cọc 1–99%, giao tối đa 1–10 lần, lãi tối thiểu 0–95%, hệ số 1–20; cần ≥ 1 phương thức và ≥ 1 đơn vị đang dùng, tên không trùng; link tra cứu bắt đầu bằng http và có `{code}` |
| Danh mục | `GET`, `POST`, `PATCH /:id`, `PUT /order` `{ ids }`, `DELETE /:id` | Bỏ trống id thì tạo từ tên (`Nước hoa` → `nuoc-hoa`). Tên trùng (không dấu, không phân biệt hoa thường) → 409. `PUT /order` sắp xếp theo đúng thứ tự, phải đủ mọi danh mục. Còn sản phẩm thì không xóa được (409) |
| Khách | `GET`, `GET /:id`, `POST`, `PATCH /:id` | Gộp theo số điện thoại: số đã thuộc hồ sơ khác → 409 kèm `customerId`. Bỏ trống id thì `cus-` + 6 số cuối. Bỏ chặn thì xóa lý do chặn. Nhãn bỏ trùng, bỏ trống |
| Mã giảm giá | `GET`, `POST`, `PUT /:id`, `PATCH /:id` `{ active?, used? }`, `DELETE /:id` | Mã bỏ dấu, viết hoa, 4–20 ký tự, không trùng. % 1–100; giảm tiền ≥ 1.000 ₫ và nhỏ hơn đơn tối thiểu; ngày kết thúc không trước ngày bắt đầu; `customerIds` (mã riêng) phải là khách có thật. `PUT` giữ lượt đã dùng và ngày tạo |
| Kho nguyên liệu | `GET`, `GET /:id`, `POST`, `POST /batch`, `PATCH /:id`, `DELETE /:id` | Số tồn, giá nhập (theo dõi tồn) chỉ đổi qua phiếu; tạo có tồn ban đầu thì ghi phiếu "Tồn ban đầu" và chia `openingTotal` ra giá. Công thức sản xuất: không dùng chính nó, không vòng. Còn trong công thức sản phẩm / sản xuất thì không xóa được (409) |
| Phiếu kho | `POST /materials/:id/movements`, `PUT /materials/:id/cost`, `POST /materials/:id/produce`, `GET /stock-movements` | Nhập bắt buộc tiền lô (0 = không mất tiền), tính lại giá bình quân; không xuất quá tồn. Sửa giá ghi giá mới / giá trước. Sản xuất trừ nguyên liệu theo định mức × số lượng, chung mã mẻ, giá theo nguyên liệu hoặc tự nhập; thiếu nguyên liệu / thiếu giá thì chặn. Lọc phiếu theo loại, nguyên liệu, ngày, tìm không dấu |
| Sản phẩm | `GET`, `GET /:id`, `POST`, `PUT /:id`, `PATCH` `{ ids, status?, isNew?, isFeatured? }`, `POST /delete` `{ ids }` | id = slug khi tạo. Slug không trùng, giá giảm < giá bán, danh mục và nguyên liệu trong công thức phải có thật. `PUT` giữ số đã bán, đánh giá |

| Thủ công | `GET /admin/craft`, `PUT`, `DELETE /admin/craft/draft`, `POST /admin/craft/publish` | Bản đã lưu (web dùng; chưa lưu thì trả cấu hình mẫu) và bản nháp kèm nguyên liệu chờ tạo. BE chỉ kiểm tra cấu trúc (phiên bản, id bước / lựa chọn không trùng, tên, phụ thu, cỡ hũ). Lưu: tạo nguyên liệu chờ mà cấu hình còn dùng, ghi bản đã lưu, xóa nháp trong một giao dịch; báo mã Kho không có |
| Sản phẩm hủy đơn | `GET`, `GET /:id`, `PATCH /:id` `{ status, displayProductId? }` | Bản ghi do API đơn hàng tạo. Đã tạo sản phẩm trưng bày phải trỏ tới sản phẩm có thật; trạng thái khác thì bỏ liên kết |

Request JSON tối đa 10 MB (ảnh đang gửi dạng data URL).

## Kiểm thử

- `pnpm test`: chuyển file sao lưu BO (dữ liệu mẫu thật ở `test/fixtures/bo-backup-sample.json`), mã băm, token, PIN dễ đoán, thời gian khóa.
- `pnpm test:e2e`: chạy trên **DB thật, schema `bo_test`** (tách khỏi dữ liệu thật ở `public`; trước khi chạy tự `migrate deploy` vào schema này, mỗi file test xóa trắng schema). Gồm: đăng nhập PIN (khóa 15 phút rồi 1 giờ…, DB giả), chặn khi không có token, health; API nhóm 1 — cài đặt (mặc định, lưu, các quy tắc), danh mục (tạo mã từ tên, trùng tên, sắp xếp, chặn xóa khi còn sản phẩm), khách (trùng số điện thoại, nhãn, chặn / bỏ chặn), mã giảm giá (chuẩn hóa, trùng, quy tắc tiền và ngày, mã riêng, tạm dừng, lượt dùng, xóa); API nhóm 2 — kho (tồn ban đầu và giá ban đầu, giá bình quân 60 → 70 → 78,33 theo ví dụ trong docs, chặn phiếu sai, sửa giá, tạo nhiều), sản xuất (trừ nguyên liệu, mã mẻ, giá theo nguyên liệu và tự nhập, thiếu tồn / thiếu giá, chặn vòng), chặn xóa khi còn trong công thức, lọc phiếu; sản phẩm (slug, giá giảm, danh mục / nguyên liệu không có, sửa giữ số đã bán, bật tắt và xóa hàng loạt); API nhóm 3 — Thủ công (cấu hình mẫu hợp lệ, nháp kèm nguyên liệu chờ, bỏ nháp, chặn cấu hình hỏng, Lưu chỉ tạo nguyên liệu còn dùng và báo mã Kho không có), sản phẩm hủy đơn (thứ tự, bỏ, tạo sản phẩm trưng bày, bỏ liên kết).
