# API Backend

Tài liệu mọi endpoint đang có của `be/`. Cách cài đặt, biến môi trường, bảng DB ở [backend.md](./backend.md). Khi chạy BE có thêm Swagger tại `/api/docs`.

> **Trạng thái:** đã có đăng nhập (PIN), API nhóm 1 (cài đặt, danh mục, khách hàng, mã giảm giá), nhóm 2 (kho nguyên liệu, phiếu kho, sản xuất, sản phẩm), nhóm 3 (Thủ công, sản phẩm hủy đơn) và nhóm 4 (đơn hàng, đơn nháp, thông báo đã đọc) — đủ mọi trang của BO. BO đã dùng các API này (giai đoạn 4).

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

---

## Kho nguyên liệu

Kho là nơi duy nhất giữ số tồn. Với nguyên liệu có theo dõi tồn, **số tồn và giá nhập chỉ đổi qua phiếu**: sửa thông tin không đổi được hai số này. Không sửa, không xóa phiếu; ghi sai thì ghi phiếu ngược lại. Quy tắc chi tiết ở [pages/inventory.md](./pages/inventory.md).

**`Material`**

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | string | Slug, cố định sau khi tạo, vd `"sap-dau-nanh"` |
| `name` | string | |
| `sku` | string? | Mã nội bộ / nhà cung cấp |
| `category` | `"vessel"` \| `"wax"` \| `"fragrance"` \| `"wick"` \| `"dye"` \| `"decor"` \| `"packaging"` \| `"other"` | Hũ & nắp, sáp, tinh dầu, bấc, màu, trang trí, bao bì, khác |
| `unit` | `"g"` \| `"ml"` \| `"pcs"` | |
| `tracked` | boolean | `false` = không đếm tồn, luôn coi là còn hàng |
| `stock` | number | Số tồn |
| `lowStock` | number | Dưới ngưỡng này là "Sắp hết" |
| `unitCost` | number? | Giá nhập bình quân 1 đơn vị (1 g, 1 ml, 1 cái), 2 chữ số lẻ. Không có = chưa có giá |
| `jarType`, `capacity` | string?, number? | Chỉ hũ: loại hũ và dung tích (ml) |
| `recipe` | `{ materialId, quantity }[]`? | Xưởng tự sản xuất: định mức cho 1 đơn vị. Không có = nguyên liệu mua về |
| `swatch`, `note` | string? | Màu hiển thị, ghi chú |
| `updatedAt` | string | ISO |

### `GET /admin/materials`

**Trả về 200:** `Material[]`, sắp theo loại rồi tên.

### `GET /admin/materials/:id`

**Trả về 200:** `Material`. **Lỗi:** 404 `"Không tìm thấy nguyên liệu."`

### `POST /admin/materials`

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | string | | Bỏ trống thì tạo từ tên (trùng thì thêm `-2`…) |
| `name` | string | ✔ | 1–80 ký tự |
| `category`, `unit` | | ✔ | Như bảng trên |
| `tracked` | boolean | ✔ | Có `recipe` thì luôn `true` |
| `stock` | number | | **Tồn ban đầu**, ghi thành phiếu Nhập thêm "Tồn ban đầu". Chỉ khi `tracked` |
| `openingTotal` | number | | Tổng tiền đã trả cho tồn ban đầu (0 = không mất tiền), giá nhập ban đầu = `openingTotal ÷ stock` |
| `lowStock` | number | | Mặc định 0 (BO điền sẵn 500 g, 500 ml, 10 cái) |
| `unitCost` | number \| null | | Chỉ dùng khi **không** theo dõi tồn |
| `jarType`, `capacity` | | | Chỉ với `vessel`; có `jarType` thì bắt buộc `capacity` |
| `recipe` | `{ materialId, quantity }[]` | | Thành phẩm sản xuất. Số lượng làm ghi bằng `POST /:id/produce`, không gửi `stock` |
| `sku`, `swatch`, `note` | string | | ≤ 30, 30, 500 ký tự |

```json
{ "name": "Sáp đậu nành", "category": "wax", "unit": "g", "tracked": true, "stock": 5000, "openingTotal": 300000, "lowStock": 500 }
```

**Trả về 201:** `Material` (ví dụ trên ra `unitCost: 60`).

**Lỗi:**
- 400 `"Nhập tồn ban đầu để chia ra giá mỗi đơn vị."` (có `openingTotal` mà tồn 0)
- 400 `"Thành phẩm sản xuất: ghi số lượng bằng phiếu Sản xuất…"`
- 400 `"Nhập dung tích cho hũ."`
- 400 lỗi công thức, như ở `PATCH`
- 409 `"Mã nguyên liệu đã tồn tại."`

### `POST /admin/materials/batch`

Tạo nhiều nguyên liệu một lần (trang Thủ công bấm Lưu).

**Gửi lên:** `{ "materials": [ <như POST>, … ] }`. Id đã có thì bỏ qua. Một cái lỗi thì không tạo cái nào.

**Trả về 201:** `Material[]`, chỉ gồm các nguyên liệu vừa tạo.

### `PATCH /admin/materials/:id`

Sửa thông tin và cài đặt (nút **Lưu thông tin**). **Không** đổi số tồn.

Gửi trường cần đổi: `name`, `sku`, `category`, `unit`, `tracked`, `lowStock`, `jarType`, `capacity`, `recipe`, `swatch`, `note`. Gửi được `unitCost` chỉ khi không theo dõi tồn.

- `recipe: []` thì đổi về nguyên liệu mua về (số tồn giữ nguyên).
- Chuỗi rỗng (`""`) thì xóa trường; `capacity: null` xóa dung tích.
- Đổi sang loại khác `vessel` thì tự bỏ loại hũ, dung tích.

**Trả về 200:** `Material`.

**Lỗi:**
- 400 `"Công thức không được dùng chính nguyên liệu này."`
- 400 `"Hũ gốm đang được làm từ nguyên liệu này — không dùng ngược lại được."` (chặn vòng)
- 400 `"Công thức có nguyên liệu bị trùng."`
- 400 `"Không có nguyên liệu … trong Kho."`
- 400 `"Thành phẩm sản xuất luôn theo dõi tồn."`
- 400 `"Nguyên liệu theo dõi tồn: đổi giá bằng phiếu nhập hoặc Sửa giá."`
- 404

