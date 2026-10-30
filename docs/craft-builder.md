# Trình dựng nến Thủ công: đặc tả cấu hình

> **Trạng thái:** bản nháp, chưa có BE. BO đã dựng xong giao diện và đang lưu cấu hình trên trình duyệt (`localStorage`, khóa `bo-craft-builder-v3`). Tài liệu này là hợp đồng dữ liệu để làm BE (lưu/trả cấu hình, kiểm tra đơn) và để storefront dựng trang Thủ công theo cấu hình.
>
> **Nguồn sự thật trong code:** kiểu dữ liệu ở [`bo/src/lib/craft/types.ts`](../bo/src/lib/craft/types.ts), cấu hình mặc định ở [`bo/src/lib/craft/default-config.ts`](../bo/src/lib/craft/default-config.ts), quy tắc kiểm tra ở `validateConfig` trong [`bo/src/lib/craft/steps.ts`](../bo/src/lib/craft/steps.ts). Nếu tài liệu và code lệch nhau, code ở BO đúng. Hãy sửa tài liệu cho khớp.
>
> Có thể lấy một file cấu hình thật bằng nút **Xuất JSON** trên trang Thủ công của BO.

## 1. Luồng dữ liệu

```
BO (admin dựng các bước) ──PUT──▶ BE (kiểm tra, lưu) ──GET──▶ Web (dựng trang Thủ công)
                                       ▲                          │
                                       └──── POST đơn hàng ◀──────┘
                                  (BE tính lại giá + kiểm tra lựa chọn)
```

- Admin tạo các **bước** theo thứ tự. Mỗi bước dùng một trong 5 **component** có sẵn.
- Web **không có danh sách bước cứng**. Web đọc `steps` và dựng từng bước theo `kind`.
- Giá trên web chỉ là ước tính. **BE phải tính lại giá và kiểm tra lựa chọn khi tạo đơn**, không tin số client gửi lên.

## 2. Khái niệm

| Thuật ngữ | Nghĩa |
|---|---|
| Cấu hình (`CraftConfig`) | Toàn bộ trang Thủ công: danh sách bước theo thứ tự hiển thị. |
| Bước (`CraftStep`) | Một mục khách đi qua, vd "Sáp". Có `kind` quyết định giao diện và cách chọn. |
| Component (`kind`) | `vessel`, `cards`, `swatches`, `blend`, `inputs`. Xem mục 4. |
| Lựa chọn (`StepOption`) | Một mục trong bước, vd "Sáp đậu nành". Có giá phụ thu và tồn kho. |
| Lựa chọn của khách (`CraftSelection`) | Những gì khách đã chọn ở từng bước. Gửi lên khi thêm giỏ và đặt đơn. Xem mục 6. |

Tiền là **VNĐ, số nguyên (đồng)** ở mọi nơi.

## 3. Định dạng JSON

### 3.1 `CraftConfig`

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `version` | `1` | Tăng khi đổi cấu trúc. BE/web gặp phiên bản lạ thì từ chối. |
| `currency` | `"VND"` | Cố định. |
| `steps` | `CraftStep[]` | Thứ tự trong mảng = thứ tự hiển thị trên web. |
| `updatedAt` | `string?` (ISO) | BO tự đặt mỗi lần sửa. BE ghi đè bằng giờ server khi lưu. |

### 3.2 Trường chung của mọi bước

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | `string` | Duy nhất trong cấu hình, dạng slug (`wax`, `phu-kien-kem`). **Cố định sau khi tạo**: lựa chọn của khách, đơn hàng và quy tắc `onlyWith` đều trỏ tới id này. |
| `kind` | `StepKind` | Xem mục 4. |
| `title` | `{ vi, en }` | Tên bước. |
| `hint` | `{ vi, en }?` | Dòng mô tả nhỏ dưới tên. |
| `icon` | `StepIcon` | Một trong `vessel, layers, flower, flame, palette, sparkles, pen, gift, tag, box`. Mỗi bên tự ánh xạ sang bộ icon của mình (xem mục 10). |
| `enabled` | `boolean` | `false` = ẩn khỏi web, giữ dữ liệu. Bước mới tạo mặc định `false`. |
| `required` | `boolean` | Khách phải chọn (với `inputs`: phải nhập ít nhất một ô hoặc tích một tuỳ chọn) trước khi thêm giỏ. |

