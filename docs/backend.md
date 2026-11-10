# Backend (be/)

NestJS + Prisma + PostgreSQL trên [Neon](https://neon.com) (gói miễn phí, region Singapore). Phục vụ Back Office: một người dùng, đăng nhập bằng PIN 6 số, không phân quyền.

> **Trạng thái:** giai đoạn 1–2 xong (schema, nhập dữ liệu, đăng nhập bằng PIN). Giai đoạn 3 (API từng trang): xong nhóm 1 (cài đặt, danh mục, khách, mã giảm giá), nhóm 2 (kho nguyên liệu, phiếu kho, sản xuất, sản phẩm), nhóm 3 (Thủ công, sản phẩm hủy đơn) và nhóm 4 (đơn hàng, đơn nháp, thông báo đã đọc) — đủ API cho mọi trang BO. Giai đoạn 4 xong: BO đăng nhập bằng PIN và đọc / ghi mọi dữ liệu qua API (mục BO dùng API bên dưới). Giai đoạn 5: BE lên Render bằng `render.yaml` (mục Đưa lên Render); còn host BO.

## Cài đặt lần đầu

1. `cd be && pnpm install`
2. Tạo `be/.env` theo `be/.env.example`. **Không commit `.env`, không dán chuỗi kết nối hay mật khẩu vào `.env.example`.**

| Biến | Ý nghĩa |
|---|---|
| `DATABASE_URL` | Connection string của Neon (bản `-pooler`). Migrate tự dùng kết nối trực tiếp (bỏ `-pooler`), hoặc đặt `DIRECT_URL` |
| `JWT_SECRET` | Chuỗi ngẫu nhiên ≥ 32 ký tự để ký token đăng nhập. Tạo: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `ADMIN_PIN_HASH` | Mã băm PIN đăng nhập BO. Tạo: `pnpm auth:pin <6 số>` rồi dán dòng in ra vào `.env`. Đổi PIN: chạy lại lệnh, thay dòng cũ, khởi động lại BE |
| `BO_URL` | Địa chỉ BO được gọi API (CORS), nhiều địa chỉ cách nhau dấu phẩy. Để trống = `http://localhost:3001,http://localhost:3011` (BO dev, preview test) |
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

| Đơn hàng | `GET`, `GET /:id`, `POST`, `PUT /:id`, `POST /:id/advance`, `/ship`, `PUT /:id/shipment`, `/delivery-failed`, `/redeliver`, `/return`, `/receive-return`, `/resend`, `PATCH /:id/ready-date`, `/internal-note`, `POST /:id/cancel`, `/refund`, `/refund-overpaid`, `/complaints`; `GET /stock-holds` | Tiền tính lại ở BE (tạm tính theo giá dòng, giảm giá theo mã, cọc trên tiền hàng). Một giao dịch cho đơn + Kho + mã + hồ sơ khách + sản phẩm hủy đơn. Đã thanh toán giữ nguyên liệu, Bắt đầu làm trừ Kho và chốt giá vốn, hủy chưa làm hoàn đúng lượng đã trừ, nến tự phối đã làm sang Sản phẩm hủy đơn, trả lượt mã. Giao không thành đủ số lần thì tự hoàn về; gửi lại cộng phí vào đơn |
| Xóa toàn bộ dữ liệu | `POST /reset` `{ confirm: "XÓA HẾT" }` | Xóa mọi dữ liệu BO trong một giao dịch, giữ đăng nhập (PIN, `LoginGuard`). Dùng chung hàm xóa với `pnpm db:import` |
| Đơn nháp, thông báo | `GET`, `PUT`, `DELETE /order-draft`; `GET`, `POST /notifications/read` | Lưu theo máy chủ thay vì từng trình duyệt |

Request JSON tối đa 10 MB (ảnh đang gửi dạng data URL).

## BO dùng API

- **Chạy trên máy:** BE `pnpm start:dev` (cổng 4000), BO `pnpm dev`. BO gọi `VITE_API_URL` (mặc định `http://localhost:4000/api`); địa chỉ BO phải nằm trong `BO_URL` của BE.
- **Cách BO đọc / ghi** (`bo/src/lib/local-store.ts`): mỗi kho dữ liệu tải bằng `GET` khi có trang đầu tiên cần. Thao tác sửa đổi ngay trên giao diện như trước, rồi gọi API ở nền; BE trả về thì lấy bản của BE, BE từ chối thì hiện thông báo lỗi của BE và tải lại để giao diện khớp dữ liệu thật. Các yêu cầu ghi chạy lần lượt theo thứ tự gọi (chung mọi kho).
- **Việc BE làm thay BO:** đơn hàng giữ / trừ / hoàn Kho, đếm và trả lượt mã giảm giá, tạo hồ sơ khách, tạo sản phẩm hủy đơn; Thủ công bấm Lưu tạo nguyên liệu mới. Sau các thao tác này BO tải lại Kho, mã giảm giá, khách, sản phẩm hủy đơn.
- **Bản nháp Thủ công, đơn nháp:** lưu lên BE sau khi ngừng sửa (0,6 giây / 1 giây).
- **Sao lưu:** Cài đặt › Sao lưu dữ liệu tải đủ mọi kho từ BE rồi xuất file (cùng định dạng cũ). Khôi phục làm trên máy chủ: `pnpm db:import <file>`.
- **Chế độ dữ liệu trên trình duyệt:** `VITE_DATA_SOURCE=local` giữ cách lưu cũ (localStorage), chỉ dùng cho bộ test e2e của BO.

## Đưa lên Render

BE và BO chạy trên [Render](https://render.com), cấu hình ở `render.yaml` ở gốc repo (Render Blueprint, gói Free):

- **`candle-be`** — https://candle-be.onrender.com (Web Service Node, vùng Singapore cùng Neon).
- **`candle2510-bo`** — trang tĩnh (Static Site) build từ `bo/`, gọi BE qua `VITE_API_URL=https://candle-be.onrender.com/api` (gán lúc build). Mọi đường dẫn trả `index.html` (React Router), file trong `assets/` cache lâu. Trang tĩnh không ngủ.
- Mỗi service chỉ build lại khi thư mục của nó (hoặc `render.yaml`) đổi (`buildFilter`).

### BE

| Bước Render | Lệnh |
|---|---|
| Build | `pnpm install --frozen-lockfile` → `pnpm run build` → `pnpm run db:deploy` (áp migration mới, không xóa dữ liệu — gói Free không có bước pre-deploy nên chạy trong build) |
| Start | `node dist/main.js` (cổng do Render cấp qua `PORT`) |
| Health check | `GET /api/health` — lỗi DB thì Render không chuyển sang bản mới |

**Tạo lần đầu**

1. Đẩy code lên GitHub (có `render.yaml`).
2. Render › **New** › **Blueprint** › chọn repo `candle-shop` › Render đọc `render.yaml`, tạo service `candle-be`.
3. Nhập biến môi trường (bí mật không nằm trong repo):

   | Biến | Giá trị |
   |---|---|
   | `DATABASE_URL` | Connection string Neon, bản `-pooler` (giống `be/.env`) |
   | `ADMIN_PIN_HASH` | Phần sau `ADMIN_PIN_HASH=` trong `be/.env` (hoặc chạy lại `pnpm auth:pin <6 số>`) |
   | `BO_URL` | `https://candle2510-bo.onrender.com,http://localhost:3001` (BO trên Render + BO chạy trên máy) |
   | `FRONTEND_URL` | Địa chỉ web (fe), chưa có thì để `http://localhost:3000` |
   | `JWT_SECRET` | Render tự sinh — không cần nhập |

4. **Apply** → chờ build xong (vài phút) → mở `https://candle-be.onrender.com/api/health` thấy `{"ok":true}` là chạy.
5. BO chạy trên máy mà gọi BE trên Render: trong `bo/.env.local` đặt `VITE_API_URL=https://candle-be.onrender.com/api`, chạy lại `pnpm dev` (cổng 3001).

### BO

1. Push `render.yaml` có service `candle2510-bo` lên `main` → Render (Blueprint đã tạo) tự thêm service. Không thấy thì vào Blueprint › **Manual Sync**.
2. Chờ build (~3 phút) → mở https://candle2510-bo.onrender.com (địa chỉ thật ở trang service).
3. Trên `candle-be` › **Environment**: `BO_URL` = `https://candle2510-bo.onrender.com,http://localhost:3001` → Save (BE khởi động lại) — thiếu bước này BO báo "Không kết nối được máy chủ".
4. Đăng nhập bằng PIN. Lần đầu sau 15 phút không dùng, BE trên Render đang ngủ nên chờ ~30–60 giây.

Đổi địa chỉ BE thì sửa `VITE_API_URL` của `candle2510-bo` rồi deploy lại (giá trị gắn vào lúc build).

Địa chỉ `*.onrender.com` cố định theo tên lúc tạo service, đổi tên sau không đổi được địa chỉ. Muốn địa chỉ khác thì đổi `name` trong `render.yaml` → Render tạo service mới → xóa service cũ trên Render (Blueprint không tự xóa). BO từng tên `candle-bo`, rồi `2510candle-bo` (Render không nhận), nay là `candle2510-bo` (10/11/2026).

**Sau đó:** mỗi lần push lên `main` Render tự build và deploy lại service có thư mục thay đổi (`autoDeploy` + `buildFilter`). Sửa schema thì tạo migration như bình thường (`pnpm db:migrate`), lần deploy sau tự áp.

**Lưu ý gói Free**

- Không có request trong 15 phút thì service ngủ; lần gọi đầu sau đó chờ ~30–60 giây (màn đăng nhập BO sẽ chậm lần đầu).
- 750 giờ chạy / tháng — đủ cho một service chạy cả tháng.
- Đổi `JWT_SECRET` trên Render thì mọi phiên đăng nhập cũ hết hạn (cách đăng xuất mọi máy). Đổi PIN: thay `ADMIN_PIN_HASH`, Render tự khởi động lại.

## Kiểm thử

- `pnpm test`: chuyển file sao lưu BO (dữ liệu mẫu thật ở `test/fixtures/bo-backup-sample.json`), mã băm, token, PIN dễ đoán, thời gian khóa.
- `pnpm test:e2e`: chạy trên **DB thật, schema `bo_test`** (tách khỏi dữ liệu thật ở `public`; trước khi chạy tự `migrate deploy` vào schema này, mỗi file test xóa trắng schema). Gồm: đăng nhập PIN (khóa 15 phút rồi 1 giờ…, DB giả), chặn khi không có token, health; API nhóm 1 — cài đặt (mặc định, lưu, các quy tắc), danh mục (tạo mã từ tên, trùng tên, sắp xếp, chặn xóa khi còn sản phẩm), khách (trùng số điện thoại, nhãn, chặn / bỏ chặn), mã giảm giá (chuẩn hóa, trùng, quy tắc tiền và ngày, mã riêng, tạm dừng, lượt dùng, xóa); API nhóm 2 — kho (tồn ban đầu và giá ban đầu, giá bình quân 60 → 70 → 78,33 theo ví dụ trong docs, chặn phiếu sai, sửa giá, tạo nhiều), sản xuất (trừ nguyên liệu, mã mẻ, giá theo nguyên liệu và tự nhập, thiếu tồn / thiếu giá, chặn vòng), chặn xóa khi còn trong công thức, lọc phiếu; sản phẩm (slug, giá giảm, danh mục / nguyên liệu không có, sửa giữ số đã bán, bật tắt và xóa hàng loạt); API nhóm 3 — Thủ công (cấu hình mẫu hợp lệ, nháp kèm nguyên liệu chờ, bỏ nháp, chặn cấu hình hỏng, Lưu chỉ tạo nguyên liệu còn dùng và báo mã Kho không có), sản phẩm hủy đơn (thứ tự, bỏ, tạo sản phẩm trưng bày, bỏ liên kết); API nhóm 4 — tạo đơn (tiền, cọc, mã đơn, giữ nguyên liệu, hồ sơ khách, lượt mã; chặn thiếu Kho / mã sai / khách bị chặn), cả luồng làm → giao → giao không thành → hoàn về → gửi lại → hoàn tất → khiếu nại (hoàn một phần, gửi bù), trùng mã vận đơn, sửa lượt giao, sửa đơn (đổi sản phẩm, trả lượt mã, khoản chờ thu, thu dư rồi hoàn), hủy (hoàn kho, chuyển Sản phẩm hủy đơn, tiền hoàn theo lỗi, ghi hoàn tiền), đơn nháp, thông báo đã đọc; xóa toàn bộ dữ liệu (cần đúng câu xác nhận, giữ khóa đăng nhập, cài đặt về mặc định, Thủ công giữ bước bỏ lựa chọn).