### `DELETE /admin/materials/:id`

Xóa nguyên liệu kèm cả lịch sử phiếu. **Trả về 204.**

**Lỗi:**
- 404
- 409 khi nguyên liệu còn nằm trong công thức sản phẩm hoặc công thức sản xuất: `"Đang dùng trong công thức của Hũ gốm 150ml, Nến cam — bỏ khỏi công thức trước khi xóa."`

BO hiện chỉ cảnh báo trường hợp này. BE chặn hẳn, để đơn hàng không trừ thiếu nguyên liệu.

### `POST /admin/materials/:id/movements`

Ghi phiếu tay.

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `type` | `"in"` \| `"out"` \| `"adjust"` | ✔ | Nhập thêm / Xuất, hao hụt / Kiểm kê |
| `amount` | number | ✔ | `in`, `out`: lượng (> 0). `adjust`: **số đếm thực tế** (≥ 0) |
| `lotTotal` | number | với `in` | Tổng tiền lô; `0` = không mất tiền (hàng tặng, mẫu thử) |
| `note` | string | | ≤ 200 |

Cách tính giá:
- Giá lô = `lotTotal ÷ amount`.
- Giá bình quân mới = (tồn × giá cũ + lượng nhập × giá lô) ÷ tổng. Chưa có giá hoặc hết tồn thì lấy giá lô.
- Xuất và kiểm kê không đổi giá.
- Số tồn sau phiếu làm tròn tới số nguyên.

```json
{ "type": "in", "amount": 5000, "lotTotal": 400000, "note": "Lô tháng 11" }
```

**Trả về 201:** `{ "material": Material, "movement": StockMovement }`

**Lỗi:**
- 400 `"Nhập tổng tiền đã trả cho lô, hoặc 0 nếu không mất tiền."`
- 400 `"Không xuất quá số đang có (còn 5.000 g)."`
- 400 `"Nhập số lượng lớn hơn 0."`
- 400 `"Nguyên liệu không theo dõi tồn — không ghi phiếu kho."`
- 404

### `PUT /admin/materials/:id/cost`

Sửa tay giá nhập bình quân (nút **Sửa giá** / **Đặt giá**). Ghi phiếu "Sửa giá nhập", không đổi số tồn.

**Gửi lên:** `{ "unitCost": 59.8 }` (giá 1 đơn vị, giữ 2 chữ số lẻ).

**Trả về 200:** `{ "material": Material, "movement": StockMovement | null }`. `movement` là `null` khi giá không đổi; lúc đó không ghi phiếu.

### `POST /admin/materials/:id/produce`

Sản xuất một mẻ thành phẩm (vd hũ gốm) theo `recipe`:
- Mỗi nguyên liệu một phiếu `make`, trừ định mức × số lượng, ghi chú dạng "Làm Hũ gốm 150ml · 20 cái".
- Thành phẩm được cộng bằng một phiếu `make`.
- Tất cả phiếu của mẻ chung mã mẻ `SX-…`.

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `count` | number | ✔ | Số lượng làm, số nguyên ≥ 1 |
| `total` | number | | **Tự nhập** tổng chi phí cả mẻ. Bỏ trống = theo giá nguyên liệu (lượng × giá nhập bình quân) |
| `note` | string | | Ghi chú phiếu thành phẩm, vd `"Mẻ đầu tiên"` |

Tổng chi phí ÷ số lượng ra giá mỗi đơn vị, rồi gộp vào giá bình quân của thành phẩm như một lô nhập. Ví dụ: 20 hũ, mỗi hũ 350 g thạch cao (40 ₫/g) + 2 ml màu (200 ₫/ml) = 288.000 ₫, tức 14.400 ₫/hũ.

**Trả về 201:** `{ "material": Material, "batch": "SX-K3F9A", "movements": StockMovement[] }`, phiếu thành phẩm đứng đầu.

**Lỗi:**
- 400 `"Không đủ Thạch cao (cần 35.000 g, còn 12.000)."`
- 400 `"Thạch cao chưa có giá nhập — đặt giá trong Kho, hoặc tự nhập tổng chi phí mẻ."`
- 400 `"Nguyên liệu này không có công thức sản xuất."`
- 400 `["Nhập số lượng sản xuất lớn hơn 0."]`
- 404

---

## Phiếu kho

**`StockMovement`**

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | string | |
| `materialId` | string | |
| `type` | `"in"` \| `"out"` \| `"adjust"` \| `"order"` \| `"cost"` \| `"make"` | Nhập thêm, Xuất / hao hụt, Kiểm kê, Theo đơn hàng, Sửa giá nhập, Sản xuất |
| `change` | number | + nhập, − xuất; phiếu `cost` luôn 0 |
| `after` | number | Số tồn sau phiếu |
| `note` | string? | |
| `orderCode` | string? | Đơn gây ra phiếu (`order`, hoàn kho do hủy đơn) |
| `totalCost`, `unitCost` | number? | Phiếu nhập / thành phẩm: tiền lô và giá mỗi đơn vị. Phiếu `cost`: `unitCost` là giá mới |
| `previousCost` | number? | Phiếu `cost`: giá trước khi sửa |
| `batch` | string? | Mã mẻ sản xuất |
| `by` | string | Người ghi (tên trong phiên đăng nhập) |
| `at` | string | ISO |

### `GET /admin/stock-movements`

Trả phiếu mới nhất trước. Lọc bằng query, đều không bắt buộc:

| Query | Ghi chú |
|---|---|
| `type` | Một trong các loại trên |
| `materialId` | Lịch sử một nguyên liệu (drawer nguyên liệu) |
| `from`, `to` | `YYYY-MM-DD`, tính cả hai đầu, theo giờ Việt Nam |
| `q` | Tìm theo tên nguyên liệu, ghi chú, mã đơn, mã mẻ (không dấu) |
| `limit` | 1–5000, mặc định 500 |

Ví dụ: `GET /admin/stock-movements?type=in&from=2026-11-01&to=2026-11-30&q=dau nanh`

**Trả về 200:** `StockMovement[]`. **Lỗi:** 400 khi query sai dạng.