### 3.3 `StepOption`: lựa chọn (dùng cho `vessel`, `cards`, `swatches`, `blend`)

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | `string` | Duy nhất trong bước. Cố định sau khi tạo. |
| `name` | `{ vi, en }` | |
| `description` | `{ vi, en }?` | |
| `priceDelta` | `number` | Phụ thu mỗi hũ (≥ 0). |
| `available` | `boolean` | `false` = shop tạm ẩn. Web không hiện mục này. |
| `stock` | `number` | Tồn kho theo `unit`. **`>= 99999` nghĩa là không theo dõi** (vd "Không mùi"). |
| `unit` | `"g" \| "pcs"` | Luôn bằng `unit` của bước. Riêng `vessel` luôn là `pcs`. |
| `swatch` | `string?` | Mã màu hex. Dùng khi không có ảnh. Với `swatches`, không có màu nghĩa là "không pha màu" (web vẽ ô sọc). |
| `images` | `string[]?` | Ảnh thật, ảnh đầu là ảnh chính. **Hiện BO lưu ảnh dạng `data:image/webp;base64`**. Khi có BE cần đổi sang URL (xem mục 9.4). |
| `look` | `string?` | Kiểu vẽ trên ảnh minh họa khi bước có `previewRole` (xem mục 5). |
| `onlyWith` | `{ [stepId]: optionId[] }?` | Chỉ chọn được khi bước `stepId` đang chọn một trong các mục này. Bỏ trống nghĩa là không giới hạn. Vd bấc gỗ chỉ dùng với một số hũ và sáp. |
| `maxGrams` | `number?` | Không dùng được cho nến nặng hơn số gram này. |
| `exclusive` | `boolean?` | Chỉ dùng ở `blend`: chọn mục này thì không phối thêm mục khác (vd "Không mùi"). |

## 4. Năm component

### 4.1 `vessel`: Hũ & kích thước

Mỗi cấu hình có **đúng 1** bước loại này. Bước này luôn bật, luôn bắt buộc và **quyết định giá gốc**.

Trường riêng của bước:

- `sizes: SizeOption[]`. Mỗi kích thước gồm:
  - `id`, `grams`
  - `burnHours?`: chỉ hiện khi xưởng đã đo thực tế
  - `basePrice`: **giá gốc của cây nến**
  - `available`

Trường riêng của lựa chọn (`VesselOption`, mở rộng từ `StepOption`):

| Trường | Ghi chú |
|---|---|
| `shape` | `tumbler \| jar \| tin \| bowl`: dáng hũ, web dùng để vẽ ảnh minh họa. |
| `translucent?` | Hũ trong suốt, ảnh minh họa thấy được màu sáp. |
| `supportedSizeIds` | Các kích thước đổ được (id trong `sizes`). |
| `lid` | `{ priceDelta, stock, unit: "pcs" }` hoặc `null` (không có nắp). |

**Web hiển thị:** thẻ hũ (ảnh minh họa dáng hũ), rồi chọn có nắp hay không (chỉ khi hũ có `lid`), rồi kích thước. Kích thước hũ không hỗ trợ thì làm mờ và ghi "Không hợp với hũ này".

**Lựa chọn của khách:** `{ optionId, sizeId, withLid }`.

### 4.2 `cards`: Thẻ lựa chọn

Ví dụ: Sáp, Bấc, Trang trí.

| Trường | Ghi chú |
|---|---|
| `multiple` | `true` = chọn nhiều (checkbox), `false` = chọn một (radio). |
| `maxSelect?` | Khi `multiple`: số mục tối đa. Bỏ trống = không giới hạn. |
| `previewRole?` | `waxColor \| wick \| decoration` (mục 5). |
| `unit` | `pcs`: mỗi hũ dùng 1. `g`: mỗi hũ dùng `gramsPerGram × khối lượng nến` gram. |
| `gramsPerGram?` | Mặc định 1 (vd sáp: nến 150g cần 150g sáp). |

