# API Backend

Tài liệu mọi endpoint đang có của `be/`. Cách cài đặt, biến môi trường, bảng DB ở [backend.md](./backend.md). Khi chạy BE có thêm Swagger tại `/api/docs`.

> **Trạng thái:** đã có đăng nhập (PIN) và API nhóm 1 (cài đặt, danh mục, khách hàng, mã giảm giá). Chưa có: sản phẩm, kho, Thủ công, sản phẩm hủy đơn, đơn hàng. BO **chưa gọi** các API này (giai đoạn 4).

## Quy ước chung

- **Địa chỉ:** `http://localhost:4000/api` khi chạy trên máy. Mọi đường dẫn dưới đây tính từ `/api`.
- **Định dạng:** JSON (`Content-Type: application/json`).
- **Đăng nhập:** mọi endpoint cần header `Authorization: Bearer <token>`, trừ `POST /auth/login` và `GET /health`. Lấy token ở `POST /auth/login`.
- **Tiền:** VNĐ, số nguyên (`150000` = 150.000 ₫).
- **Ngày:** ngày kiểu `"YYYY-MM-DD"` (vd ngày mã giảm giá); thời điểm kiểu ISO 8601 (`"2026-11-09T03:48:18.000Z"`); hạn token là số mili giây (`expiresAt`).
- **Trường không có giá trị** thì không có trong kết quả (không trả `null`), giống dữ liệu của BO.

### Lỗi

| Mã | Khi nào | Nội dung |
|---|---|---|
| 400 | Dữ liệu gửi lên sai | Sai kiểu / thiếu trường: `{ "message": ["PIN gồm 6 chữ số."], "error": "Bad Request", "statusCode": 400 }` (`message` là **danh sách**). Sai quy tắc nghiệp vụ: `{ "message": "Mã dài 4–20 ký tự.", "error": "Bad Request", "statusCode": 400 }` (`message` là chuỗi) |
| 401 | Chưa đăng nhập, token sai / hết hạn, PIN sai | `{ "message": "Phiên đăng nhập hết hạn, đăng nhập lại.", "error": "Unauthorized", "statusCode": 401 }` |
| 404 | Không có bản ghi | `{ "message": "Không tìm thấy khách hàng.", "error": "Not Found", "statusCode": 404 }` |
| 409 | Trùng, hoặc không được phép do dữ liệu liên quan | `{ "message": "Mã này đã tồn tại.", "error": "Conflict", "statusCode": 409 }`; một số lỗi kèm thêm trường (xem từng endpoint) |
| 429 | Nhập sai PIN nhiều lần, đang khóa | `{ "message": "...", "retryIn": 900 }` |
| 503 | Máy chủ chưa cấu hình / không kết nối được DB | `{ "message": "...", "error": "Service Unavailable", "statusCode": 503 }` |

---

## Đăng nhập