Phiếu `order` (trừ theo đơn khi Bắt đầu làm) và "Hoàn kho do hủy đơn" sẽ do API đơn hàng ghi (nhóm 4, chưa làm).

---

## Sản phẩm trưng bày

Mẫu nến hiện trên web. Không có số tồn thành phẩm: khách đặt thì xưởng làm, nguyên liệu trừ theo `recipe`. BO dựng `recipe`, `size`, `waxType` từ lựa chọn Thủ công (`build`) rồi gửi lên; BE lưu lại và kiểm tra. Quy tắc ở [pages/products.md](./pages/products.md).

**`Product`**

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | string | Sản phẩm mới lấy slug làm id; đổi slug sau đó vẫn giữ id |
| `name`, `slug` | string | |
| `description` | string? | |
| `price` | number | Giá bán |
| `salePrice` | number? | Giá giảm, nhỏ hơn `price` |
| `images` | string[] | Ảnh đầu là ảnh chính. URL hoặc data URL |
| `categoryId` | string | |
| `aromaLevel` | `"soft"` \| `"medium"` \| `"strong"` | |
| `size` | `"small"` \| `"medium"` \| `"big"` | Cỡ trên web |
| `scent`, `waxType` | string? | Nốt hương, loại sáp |
| `burnTime` | number? | Giờ cháy |
| `recipe` | `{ materialId, quantity }[]`? | Công thức 1 cây. Không có = "Chưa có công thức" |
| `build` | object? | `{ selection, extras }`: lựa chọn để mở lại form, BE lưu nguyên |
| `status` | `"active"` \| `"hidden"` | Đang bán / Tạm ẩn |
| `isNew`, `isFeatured` | boolean | Nhãn Mới, Nổi bật |
| `rating`, `reviewCount`, `sold` | number | Chỉ đọc |
| `createdAt`, `updatedAt` | string | ISO |

### `GET /admin/products`

**Trả về 200:** `Product[]`, mới tạo trước.

### `GET /admin/products/:id`

**Trả về 200:** `Product`. **Lỗi:** 404 `"Không tìm thấy sản phẩm."`

### `POST /admin/products`

**Gửi lên:** các trường của `Product`, trừ `rating`, `reviewCount`, `sold`, `createdAt`, `updatedAt`.

| Trường | Bắt buộc | Quy tắc |
|---|---|---|
| `name` | ✔ | 1–120 ký tự |
| `slug` | | Bỏ trống thì tạo từ tên; luôn chuẩn hóa (`"Nến Cam Quế"` → `"nen-cam-que"`); không trùng |
| `price` | ✔ | Số nguyên ≥ 1.000 |
| `salePrice` | | Nhỏ hơn `price` |
| `images` | ✔ | 1–10 ảnh |
| `categoryId` | ✔ | Danh mục có thật |
| `aromaLevel`, `size`, `status`, `isNew`, `isFeatured` | ✔ | |
| `recipe` | | Nguyên liệu có thật, không trùng, lượng > 0 |
| `description`, `scent`, `waxType`, `burnTime`, `build` | | `description` ≤ 2000, `scent` và `waxType` ≤ 120 ký tự; `burnTime` 1–1000 |

```json
{
  "name": "Nến Cam Quế", "price": 250000, "images": ["https://…/cam-que.webp"], "categoryId": "trai-cay",
  "aromaLevel": "medium", "size": "small", "waxType": "Sáp đậu nành", "burnTime": 25,
  "recipe": [{ "materialId": "sap-dau-nanh", "quantity": 120 }, { "materialId": "hu-gom-150", "quantity": 1 }],
  "build": { "selection": {}, "extras": [] },
  "status": "active", "isNew": true, "isFeatured": false
}
```

**Trả về 201:** `Product`.

**Lỗi:**
- 400 `"Giá giảm phải thấp hơn giá bán."`
- 400 `"Danh mục không còn — chọn danh mục khác."`
- 400 `"Không có nguyên liệu … trong Kho."`
- 400 `["Cần ít nhất 1 ảnh."]`
- 400 `["Nhập giá bán."]`
- 409 `"Slug “nen-cam-que” đã được dùng cho Nến Cam Quế."`
- 409 `"Mã sản phẩm đã tồn tại."`

### `PUT /admin/products/:id`

Sửa toàn bộ (drawer sửa). Gửi lên giống `POST`, bỏ `id`.

- Giữ nguyên `id`, `rating`, `reviewCount`, `sold`, `createdAt`.
- Không gửi `recipe` / `build` thì công thức / lựa chọn cũ bị bỏ.
- Đơn đã tạo giữ công thức chụp lúc tạo đơn.

**Trả về 200:** `Product`. **Lỗi:** như `POST`, thêm 404.

### `PATCH /admin/products`

Bật / tắt trên bảng, và thao tác khi chọn nhiều.

**Gửi lên:** `{ "ids": ["nen-cam-que", "nen-oai-huong"], "status": "hidden" }`. `ids` bắt buộc, kèm ít nhất một trong `status`, `isNew`, `isFeatured`.

**Trả về 200:** `Product[]`, các sản phẩm đã đổi. **Lỗi:** 400 `"Không có gì để đổi."`

### `POST /admin/products/delete`

Xóa một hoặc nhiều sản phẩm. **Gửi lên:** `{ "ids": ["nen-cam-que"] }`. Đơn cũ giữ tên, giá, công thức đã chụp nên không bị ảnh hưởng.

**Trả về 200:** `{ "deleted": 1 }`. **Lỗi:** 404 khi không xóa được sản phẩm nào.

---

## Thủ công

Cấu hình trình dựng nến tự phối: các bước, lựa chọn, giá, nguyên liệu gắn Kho. Dạng dữ liệu (`CraftConfig`) ở `bo/src/lib/craft/types.ts`, quy tắc ở [pages/craft.md](./pages/craft.md).

BE giữ hai bản:
- **Bản đã lưu:** bản web đang dùng.
- **Bản nháp:** mọi chỉnh sửa trên trang Thủ công, kèm nguyên liệu tạo mới đang chờ vào Kho.