**Web hiển thị:** lưới thẻ (ảnh, hoặc màu nếu không có ảnh; tên, mô tả, phụ thu), dấu tick khi chọn. Thẻ hết hàng hoặc không tương thích thì bị khóa và có nhãn lý do.

**Lựa chọn của khách:** `{ optionIds: string[] }`. Chọn một thì mảng có 1 phần tử.

### 4.3 `swatches`: Bảng màu

Ví dụ: Màu sáp. Trường riêng giống `cards` (`previewRole?` chỉ nhận `waxColor`, `unit`, `gramsPerGram?`) nhưng **luôn chọn một**.

**Web hiển thị:** ô màu tròn kèm tên và phụ thu. Lựa chọn không có `swatch` vẽ ô sọc (không pha màu).

**Lựa chọn của khách:** `{ optionIds: [id] }`.

### 4.4 `blend`: Phối tỉ lệ

Ví dụ: Mùi hương.

| Trường | Ghi chú |
|---|---|
| `maxBlend` | Số mục phối tối đa trong 1 hũ. `1` = chọn một, không có thanh tỉ lệ. |
| `intensity` | `null` = không cho chọn độ đậm. Nếu có: `{ priceDelta: {light, medium, strong}, load: {light, medium, strong} }`. `load` = gram tinh dầu trên gram sáp (vd 0.08 = 8%). |
| `unit` | Thường là `g`. |

**Web hiển thị:** lưới thẻ chọn nhiều. Khi chọn từ 2 mục, hiện thanh tỉ lệ cho từng mục (10–100, bước 5) và thanh màu tổng. Khi có `intensity`, hiện 3 nút Nhẹ / Vừa / Đậm. Chọn mục `exclusive` thì bỏ các mục khác và ẩn độ đậm.

**Lựa chọn của khách:** `{ items: [{ optionId, weight }], intensity: "light" | "medium" | "strong" | null }`. `weight` là tỉ lệ tương đối, quy ra % theo mục 7.1.

### 4.5 `inputs`: Ô nhập & tuỳ chọn thêm

Ví dụ: Cá nhân hóa. Bước này không có `options`, thay vào đó có:

- `fields: TextFieldDef[]`. Mỗi ô gồm:
  - `id`, `label {vi,en}`, `placeholder? {vi,en}`
  - `maxLength`
  - `priceDelta`: tính khi khách có nhập
  - `enabled`
  - `multiline?`
  - `onLabel?`: in chữ lên nhãn trong ảnh minh họa
- `addons: AddonDef[]`. Mỗi tuỳ chọn gồm:
  - `id`, `name`, `description?`
  - `priceDelta`
  - `available`, `enabled`
  - `stock`, `unit: "pcs"`

Id của ô nhập và tuỳ chọn phải duy nhất trong bước.

**Web hiển thị:** các ô nhập đang `enabled`, kèm bộ đếm ký tự `n/maxLength`. Các tuỳ chọn đang `enabled` hiện dạng checkbox; tuỳ chọn hết hàng thì khóa.

**Lựa chọn của khách:** `{ values: { [fieldId]: string }, addons: string[] }`.

## 5. Ảnh minh họa cây nến (`previewRole`)

Web vẽ ảnh minh họa bằng SVG (`fe/src/components/customizer/candle-preview.tsx`). Mỗi phần của ảnh lấy dữ liệu như sau:

| Phần trên ảnh | Lấy từ |
|---|---|
| Dáng hũ, màu hũ, độ trong | Lựa chọn của bước `vessel`: `shape`, `swatch`, `translucent`. |
| Màu sáp | Các bước có `previewRole: "waxColor"`. Duyệt theo thứ tự bước, **bước sau ghi đè bước trước** nếu lựa chọn đang chọn có `swatch`. Không có thì dùng `#f6efe2`. (Mặc định: bước Sáp cho màu nền, bước Màu sáp ghi đè; chọn "Không màu" thì giữ màu sáp.) |
| Kiểu bấc | Bước đầu tiên có `previewRole: "wick"`: `look` của lựa chọn (`cotton` hoặc `wood`). Mặc định `cotton`. |
| Trang trí | Bước đầu tiên có `previewRole: "decoration"`: `look` của lựa chọn (`flowers`, `pattern` hoặc `topper`). Không có thì không vẽ. |
| Chữ trên nhãn | Ô nhập đầu tiên có `onLabel: true` và khách đã nhập. |

Giá trị `look` hợp lệ theo vai trò:

- `wick`: `cotton`, `wood`
- `decoration`: `flowers`, `pattern`, `topper`

Muốn thêm kiểu mới thì phải bổ sung hình vẽ ở web trước.

## 6. Lựa chọn của khách (`CraftSelection`)

Web gửi kèm dòng giỏ hàng và khi tạo đơn:

```ts
type CraftSelection = {
  // updatedAt của cấu hình lúc khách chọn — BE dùng để biết khách đang xem bản cũ
  configUpdatedAt: string;
  steps: Record<string /* stepId */, StepSelection>;
};

type StepSelection =
  | { kind: "vessel"; optionId: string; sizeId: string; withLid: boolean }
  | { kind: "cards" | "swatches"; optionIds: string[] }
  | { kind: "blend"; items: { optionId: string; weight: number }[]; intensity: "light" | "medium" | "strong" | null }
  | { kind: "inputs"; values: Record<string, string>; addons: string[] };
```

- Bước không bắt buộc mà khách bỏ qua thì không có khóa trong `steps`.
- Bước đang ẩn (`enabled: false`) bị bỏ qua dù client có gửi.
- Link "Lưu cấu hình" của web mã hóa `CraftSelection` vào `?config=` (base64 JSON).

**Đơn hàng phải lưu bản chụp** (`snapshot`), vì admin có thể sửa hoặc xóa bước sau này. Bản chụp gồm:

- `selection`
- mô tả đã dịch `{ vi, en }`, vd `"Hũ gốm · 150g · Sáp đậu nành · Vanilla 70% / Lavender 30%"`
- các dòng giá `[{ stepId, label, amount }]`
- giá đơn vị lúc đặt

Trang đơn hàng trên BO hiển thị từ bản chụp này, không đọc lại cấu hình.

## 7. Tính giá

BE phải tính lại đúng cách này khi tạo đơn. Web tính y hệt để hiện giá ước tính.

```
giá 1 hũ = size.basePrice
         + vessel: option.priceDelta + (withLid ? option.lid.priceDelta : 0)
         + cards / swatches: tổng priceDelta các mục đã chọn
         + blend: round( Σ(option.priceDelta × percent) / 100 ) + (intensity ? intensity.priceDelta[level] : 0)
         + inputs: Σ field.priceDelta (ô có value.trim() khác rỗng) + Σ addon.priceDelta (tuỳ chọn đã tích)
tổng dòng = giá 1 hũ × số lượng
```

### 7.1 Quy `weight` ra phần trăm (blend)

Chia theo tỉ lệ rồi làm tròn sao cho **tổng luôn bằng 100**, dùng phương pháp phần dư lớn nhất:

1. `raw_i = weight_i / Σweight × 100`, `p_i = floor(raw_i)`.
2. Phần còn thiếu `100 − Σp_i` chia lần lượt +1 cho các mục có phần lẻ `raw_i − p_i` lớn nhất.

Code tham chiếu: `fragranceShares` trong `fe/src/lib/customizer/options.ts`.

## 8. Tồn kho & số lượng tối đa

Mỗi lựa chọn đang chọn tiêu hao một lượng cho mỗi hũ (`grams` = khối lượng của kích thước đã chọn):