Một người dùng, đăng nhập bằng **PIN 6 số**, không phân quyền. PIN đặt bằng biến `ADMIN_PIN_HASH` (xem [backend.md](./backend.md#cài-đặt-lần-đầu)).

### `POST /auth/login`

Không cần token.

**Gửi lên**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `pin` | string | ✔ | Đúng 6 chữ số |
| `remember` | boolean | | `true`: phiên 30 ngày (ghi nhớ thiết bị). Không gửi / `false`: 12 giờ |

```json
{ "pin": "739214", "remember": true }
```

**Trả về 200**

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `token` | string | Gửi kèm mọi request: `Authorization: Bearer <token>` |
| `name` | string | `"Admin 2510"` |
| `expiresAt` | number | Hạn phiên (mili giây kể từ 1970) |

```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....", "name": "Admin 2510", "expiresAt": 1796788189978 }
```

**Lỗi**

| Mã | Nội dung |
|---|---|
| 400 | PIN không đúng 6 chữ số — `["PIN gồm 6 chữ số."]`. Không tính vào số lần sai |
| 401 | PIN sai: `{ "message": "PIN không đúng.", "remaining": 4 }` — `remaining` là số lần còn thử trước khi bị khóa |
| 429 | Đang khóa: `{ "message": "Nhập sai PIN nhiều lần, tạm khóa đăng nhập.", "retryIn": 900 }` — `retryIn` là số giây còn khóa. Đang khóa thì nhập đúng PIN cũng bị từ chối |
| 503 | Chưa đặt `ADMIN_PIN_HASH` hoặc `JWT_SECRET`: `"Máy chủ chưa cấu hình PIN đăng nhập."` |

**Chặn đoán thử:** sai 5 lần liên tiếp thì khóa **chung toàn hệ thống** (không theo IP). Thời gian khóa tăng dần mỗi lần bị khóa: 15 phút → 1 giờ → 6 giờ → 24 giờ (giữ 24 giờ từ đó). Đăng nhập đúng thì đếm lại từ đầu. Mở khóa ngay: xóa dòng `admin` trong bảng `LoginGuard`.

### `GET /auth/me`

Phiên đăng nhập hiện tại.

**Trả về 200:** `{ "name": "Admin 2510", "expiresAt": 1796788189978 }`

**Lỗi:** 401 khi không có token, token sai hoặc hết hạn.

### `GET /health`

Không cần token. Kiểm tra máy chủ chạy và kết nối được DB (Render dùng để kiểm tra sức khỏe).

**Trả về 200:** `{ "ok": true }` · **503:** `"Không kết nối được DB."`

---

## Cài đặt

### `GET /admin/settings`

Lần đầu (DB chưa có cài đặt) tự tạo giá trị mặc định giống BO rồi trả về.

**Trả về 200: `ShopSettings`**

| Trường | Kiểu | Mặc định | Ghi chú |
|---|---|---|---|
| `depositPercent` | number | 50 | % cọc, tính trên tiền hàng |
| `maxDeliveryAttempts` | number | 3 | Số lần giao tối đa trước khi hoàn về |
| `resendFee` | number | 30000 | Phí gửi lại đơn mặc định |
| `dailyCapacity` | number | 20 | Số cây xưởng làm mỗi ngày, 0 = không giới hạn |
| `leadDays` | number | 3 | Số ngày làm tối thiểu |
| `minMargin` | number | 50 | Lãi tối thiểu (%) |
| `priceMarkup` | number | 2.5 | Hệ số gợi ý giá |
| `sender` | `{ name, phone, address }` | `{ "2510 Candle", "", "" }` | Người gửi in trên nhãn, phiếu đơn |
| `shippingOptions` | `ShippingOption[]` | Tiêu chuẩn 0 ₫ 3 ngày; Nhanh 50.000 ₫ 1 ngày | Theo thứ tự hiển thị |
| `carriers` | `Carrier[]` | GHN, GHTK, Viettel Post, J&T Express, Shop tự giao | Theo thứ tự hiển thị |

`ShippingOption`: `{ id: string, name: string, fee: number, days: number, enabled: boolean }`

`Carrier`: `{ id: string, name: string, trackingUrl?: string, requireCode: boolean, enabled: boolean }` — `trackingUrl` có `{code}` thay cho mã vận đơn.

```json
{
  "depositPercent": 50, "maxDeliveryAttempts": 3, "resendFee": 30000, "dailyCapacity": 20, "leadDays": 3, "minMargin": 50, "priceMarkup": 2.5,
  "sender": { "name": "2510 Candle", "phone": "", "address": "" },
  "shippingOptions": [{ "id": "standard", "name": "Tiêu chuẩn", "fee": 0, "days": 3, "enabled": true }],
  "carriers": [{ "id": "ghn", "name": "Giao Hàng Nhanh", "trackingUrl": "https://donhang.ghn.vn/?order_code={code}", "requireCode": true, "enabled": true }]
}
```

### `PUT /admin/settings`

Lưu **toàn bộ** cài đặt, thay hết phương thức giao và đơn vị vận chuyển theo đúng thứ tự gửi lên. Đơn đã tạo giữ giá trị lúc tạo.

**Gửi lên:** đủ mọi trường như `GET` trả về.

| Trường | Quy tắc |
|---|---|
| `depositPercent` | Số nguyên 1–99 |
| `maxDeliveryAttempts` | 1–10 |
| `resendFee` | ≥ 0 |
| `dailyCapacity` | 0–1000 |
| `leadDays` | 0–30 |
| `minMargin` | 0–95 |
| `priceMarkup` | Số 1–20 (có thể lẻ, vd 2.5) |
| `sender.name` | Bắt buộc, ≤ 60 ký tự. `phone` ≤ 20, `address` ≤ 200 |
| `shippingOptions` | ≥ 1 phương thức; ≥ 1 phương thức `enabled`; tên không trùng (không phân biệt hoa thường). Mỗi phương thức: `name` ≤ 40, `fee` ≥ 0, `days` 0–60 |
| `carriers` | ≥ 1 đơn vị; ≥ 1 đơn vị `enabled`; tên không trùng. `trackingUrl` (nếu có) bắt đầu bằng `http` và chứa `{code}` |

**Trả về 200:** `ShopSettings` sau khi lưu.

**Lỗi 400:** `"Cần ít nhất một phương thức đang dùng."`, `"Tên phương thức bị trùng."`, `"Cần ít nhất một đơn vị đang dùng."`, `"Tên đơn vị bị trùng."`, `["Link bắt đầu bằng http và có {code}."]`, giá trị ngoài khoảng.

---

## Danh mục

**`Category`:** `{ id: string, name: { vi: string, en: string }, color: string, hidden: boolean }`

`color` là màu tag: `default`, `magenta`, `red`, `volcano`, `orange`, `gold`, `lime`, `green`, `cyan`, `blue`, `geekblue`, `purple`.

### `GET /admin/categories`

**Trả về 200:** `Category[]` theo thứ tự sắp xếp.

### `POST /admin/categories`

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | string | | Bỏ trống thì tạo từ tên tiếng Việt: `"Nước hoa"` → `"nuoc-hoa"` (trùng thì thêm `-2`, `-3`…) |
| `name.vi` | string | ✔ | 1–40 ký tự |
| `name.en` | string | ✔ | ≤ 40; để `""` thì dùng tên tiếng Việt |
| `color` | string | | Mặc định `default` |
| `hidden` | boolean | | Mặc định `false` |

```json
{ "name": { "vi": "Nước hoa", "en": "Perfume" }, "color": "purple" }
```

**Trả về 201:** `Category` vừa tạo (thêm vào cuối danh sách).

**Lỗi 409:** `"Đã có danh mục tên này."` (so không dấu, không phân biệt hoa thường), `"Mã danh mục đã tồn tại."`

### `PATCH /admin/categories/:id`

Gửi trường cần đổi: `name?`, `color?`, `hidden?` (cùng quy tắc như trên).

**Trả về 200:** `Category` sau khi sửa. **Lỗi:** 404 không có danh mục; 409 tên trùng.

### `PUT /admin/categories/order`

Sắp xếp lại (kéo thả trên BO).

**Gửi lên:** `{ "ids": ["trai-cay", "nuoc-hoa"] }` — **đủ mọi** danh mục, mỗi id một lần, theo thứ tự mới.

**Trả về 200:** `Category[]` theo thứ tự mới. **Lỗi 409:** `"Danh sách sắp xếp không khớp danh mục hiện có."`

### `DELETE /admin/categories/:id`

**Trả về 204** (không có nội dung). **Lỗi:** 404; 409 khi còn sản phẩm dùng danh mục: `"Danh mục còn 3 sản phẩm — chuyển sản phẩm sang danh mục khác trước khi xóa."`

---

## Khách hàng

Hồ sơ gộp theo số điện thoại. Số đơn, đã chi, nhóm khách (VIP, Khách quen…) BO tự tính từ đơn — API chỉ giữ hồ sơ.

**`Customer`**

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | string | vd `"cus-889900"` |
| `name` | string | |
| `email` | string | Có thể `""` |
| `phone` | string | Giữ nguyên cách viết, vd `"0944 889 900"` |
| `hasAccount` | boolean | Có tài khoản trên web |
| `newsletter` | boolean | Nhận email ưu đãi |
| `tags` | string[] | Nhãn nội bộ |
| `note` | string? | Ghi chú nội bộ |
| `blocked` | boolean | Chặn đặt hàng |
| `blockReason` | string? | Có khi `blocked` |
| `createdAt` | string | ISO |

### `GET /admin/customers`

**Trả về 200:** `Customer[]`, mới tạo trước.

### `GET /admin/customers/:id`

**Trả về 200:** `Customer`. **Lỗi:** 404 `"Không tìm thấy khách hàng."`

### `POST /admin/customers`

Thêm khách (vd khách mới khi tạo đơn tại BO).

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | string | | Bỏ trống thì `cus-` + 6 số cuối của SĐT |
| `name` | string | ✔ | 1–60 ký tự |
| `phone` | string | ✔ | 9–20 ký tự gồm số, khoảng trắng, `+ . ( ) -` |
| `email` | string | | Email hợp lệ hoặc `""` |
| `hasAccount`, `newsletter` | boolean | | Mặc định `false` |
| `tags` | string[] | | Mỗi nhãn ≤ 30 ký tự |
| `note` | string | | ≤ 500 |
| `createdAt` | string | | ISO, mặc định lúc tạo |

```json
{ "name": "Ngô Thanh Vy", "phone": "0944 889 900" }
```

**Trả về 201:** `Customer`.

**Lỗi 409:** số điện thoại đã thuộc hồ sơ khác (so theo chữ số, bỏ khoảng trắng): `{ "message": "Số này đã thuộc hồ sơ Ngô Thanh Vy.", "customerId": "cus-889900" }`; `"Mã khách đã tồn tại."`

### `PATCH /admin/customers/:id`

Gửi trường cần đổi: `name?`, `phone?`, `email?`, `newsletter?`, `tags?`, `note?`, `blocked?`, `blockReason?`.

- `tags`: bỏ khoảng trắng đầu cuối, bỏ nhãn trống và nhãn trùng.
- `note: ""` thì xóa ghi chú.
- `blocked: true` kèm `blockReason` để chặn; `blocked: false` thì xóa luôn lý do chặn.

```json
{ "blocked": true, "blockReason": "Bom hàng 2 lần" }
```

**Trả về 200:** `Customer` sau khi sửa. **Lỗi:** 404; 409 số điện thoại mới đã thuộc hồ sơ khác (kèm `customerId`).

---

## Mã giảm giá

**`Discount`**

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | string | |
| `code` | string | Viết hoa, không dấu, 4–20 ký tự |
| `description` | string? | Mô tả cho khách |
| `type` | `"percent"` \| `"fixed"` \| `"freeship"` | Giảm %, giảm số tiền, miễn phí giao |
| `value` | number | % (1–100) hoặc số tiền; `freeship` luôn `0` |
| `maxDiscount` | number? | Giảm tối đa, chỉ với `percent` |
| `minOrder` | number? | Đơn tối thiểu |
| `scope` | `"all"` \| `"products"` \| `"custom"` | Mọi sản phẩm / chỉ nến có sẵn / chỉ nến tự phối |
| `firstOrderOnly` | boolean | Chỉ khách đặt lần đầu |
| `customerIds` | string[]? | Mã riêng: chỉ các khách này dùng được. Không có = mọi khách |
| `startsAt` | string | `YYYY-MM-DD` |
| `endsAt` | string? | `YYYY-MM-DD`, không có = không hết hạn |
| `usageLimit` | number? | Tổng lượt dùng tối đa |
| `perCustomerLimit` | number? | Mỗi khách tối đa |
| `used` | number | Số lượt đã dùng |
| `active` | boolean | `false` = tạm dừng |
| `createdAt` | string | `YYYY-MM-DD` |

Trạng thái (Đang chạy, Lên lịch, Hết hạn, Hết lượt, Tạm dừng) BO tự tính từ các trường trên.

### `GET /admin/discounts`

**Trả về 200:** `Discount[]`, mới tạo trước.

### `POST /admin/discounts`

**Gửi lên:** các trường của `Discount`, trừ `used` và `createdAt` (không bắt buộc). `id` bỏ trống thì tự tạo.

| Trường | Bắt buộc | Quy tắc |
|---|---|---|
| `code` | ✔ | Tự bỏ dấu, viết hoa, bỏ ký tự khác chữ và số (`"tết 2027"` → `"TET2027"`); 4–20 ký tự; không trùng |
| `type`, `value`, `scope`, `firstOrderOnly`, `startsAt`, `active` | ✔ | `percent`: `value` 1–100. `fixed`: `value` ≥ 1000 và nhỏ hơn `minOrder` (nếu có) |
| `endsAt` | | Không trước `startsAt` |
| `customerIds` | | Mỗi id phải là khách có thật |
| `maxDiscount`, `minOrder`, `usageLimit`, `perCustomerLimit`, `description` | | `usageLimit`, `perCustomerLimit` ≥ 1; `description` ≤ 120 |

```json
{ "code": "TET2027", "description": "Khuyến mãi Tết", "type": "percent", "value": 20, "maxDiscount": 300000, "scope": "products", "firstOrderOnly": false, "startsAt": "2027-01-20", "endsAt": "2027-02-20", "usageLimit": 100, "perCustomerLimit": 1, "active": true }
```

**Trả về 201:** `Discount`.

**Lỗi:** 400 `"Mã dài 4–20 ký tự."`, `"Mức giảm từ 1 đến 100%."`, `"Nhập số tiền giảm."`, `"Đơn tối thiểu phải lớn hơn số tiền giảm."`, `"Ngày kết thúc phải sau ngày bắt đầu."`, `"Có khách không còn trong danh sách khách hàng."`; 409 `"Mã này đã tồn tại."`

### `PUT /admin/discounts/:id`

Sửa toàn bộ mã (drawer sửa mã). Gửi lên giống `POST`. **Giữ nguyên** `used` và `createdAt`. Gửi `customerIds: []` hoặc bỏ trường này thì mã thành dùng cho mọi khách.

**Trả về 200:** `Discount`. **Lỗi:** như `POST`, thêm 404.

### `PATCH /admin/discounts/:id`

Đổi nhanh trên bảng.

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `active` | boolean | Tạm dừng / bật lại |
| `used` | number | Đặt lại số lượt đã dùng (≥ 0) |

**Trả về 200:** `Discount`. **Lỗi:** 404.

### `DELETE /admin/discounts/:id`

**Trả về 204.** **Lỗi:** 404.