Bấm **Lưu** thì bản nháp lên web. BE chỉ kiểm tra cấu trúc. Giá, tồn kho, lượng tiêu hao do BO và web tính.

**`CraftConfig`** (rút gọn):

```json
{
  "version": 1,
  "currency": "VND",
  "steps": [
    { "id": "vessel", "kind": "vessel", "title": { "vi": "Hũ", "en": "Vessel" }, "icon": "vessel", "enabled": true, "required": true,
      "options": [{ "id": "gom", "name": { "vi": "Hũ gốm", "en": "Ceramic" }, "priceDelta": 90000, "available": true, "shape": "jar", "lid": null,
        "sizes": [{ "id": "s150", "ml": 150, "grams": 120, "priceDelta": 0, "available": true, "materialId": "jar-150" }] }] },
    { "id": "wax", "kind": "cards", "title": { "vi": "Sáp", "en": "Wax" }, "icon": "layers", "enabled": true, "required": true, "multiple": true,
      "options": [{ "id": "soy", "name": { "vi": "Sáp đậu nành", "en": "Soy" }, "priceDelta": 0, "unitPrice": 18000, "available": true, "materialId": "sap-dau-nanh" }] }
  ],
  "updatedAt": "2026-11-09T04:20:00.000Z"
}
```

`updatedAt` do máy chủ ghi; gửi lên thì bị bỏ qua.

**Kiểm tra cấu trúc** (lỗi trả 400 kèm vị trí, vd `"Bước wax › soy: thiếu tên."`):
- `version` phải là 1 và `currency` là `"VND"`.
- Mỗi bước có `id` không trùng, `kind` (`vessel` \| `cards` \| `swatches` \| `blend` \| `inputs`), `title.vi`, `enabled`, `required`.
- Lựa chọn có `id` không trùng trong bước, `name.vi`, `priceDelta` ≥ 0, `available`. `unitPrice` nếu có thì ≥ 0.
- Hũ có ít nhất một cỡ; mỗi cỡ có `id`, `ml`, `grams`, `priceDelta`.
- Bước `inputs` có `fields` (`id`, `label`, `maxLength`, `priceDelta`) và `addons` (`id`, `name`, `priceDelta`).

### `GET /admin/craft`

**Trả về 200:**

```json
{ "saved": CraftConfig, "isDefault": false, "draft": CraftConfig | null, "pendingMaterials": Material[] }
```

- `saved`: bản web đang dùng. Chưa lưu lần nào thì là cấu hình mẫu của BO, kèm `isDefault: true`. Cấu hình mẫu trỏ tới mã của Kho mẫu.
- `draft`: bản nháp; `null` = không có thay đổi.
- `pendingMaterials`: nguyên liệu tạo từ drawer lựa chọn ("Tạo nguyên liệu mới trong Kho"), chưa vào Kho.

### `PUT /admin/craft/draft`

Lưu bản nháp. Rời trang hay đổi máy không mất việc đang làm. Chưa đụng tới Kho.

**Gửi lên:**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `config` | `CraftConfig` | ✔ | |
| `pendingMaterials` | như `POST /admin/materials`, **bắt buộc có `id`** | | Nguyên liệu chờ tạo |

**Trả về 200:** như `GET`. **Lỗi:** 400 cấu trúc sai, `"Nguyên liệu chờ tạo cần có id."`

### `DELETE /admin/craft/draft`

Bỏ thay đổi: xóa bản nháp và các nguyên liệu đang chờ tạo. **Trả về 200:** như `GET`.

### `POST /admin/craft/publish`

Bấm **Lưu**: đưa cấu hình lên web. Gửi lên giống `PUT /draft` (BO gửi bản nháp đang có). Làm trong một giao dịch, lỗi giữa chừng thì không đổi gì:

1. Tạo các nguyên liệu trong `pendingMaterials` mà cấu hình **còn dùng**. Nguyên liệu đã bỏ khỏi lựa chọn thì không tạo, id đã có trong Kho thì bỏ qua. Mỗi nguyên liệu có tồn được ghi phiếu "Tồn ban đầu".
2. Ghi bản đã lưu.
3. Xóa bản nháp.

**Trả về 200:**

```json
{ "saved": CraftConfig, "createdMaterials": Material[], "missingMaterials": ["jar-150"] }
```

`missingMaterials`: các mã cấu hình đang trỏ tới mà Kho không có. Web và BO coi các lựa chọn đó là hết hàng. Lưu vẫn thành công; BO nên hiện cảnh báo.

**Lỗi:** 400 như `PUT /draft`, hoặc lỗi tạo nguyên liệu như `POST /admin/materials`.

---

## Sản phẩm hủy đơn

Nến tự phối đã làm xong nhưng đơn bị hủy. Mỗi dòng nến tự phối của đơn là một bản ghi, kèm số lượng. Chỉ quản lý ở BO, không hiện trên web. Bản ghi do API đơn hàng tạo khi hủy đơn đã làm (nhóm 4, chưa làm). Quy tắc ở [pages/cancelled-products.md](./pages/cancelled-products.md).

**`CancelledProduct`**

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | string | |
| `name` | string | |
| `custom` | string? | Mô tả cấu hình nến tự phối |
| `recipe` | `{ materialId, quantity }[]`? | Công thức 1 hũ, để điền sẵn khi tạo sản phẩm trưng bày |
| `personalized` | boolean | Có chữ riêng của khách (khắc tên, lời nhắn), khó bán lại |
| `images` | string[] | |
| `price` | number | Giá một cây khách đặt |
| `quantity` | number | |
| `orderId`, `orderCode`, `customerName` | string | Đơn bị hủy |
| `cancelReason` | string | |
| `cancelledAt`, `updatedAt` | string | ISO |
| `status` | `"pending"` \| `"converted"` \| `"discarded"` | Chưa xử lý / Đã tạo sản phẩm trưng bày / Đã bỏ |
| `displayProductId` | string? | Sản phẩm trưng bày tạo từ bản ghi này (khi `converted`) |

### `GET /admin/cancelled-products`

**Trả về 200:** `CancelledProduct[]`, mới hủy trước.

### `GET /admin/cancelled-products/:id`

**Trả về 200:** `CancelledProduct`. **Lỗi:** 404 `"Không tìm thấy sản phẩm hủy đơn."`