| Nguồn | Lượng mỗi hũ |
|---|---|
| Lựa chọn `vessel` | 1 |
| Nắp (`withLid`) | 1 |
| `cards` / `swatches`, `unit: "pcs"` | 1 |
| `cards` / `swatches`, `unit: "g"` | `grams × (gramsPerGram ?? 1)` |
| `blend` (mục không `exclusive`) | `grams × load × percent / 100`. `load` = `intensity.load[level]`, mặc định 0.08 nếu không có độ đậm. |
| Addon | 1 |

- **Số lượng tối đa** khách đặt được = `min( floor(stock / lượng mỗi hũ) )` trên mọi nguồn. Mục có `stock >= 99999` không tính.
- Web hiện "Chỉ còn đủ làm N hũ" khi N ≤ 5, và khóa nút thêm giỏ khi N = 0.
- **BE trừ kho khi đơn chuyển sang "đã thanh toán"** (hoặc giữ chỗ khi tạo đơn, tùy quyết định nghiệp vụ). Phải trừ trong transaction và kiểm tra lại `stock` để tránh bán âm.

## 9. Quy định cho BE

### 9.1 API đề xuất

| Method | Đường dẫn | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/api/shop-config/craft` | Công khai | Cấu hình cho web. **Bỏ** các bước `enabled: false`, lựa chọn `available: false`, ô nhập và tuỳ chọn `enabled: false`. Cho cache ngắn (vd 60 giây) và trả `ETag`. |
| `GET` | `/api/admin/shop-config/craft` | Admin | Cấu hình đầy đủ cho BO. |
| `PUT` | `/api/admin/shop-config/craft` | Admin | Ghi đè cả cấu hình. Body là `CraftConfig`. Header `If-Match: <updatedAt đang sửa>`; nếu không khớp bản hiện tại thì trả `409` để BO báo "có người khác vừa sửa". Thành công thì trả cấu hình đã lưu, với `updatedAt` mới. |
| `POST` | `/api/admin/uploads` | Admin | Upload ảnh lựa chọn, trả URL (xem mục 9.4). |
| `GET` | `/api/admin/shop-config/craft/revisions` | Admin | *(Tùy chọn)* Lịch sử để khôi phục bản trước. |

Hiện fe gọi `GET /api/shop-config` trả cả `{ customizer, production, payment, contact }` (`fe/src/lib/shop-config.ts`). Có thể giữ endpoint gộp đó và thay khóa `customizer` bằng `CraftConfig`, hoặc tách riêng `/craft` như bảng trên. Chọn một cách và cập nhật cả fe.

### 9.2 Lưu trữ (Prisma, gợi ý)

```prisma
model ShopSetting {
  key       String   @id          // "craft"
  value     Json                  // CraftConfig
  updatedAt DateTime @updatedAt
  updatedBy String?               // userId admin
}