### `PATCH /admin/cancelled-products/:id`

Đổi trạng thái.

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `status` | `"pending"` \| `"converted"` \| `"discarded"` | ✔ | |
| `displayProductId` | string | với `converted` | Sản phẩm trưng bày đã tạo (`POST /admin/products` trước, rồi gọi API này). Trạng thái khác thì tự bỏ liên kết |

```json
{ "status": "converted", "displayProductId": "nen-tu-phoi-cam" }
```

**Trả về 200:** `CancelledProduct`.

**Lỗi:**
- 400 `"Cần mã sản phẩm trưng bày đã tạo."`
- 400 `"Không tìm thấy sản phẩm trưng bày này."`
- 400 khi `status` sai
- 404

---

## Đơn hàng

Luồng đơn và quy tắc ở [pages/orders.md](./pages/orders.md) và [workflow.md](./workflow.md).

**BE tính lại tiền:**
- Tạm tính = Σ giá × số lượng, theo giá từng dòng BO gửi lên. Giá nến tự phối do BO tính theo Thủ công.
- Giảm giá tính lại theo mã, đúng quy tắc checkout.
- Cọc theo % ở Cài đặt, tính trên tiền hàng (tạm tính − giảm giá), không gồm phí giao.

**Mọi thao tác chạy trong một giao dịch.** Đơn đổi cùng lúc với Kho, mã giảm giá, hồ sơ khách và sản phẩm hủy đơn. Lỗi giữa chừng thì không đổi gì. Mỗi thao tác ghi một dòng lịch sử kèm người làm (tên trong phiên đăng nhập).

**Trạng thái:**

```
pending → paid → producing → ready → shipping → completed
                                       ↓
                              delivery_failed → returning → returned → (gửi lại) shipping
cancelled: hủy từ pending, paid, producing, ready, returned
```

| `status` | Nhãn |
|---|---|
| `pending` | Chờ thanh toán |
| `paid` | Đã thanh toán: giữ nguyên liệu |
| `producing` | Đang làm: đã trừ Kho |
| `ready` | Chờ giao |
| `shipping` | Đang giao |
| `completed` | Hoàn tất |
| `delivery_failed` | Giao không thành |
| `returning` | Đang hoàn về |
| `returned` | Đã hoàn về |
| `cancelled` | Đã hủy |

Thao tác sai trạng thái trả 400, vd `"Đơn đang Chờ giao — không làm được thao tác này."`