// Tùy chọn — giữ lịch sử để khôi phục
model ShopSettingRevision {
  id        String   @id @default(cuid())
  key       String
  value     Json
  createdAt DateTime @default(now())
  createdBy String?
  @@index([key, createdAt])
}
```

- Khi chưa có bản ghi `craft`, BE trả nội dung của `bo/src/lib/craft/default-config.ts` (có thể chép thành seed).
- Lưu cả cấu hình dạng JSON là đủ. Dữ liệu nhỏ (vài chục lựa chọn), luôn đọc và ghi trọn gói.

### 9.3 Kiểm tra khi `PUT` (từ chối `400` kèm danh sách lỗi)

**Cấu trúc:**

- `version === 1`, `currency === "VND"`.
- `kind` thuộc 5 giá trị đã định nghĩa; `icon` thuộc danh sách icon.
- `previewRole` hợp lệ theo `kind`:
  - `cards`: `waxColor`, `wick`, `decoration`
  - `swatches`: `waxColor`
  - `vessel`, `blend`, `inputs`: không có
- Id bước dạng slug `^[a-z0-9]+(-[a-z0-9]+)*$`. Id lựa chọn, ô nhập, tuỳ chọn dạng `^[A-Za-z0-9-]+$`.
- Không trùng id: bước trong cấu hình; lựa chọn, ô nhập và tuỳ chọn trong cùng một bước.
- Mọi số tiền và tồn kho là số nguyên ≥ 0.
- `maxLength` từ 1 đến 500; `maxBlend` từ 1 đến 4; `load` từ 0 đến 0.3.
- `unit` của lựa chọn bằng `unit` của bước.

**Nghiệp vụ** (giống các lỗi mức `error` trong `validateConfig` ở BO):

- Có đúng 1 bước `vessel`, và bước đó `enabled` + `required`.
- Bước `vessel` có ít nhất 1 kích thước `available`.
- Có ít nhất 1 bước `enabled`.
- Bước `enabled` + `required` phải còn ít nhất 1 lựa chọn đang bán và còn hàng.
- `supportedSizeIds` chỉ chứa id có trong `sizes`.

**Cảnh báo** (cho lưu nhưng trả kèm `warnings`):

- `onlyWith` trỏ tới bước hoặc lựa chọn không còn tồn tại. Nên tự gỡ phần đó khi lưu.
- Bước `enabled` mà chưa có lựa chọn nào.

**Đổi tên id:** không cho đổi id bước và id lựa chọn đã có, vì đơn hàng và link đã lưu đang dùng chúng. Muốn bỏ thì tắt `enabled` / `available`, hoặc xóa.

### 9.4 Ảnh

- BO hiện nén ảnh sang webp (tối đa 800px) và nhúng `data:` URL vào JSON. Cách này chỉ dùng tạm cho bản nháp.
- Khi có BE: BO upload từng ảnh qua `POST /api/admin/uploads` rồi lưu URL vào `images`.
- `PUT` nên từ chối `data:` URL, hoặc tự tách ra để upload.

### 9.5 Kiểm tra khi tạo đơn có nến tự phối

Với từng dòng nến tự phối, BE tải cấu hình hiện tại rồi kiểm tra `CraftSelection`:

1. Mỗi bước `enabled` + `required` có lựa chọn. Bước `inputs` bắt buộc phải có ít nhất một ô có chữ hoặc một tuỳ chọn được tích.
2. Mọi `optionId`, `sizeId`, `fieldId`, `addonId` tồn tại, đang bán (`available` / `enabled`) và đủ tồn kho cho số lượng đặt (mục 8).
3. Bước `vessel`:
   - kích thước đã chọn `available` và nằm trong `supportedSizeIds` của hũ;
   - `withLid` chỉ hợp lệ khi hũ có `lid` và nắp còn hàng.
4. Bước `cards`:
   - nếu `multiple: false` thì chọn tối đa 1 mục;
   - nếu `multiple: true` thì số mục chọn không vượt `maxSelect`.
   
   Bước `swatches`: chọn đúng 1 mục.
5. Bước `blend`:
   - chọn từ 1 tới `maxBlend` mục, `weight` từ 10 đến 100;
   - mục `exclusive` phải đứng một mình;
   - `intensity` phải là `null` khi cấu hình không có độ đậm hoặc khi chọn mục `exclusive`.
6. Bước `inputs`: độ dài từng ô ≤ `maxLength` (cắt khoảng trắng hai đầu).
7. `onlyWith`: với mỗi bước được nhắc tới (nếu bước đó `enabled` và khách có chọn), **mọi** mục khách chọn ở bước đó phải nằm trong danh sách cho phép.
8. `maxGrams`: không nhỏ hơn số gram của kích thước đã chọn.
9. Tính lại giá theo mục 7, ghi bản chụp theo mục 6, rồi trừ hoặc giữ tồn kho theo mục 8.

Nếu `configUpdatedAt` cũ hơn cấu hình hiện tại thì vẫn kiểm tra theo cấu hình hiện tại. Lựa chọn nào không còn hợp lệ thì trả `409` kèm danh sách `{ stepId, code }`, để web báo khách chọn lại.

Mã lỗi: `required`, `unavailable`, `incompatible`, `tooLong`, `tooMany`, `outOfStock`. Đây cũng là các mã web đang dùng (`fe/src/lib/customizer/types.ts`).

## 10. Ánh xạ icon

| `icon` | BO (antd) | Web (lucide, gợi ý) |
|---|---|---|
| `vessel` | `CoffeeOutlined` | `Amphora` |
| `layers` | `BlockOutlined` | `Layers` |
| `flower` | `ExperimentOutlined` | `Flower2` |
| `flame` | `FireOutlined` | `Flame` |
| `palette` | `BgColorsOutlined` | `Palette` |
| `sparkles` | `StarOutlined` | `Sparkles` |
| `pen` | `EditOutlined` | `PenLine` |
| `gift` | `GiftOutlined` | `Gift` |
| `tag` | `TagOutlined` | `Tag` |
| `box` | `InboxOutlined` | `Box` |

## 11. Việc cần làm ở storefront (fe) khi nối

1. **Tiền tệ:** fe đang hiển thị USD (đơn vị cent: `formatMoney` trong `fe/src/lib/customizer/pricing.ts`, `formatPrice` trong `fe/src/lib/data.ts`). Cấu hình này dùng VNĐ, nên cần chuyển fe sang VNĐ (cả sản phẩm, giỏ hàng, checkout) trước hoặc cùng lúc.
2. **Bỏ 7 nhóm cố định:** `groupIds`, `CustomizerCatalog`, `CandleConfiguration` cùng các component `container-group`, `wax-group`, … được thay bằng một bộ dựng chung: đọc `steps` và render component theo `kind`. Đổi tương ứng:
   - `options.ts`, `pricing.ts`, `validation.ts`, `snapshot.ts` theo các mục 5–8;
   - `customization-progress.tsx`, `configuration-summary.tsx` theo `steps`;
   - tên bước và mô tả lấy từ cấu hình (`title`, `hint`), không lấy từ file dịch.
3. **Giỏ hàng cũ:** dòng nến tự phối lưu theo định dạng cũ (`CandleConfiguration`) cần bỏ khi nâng cấp. Tăng `version` của store giỏ hàng trong `fe/src/stores/cart-store.ts`.
4. **Link "Lưu cấu hình" cũ** (`?config=` định dạng cũ) giải mã không được: bỏ qua và dùng lựa chọn mặc định.
5. **Lựa chọn mặc định khi mở trang:**
   - mỗi bước bắt buộc chọn sẵn mục đầu tiên đang bán, còn hàng và tương thích;
   - bước `blend` chọn 1 mục không `exclusive`, `weight` 50, độ đậm `medium` nếu có;
   - bước không bắt buộc để trống.

## 12. Những gì BO đã có (để đối chiếu)

- **Danh sách bước:**
  - thêm bước bằng cách chọn component (có hình minh họa);
  - đổi thứ tự bằng nút lên/xuống;
  - bật/tắt hiển thị;
  - bước có lỗi cấu hình có chấm cảnh báo.
- **Mỗi bước có các tab:**
  - **Lựa chọn**: bảng + drawer sửa. Trường hiện theo component: dáng hũ và nắp, kiểu minh họa, "không phối thêm", tương thích `onlyWith` / `maxGrams`.
  - **Kích thước**: chỉ có ở bước hũ.
  - **Ô nhập & tuỳ chọn**: chỉ có ở bước inputs.
  - **Cài đặt**: tên, mô tả, icon, bắt buộc, chọn nhiều, vai trò minh họa, cách trừ kho, phối tối đa, độ đậm, xóa bước.
  - **Xem trước**: mô phỏng giao diện web, bấm thử được.
- Khung cảnh báo trên trang dùng `validateConfig`, cùng quy tắc với mục 9.3.
- Thống kê và thẻ "Cần nhập thêm" chỉ tính các bước đang bật.
- Nút **Xuất JSON** tải file đúng định dạng `CraftConfig`.
- Tìm kiếm trên header tìm được cả tên bước lẫn tên lựa chọn, mở thẳng `/craft?step=…&edit=…`.