### `Order`

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id`, `code` | string | `code` dạng `SC` + YYMMDD (giờ Việt Nam) + số thứ tự trong ngày, vd `SC261109001` |
| `status` | string | Bảng trên |
| `customer` | `{ name, email, phone }` | Chụp lúc tạo / sửa đơn |
| `shippingAddress` | string | |
| `shippingMethod`, `shippingName`, `shippingDays` | string, string?, number? | Phương thức giao, chụp lúc tạo đơn |
| `depositPercent` | number? | % cọc lúc tạo đơn |
| `items` | `OrderItem[]` | |
| `subtotal`, `discount`, `shippingFee`, `total` | number | `shippingFee` gồm cả phí gửi lại |
| `discountCode` | string? | |
| `paymentPlan` | `"full"` \| `"deposit"` \| `"later"` | `later` = trả toàn bộ khi nhận hàng |
| `paymentMethod` | `"vnpay"` \| `"momo"` \| `"cod"` | `cod` = tiền mặt / chuyển khoản |
| `payments` | `Payment[]` | |
| `readyDate` | string | Ngày làm xong `YYYY-MM-DD` |
| `note`, `internalNote` | string? | Ghi chú của khách / nội bộ |
| `cancelReason`, `cancelOutcome`, `cancelFault` | | Khi hủy. `cancelOutcome`: `returned` (hoàn nguyên liệu) \| `stocked` (sang Sản phẩm hủy đơn) \| `consumed`. `cancelFault`: `customer` \| `shop` |
| `refundDue` | number? | Số phải hoàn lúc hủy |
| `refund` | `{ amount, images, note?, at, by }`? | Khoản đã hoàn sau khi hủy |
| `carrier` | `{ id, name }`? | Đơn vị vận chuyển chọn lúc tạo đơn |
| `shipment` | `{ carrierId, carrier, trackingCode?, trackingUrl?, cost?, at }`? | Lượt giao hiện tại; `cost` = phí shop trả lượt này |
| `shippingCost` | number? | Tổng phí shop đã trả đơn vị vận chuyển (mọi lượt, phí hoàn hàng) |
| `deliveryAttempts`, `deliveryIssue` | number?, string? | Số lần giao không thành của lượt hiện tại, lý do gần nhất |
| `returnCondition`, `returnNote` | `"good"` \| `"damaged"`?, string? | Khi hàng hoàn về |
| `resendFee` | number? | Tổng phí gửi lại đã cộng vào đơn |
| `materialCost` | number? | Giá vốn nguyên liệu chốt lúc Bắt đầu làm |
| `complaints` | `Complaint[]`? | |
| `replacementFor` | `{ id, code }`? | Đơn gửi bù cho đơn gốc (0 ₫) |
| `history` | `{ at, kind?, status, note?, by }[]` | `kind`: `status` \| `payment` \| `schedule` \| `delivery` \| `edit` \| `complaint` |
| `createdAt`, `updatedAt` | string | ISO |

**`OrderItem`:** `{ id, productId?, name, image?, price, quantity, custom?, craft?, recipe? }`
- Nến có sẵn có `productId`.
- Nến tự phối có `custom` (mô tả), `craft` (lựa chọn từng bước) và `recipe` (công thức 1 hũ chụp lúc tạo đơn).

**`Payment`:** `{ id, provider, amount, status: "pending" | "success" | "failed" | "refunded", transactionId?, kind?: "refund", images?, note?, createdAt }`. Khoản hoàn một phần là số âm, kèm `kind: "refund"`.

**`Complaint`:** `{ id, reason, images, resolution: "resend" | "refund" | "none", refundAmount?, replacementId?, replacementCode?, at, by }`

### `GET /admin/orders`

Query `status` (không bắt buộc) để lọc theo một trạng thái. **Trả về 200:** `Order[]`, mới tạo trước.

### `GET /admin/orders/:id`

**Trả về 200:** `Order`. **Lỗi:** 404 `"Không tìm thấy đơn hàng."`

### `POST /admin/orders`

Tạo đơn tại BO (khách đặt qua điện thoại, Zalo, Facebook, tại cửa hàng…).

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `id` | string | | Dạng `ord-…`. Bỏ trống thì BE tự tạo. BO gửi id đã tạo sẵn để drawer đang mở giữ đúng đơn; trùng thì 409 `"Mã đơn đã tồn tại."` |
| `customer` | `{ name, phone, email? }` | ✔ | |
| `shippingAddress` | string | ✔ | |
| `shippingMethod` | string | ✔ | id phương thức ở Cài đặt |
| `shippingFee` | number | | Bỏ trống = phí của phương thức. Admin sửa được |
| `carrierId` | string | | Đơn vị vận chuyển dự kiến |
| `lines` | `Line[]` | ✔ | 1–50 dòng, xem dưới |
| `discountCode` | string | | Tự viết hoa, bỏ ký tự lạ |
| `paymentPlan` | `"deposit"` \| `"full"` \| `"later"` | ✔ | Cọc / Trả đủ / **Trả sau** (không thu lúc đặt, không tạo khoản thu; khách trả toàn bộ khi nhận hàng) |
| `depositPercent` | number | | % cọc của đơn này, 1–99. Bỏ trống = % trong Cài đặt. Lưu vào đơn |
| `paymentMethod` | | ✔ | |
| `received` | boolean | ✔ | Đã nhận tiền (cọc / đủ) lúc tạo: đơn vào thẳng Đã thanh toán. Trả sau: **đã xác nhận đơn** (vào thẳng `paid`, lịch sử "Xác nhận đơn · trả tiền khi nhận hàng", không thu gì) |
| `transactionId` | string | | Mã giao dịch, khi `received` |
| `readyDate` | string | ✔ | `YYYY-MM-DD` |
| `channel` | `"phone"` \| `"zalo"` \| `"facebook"` \| `"store"` \| `"other"` | ✔ | Ghi vào lịch sử: "Tạo đơn tại BO · Zalo" |
| `note`, `internalNote` | string | | |
| `allowBlocked` | boolean | | Khách đang bị chặn: gửi `true` sau khi admin chọn "Vẫn tạo đơn" |

**`Line`:**
- `{ kind: "product", productId, price, quantity, name?, image? }`: nến có sẵn. Thiếu tên / ảnh thì lấy từ sản phẩm.
- `{ kind: "custom", custom, craft?, recipe, price, quantity }`: nến tự phối. Bắt buộc có `custom` và `recipe`, để giữ và trừ Kho.

```json
{
  "customer": { "name": "Ngô Thanh Vy", "phone": "0944 889 900" },
  "shippingAddress": "25 Hàng Bạc, Hà Nội", "shippingMethod": "standard", "carrierId": "ghn",
  "lines": [
    { "kind": "product", "productId": "nen-cam", "price": 250000, "quantity": 2 },
    { "kind": "custom", "custom": "Hũ gốm · Sáp đậu nành", "recipe": [{ "materialId": "soy", "quantity": 150 }, { "materialId": "jar", "quantity": 1 }], "price": 320000, "quantity": 1 }
  ],
  "discountCode": "GIAM10", "paymentPlan": "deposit", "paymentMethod": "cod", "received": true,
  "readyDate": "2026-11-20", "channel": "zalo"
}
```

Tính tiền ví dụ trên: tạm tính 820.000; giảm 10% = 82.000; phí giao 30.000; tổng 768.000. Cọc 50% của 738.000 = 369.000. Cọc làm tròn tới nghìn, tối thiểu 1.000 ₫.

**Kèm theo:**
- Một khoản thu bằng số cần trả lúc này: cọc hoặc đủ. `received` thì khoản này thành công, không thì đang chờ.
- Có mã giảm giá thì tăng 1 lượt dùng.
- Số điện thoại chưa có hồ sơ thì tạo hồ sơ khách vãng lai.

**Trả về 201:** `{ "order": Order, "createdCustomer": true }`

**Lỗi:**
- 400 `"Mã giảm giá: Mã đã hết hạn."`. Các lý do khác: không có mã, tạm dừng, hết lượt, chưa tới ngày, mã riêng của khách khác, chưa đủ đơn tối thiểu, chỉ khách lần đầu, khách hết lượt, sai phạm vi.
- 400 `"Dòng 2: nến tự phối cần công thức để giữ và trừ Kho."`
- 400 `"Không có phương thức giao này."`
- 409 Kho không đủ trên phần còn dùng được (tồn − đang giữ cho đơn Đã thanh toán):
  ```json
  { "message": "Kho không đủ Hũ gốm (cần 8 cái, còn 7) — giảm số lượng hoặc đổi cấu hình.", "shortages": [{ "materialId": "jar", "name": "Hũ gốm", "need": 8, "available": 7 }] }
  ```
- 409 khách bị chặn: `{ "message": "Ngô Thanh Vy đang bị chặn đặt hàng: Bom hàng.", "customerId": "cus-889900", "blocked": true }`

### `PUT /admin/orders/:id`

Sửa đơn (drawer Sửa đơn). Không sửa được đơn Hoàn tất hoặc đã hủy.

| Trường | Bắt buộc | Ghi chú |
|---|---|---|
| `customer`, `shippingAddress`, `readyDate` | ✔ | |
| `shippingMethod`, `shippingFee`, `carrierId` | | Bỏ trống = giữ. Đổi đơn vị vận chuyển chỉ khi chưa giao |
| `lines`, `discountCode` | | **Chỉ khi** đơn còn Chờ thanh toán / Đã thanh toán. Bỏ `lines` = giữ sản phẩm và mã |
| `note`, `internalNote` | | |

Khi đổi sản phẩm:
- Kiểm tra lại Kho. Phần đơn này đang giữ được tính là dùng được.
- Tính lại giảm giá. Mã cũ của đơn bỏ qua hạn dùng và số lượt, chỉ kiểm tra lại đơn tối thiểu và phạm vi.
- Đổi mã thì trả lượt mã cũ, tính lượt mã mới.

Đơn còn Chờ thanh toán: khoản đang chờ thu đổi theo tổng mới. Số điện thoại mới chưa có hồ sơ thì tạo hồ sơ.

**Trả về 200:** `{ "order": Order, "changes": ["Sản phẩm: Nến cam ×1", "Bỏ mã giảm giá", "Tổng 768.000 ₫ → 280.000 ₫"] }`. Không có thay đổi thì `changes: []` và không ghi lịch sử. Số tiền định dạng như BO: dấu cách trước ₫ là dấu cách không ngắt.

**Lỗi:**
- 400 `"Đơn đã bắt đầu làm — không sửa sản phẩm được nữa."`
- 400 `"Đơn đã hoàn tất hoặc đã hủy — không sửa được."`
- Lỗi mã giảm giá, Kho như `POST`.

### `POST /admin/orders/:id/advance`

Chuyển bước kế tiếp. Không gửi body.

| Từ → tới | Kèm theo |
|---|---|
| `pending` → `paid` | Khoản đang chờ thành công. Bắt đầu giữ nguyên liệu |
| `paid` → `producing` | **Trừ Kho** theo công thức × số lượng (mỗi nguyên liệu một phiếu `order`, ghi chú "Đơn SC…"), chốt `materialCost` theo giá nhập lúc này. Thiếu tồn thực tế thì 409 kèm `shortages` |
| `producing` → `ready` | |
| `shipping` → `completed` | Còn thiếu tiền thì ghi đã thu phần còn lại (khoản `cod`, lịch sử "Thu nốt … khi giao") |

Từ `ready` phải gọi `/ship`, vì cần đơn vị và mã vận đơn.

**Trả về 200:** `Order`.

### `POST /admin/orders/:id/ship`

Giao cho vận chuyển: `ready` → `shipping`.

| Trường | Ghi chú |
|---|---|
| `carrierId` | Bỏ trống = đơn vị chọn lúc tạo đơn |
| `trackingCode` | Bỏ khoảng trắng, viết hoa. Bắt buộc nếu đơn vị đòi mã (Cài đặt). Không trùng đơn khác chưa hủy |
| `cost` | Phí shop trả đơn vị cho lượt này, cộng vào `shippingCost` |

`trackingUrl` dựng từ link tra cứu của đơn vị ở Cài đặt.

**Trả về 200:** `Order`.

**Lỗi:**
- 400 `"Nhập mã vận đơn của Giao Hàng Nhanh."`
- 400 `"Chọn đơn vị vận chuyển."`
- 409 `{ "message": "Mã vận đơn GHN1 đã dùng cho đơn SC…", "orderId": "…" }`

### `PUT /admin/orders/:id/shipment`

Sửa đơn vị, mã vận đơn hoặc phí của lượt giao hiện tại. Gửi lên giống `/ship`; bỏ `carrierId` thì giữ đơn vị. Phí đổi thì bù phần chênh vào `shippingCost`. Lịch sử ghi "Đổi vận chuyển: cũ → mới".

**Trả về 200:** `Order`. **Lỗi:** như `/ship`; 400 khi đơn chưa giao.

### `POST /admin/orders/:id/delivery-failed`

Giao không thành, từ `shipping`. **Gửi lên:** `{ "reason": "Không nghe máy" }`.

Tăng `deliveryAttempts`; lịch sử ghi "Lần 1/3: …". Đủ số lần giao tối đa ở Cài đặt thì tự chuyển `returning` ("Hết 3 lần giao").

**Trả về 200:** `Order`.

### `POST /admin/orders/:id/redeliver`

Giao lại, `delivery_failed` → `shipping`. **Trả về 200:** `Order`.

### `POST /admin/orders/:id/return`

Cho hoàn về, `delivery_failed` → `returning`. **Trả về 200:** `Order`.

### `POST /admin/orders/:id/receive-return`

Hàng đã về shop, `returning` → `returned`.

| Trường | Bắt buộc | Ghi chú |
|---|---|---|
| `condition` | ✔ | `"good"` (nến còn tốt) \| `"damaged"` |
| `note` | | |
| `returnFee` | | Phí hoàn hàng shop trả, cộng vào `shippingCost` |

**Trả về 200:** `Order`.

### `POST /admin/orders/:id/resend`

Gửi lại đơn đã hoàn về: `returned` → `shipping`, chọn lại đơn vị và mã vận đơn.

Gửi lên như `/ship`, thêm `fee`: phí khách trả thêm. Bỏ trống `fee` = phí gửi lại ở Cài đặt.

Kèm theo:
- `fee` cộng vào `shippingFee`, `total` và `resendFee`.
- `cost` cộng vào `shippingCost`.
- Đếm lại số lần giao, bỏ tình trạng hoàn về.

**Trả về 200:** `Order`.

### `PATCH /admin/orders/:id/ready-date`

Đổi ngày làm xong, khi đơn còn `pending`, `paid` hoặc `producing`. **Gửi lên:** `{ "readyDate": "2026-11-22" }`. Lịch sử ghi "Ngày làm xong mới: 22/11/2026".

**Trả về 200:** `Order`.

### `PATCH /admin/orders/:id/internal-note`

**Gửi lên:** `{ "internalNote": "Gọi trước 30 phút" }`. Gửi `""` thì xóa. Không ghi lịch sử. **Trả về 200:** `Order`.

### `POST /admin/orders/:id/cancel`

Hủy đơn khi đang `pending`, `paid`, `producing`, `ready` hoặc `returned`.

| Trường | Khi nào bắt buộc | Ghi chú |
|---|---|---|
| `reason` | Luôn | |
| `outcome` | Đơn `producing` có nến tự phối, hoặc đã trừ Kho | `"returned"`: chưa làm, hoàn nguyên liệu. `"stocked"`: đã làm, chỉ dùng khi có nến tự phối. `"consumed"`: đã làm, chỉ dùng khi đơn toàn nến có sẵn |
| `fault` | Khách đã trả tiền | `"shop"`: hoàn hết số đã thu. `"customer"`: giữ cọc, hoàn phần vượt cọc |

Tự xử lý:
- Nến tự phối đã làm xong (đơn `ready`, hoặc `returned` còn tốt) thì `outcome` luôn là `stocked`.
- `returned`: hoàn **đúng lượng đã trừ** theo phiếu của đơn (phiếu Nhập thêm "Hoàn kho do hủy đơn").
- `stocked`: mỗi dòng nến tự phối thành một bản ghi Sản phẩm hủy đơn.
- Trả lượt mã giảm giá. Phần đang giữ tự nhả.
- `refundDue` = số phải hoàn theo `fault`.

```json
{ "reason": "Hết hũ đẹp", "outcome": "returned", "fault": "shop" }
```

**Trả về 200:** `{ "order": Order, "restored": 2, "stocked": 0 }`: số nguyên liệu được hoàn, số bản ghi Sản phẩm hủy đơn vừa tạo.

**Lỗi 400:**
- `"Chọn đã làm hay chưa để xử lý Kho."`
- `"Chọn lỗi do ai để tính tiền hoàn."`
- `"Đơn có nến tự phối: chọn hoàn nguyên liệu hoặc chuyển sang Sản phẩm hủy đơn."`
- `"Chỉ hủy được trước khi giao, hoặc sau khi hàng đã hoàn về shop."`

### `POST /admin/orders/:id/refund`

Ghi khoản đã hoàn cho khách sau khi hủy (đơn có `refundDue`). Chỉ ghi được một lần.

**Gửi lên:** `{ "amount": 369000, "images": ["<ảnh chứng từ>"], "note": "Chuyển khoản" }`. `amount` ≥ 1 và không quá số đã thu.

**Trả về 200:** `Order` (có `refund`). **Lỗi 400:** `"Đơn không có khoản cần hoàn."`, `"Đơn đã ghi hoàn tiền."`, `"Không hoàn quá số đã thu (…)."`

### `POST /admin/orders/:id/refund-overpaid`

Hoàn phần thu dư, khi sửa đơn bớt hàng sau khi khách đã trả. Gửi lên giống `/refund`, `amount` không quá phần dư. Ghi một khoản âm `kind: "refund"`.

**Trả về 200:** `Order`. **Lỗi 400:** `"Đơn không thu dư."`, `"Chỉ thu dư …"`

### `POST /admin/orders/:id/complaints`

Khiếu nại sau khi giao, chỉ với đơn `completed`.

| Trường | Bắt buộc | Ghi chú |
|---|---|---|
| `reason` | ✔ | |
| `images` | | Ảnh khách gửi |
| `resolution` | ✔ | `"resend"` gửi bù \| `"refund"` hoàn một phần \| `"none"` chỉ ghi nhận |
| `refundAmount`, `refundImages`, `refundNote` | với `refund` | Tối đa số shop đang giữ của đơn. Ghi khoản âm `kind: "refund"` |
| `picks`, `readyDate` | với `resend` | `picks: [{ itemId, quantity }]`: các cây gửi bù |

Gửi bù tạo **đơn mới 0 ₫** (`replacementFor` trỏ về đơn gốc). Đơn này vào thẳng Đã thanh toán, nên giữ nguyên liệu và đi qua đủ các bước làm, giao. Kho phải đủ, không thì 409.

**Trả về 201:** `{ "order": Order, "replacement": Order | undefined }`

**Lỗi 400:** `"Chỉ ghi khiếu nại cho đơn Hoàn tất."`, `"Nhập số tiền hoàn."`, `"Hoàn tối đa …"`, `"Chọn ít nhất một cây để gửi bù."`, `"Chọn ngày làm xong của đơn gửi bù."`

### `GET /admin/stock-holds`

Nguyên liệu đang giữ cho các đơn Đã thanh toán. Tồn dùng được = tồn − đang giữ.

**Trả về 200:** `{ "soy": 390, "jar": 3 }` (`materialId` → lượng).

---

## Đơn nháp, thông báo đã đọc

Trạng thái phụ của BO, lưu trên máy chủ thay vì từng trình duyệt.

### `GET /admin/order-draft`

Đơn đang tạo dở trong form Tạo đơn. **Trả về 200:** `{ "values": { … }, "savedAt": "…" }`, hoặc rỗng khi không có nháp.

### `PUT /admin/order-draft`

**Gửi lên:** `{ "values": { "name": "Vy", "lines": [ … ], "readyDate": "2026-11-20" } }`: giá trị form, BE lưu nguyên. Đơn nháp không giữ nguyên liệu, không tính lượt mã.

**Trả về 200:** như `GET`.

### `DELETE /admin/order-draft`

**Trả về 204.**

### `GET /admin/notifications/read`

**Trả về 200:** `string[]`: id các thông báo đã đọc. Thông báo do BO tự suy ra từ đơn, kho, mã giảm giá.

### `POST /admin/notifications/read`

**Gửi lên:** `{ "ids": ["low-soy", "order-1"] }`. Id đã có thì bỏ qua. **Trả về 200:** `string[]`, danh sách đã đọc sau khi thêm.

---

## Xóa toàn bộ dữ liệu

### `POST /admin/reset`

Xóa mọi dữ liệu BO trong một giao dịch: đơn hàng (kèm khoản thu, lịch sử, khiếu nại), sản phẩm, danh mục, kho và phiếu kho, khách hàng, mã giảm giá, sản phẩm hủy đơn, Thủ công, cài đặt, đơn nháp, thông báo đã đọc. **Giữ** đăng nhập: PIN nằm ở biến môi trường, bảng `LoginGuard` (khóa khi nhập sai) không đụng tới. Lần `GET` cài đặt sau đó tự tạo lại giá trị mặc định. Thủ công ghi sẵn bản đã lưu gồm các bước của cấu hình mẫu, không có lựa chọn nào (bước Cá nhân hóa giữ ô nhập chữ, bỏ tuỳ chọn thêm).

**Gửi lên:** `{ "confirm": "XÓA HẾT" }` — đúng câu này (bỏ khoảng trắng đầu cuối, không phân biệt hoa thường) để không lỡ tay gọi nhầm.

**Trả về 204.** **Lỗi:** 400 `"Gõ đúng \"XÓA HẾT\" để xác nhận."` (thiếu / sai câu); 401 chưa đăng nhập.
