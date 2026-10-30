# Trình dựng Thủ công: đặc tả cấu hình

Tài liệu cho người làm **BE** (lưu cấu hình, kiểm tra đơn) và **storefront** (dựng trang Thủ công theo cấu hình). Phần tồn kho nằm ở tài liệu riêng: [Kho nguyên liệu](./inventory.md).

> **Trạng thái:** bản nháp, chưa có BE. BO đã dựng xong giao diện ở trang `/craft`, cấu hình đang lưu tạm trên trình duyệt (`localStorage`): bản đã lưu ở khóa `bo-craft-builder-v5`, bản nháp đang sửa ở `bo-craft-builder-v5-draft`.
>
> **Nguồn sự thật trong code** (tài liệu lệch code thì code đúng, hãy sửa tài liệu):
>
> | Nội dung | File |
> |---|---|
> | Kiểu dữ liệu | [`bo/src/lib/craft/types.ts`](../bo/src/lib/craft/types.ts) |
> | Cấu hình mặc định | [`bo/src/lib/craft/default-config.ts`](../bo/src/lib/craft/default-config.ts) |
> | Quy tắc kiểm tra | `validateConfig` trong [`bo/src/lib/craft/steps.ts`](../bo/src/lib/craft/steps.ts) |
> | Tồn kho của lựa chọn | `levelOf`, `sellable`, `sellableSizes` trong [`bo/src/lib/inventory/stock.ts`](../bo/src/lib/inventory/stock.ts) |
>
> Lấy một file cấu hình thật bằng nút **Xuất JSON** trên trang Thủ công.

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Cấu hình và bước](#2-cấu-hình-và-bước)
3. [Lựa chọn](#3-lựa-chọn)
4. [Năm component](#4-năm-component)
5. [Ảnh minh họa cây nến](#5-ảnh-minh-họa-cây-nến)
6. [Lựa chọn của khách](#6-lựa-chọn-của-khách)
7. [Tính giá](#7-tính-giá)
8. [Tồn kho trên web](#8-tồn-kho-trên-web)
9. [Việc của BE](#9-việc-của-be)
10. [Việc của storefront](#10-việc-của-storefront)
11. [Ánh xạ icon](#11-ánh-xạ-icon)
12. [BO đã có gì](#12-bo-đã-có-gì)

## 1. Tổng quan

```
BO · Thủ công ──PUT cấu hình──▶ BE ──GET cấu hình + mức tồn──▶ Web (trang Thủ công)
BO · Kho      ──phiếu kho─────▶ BE ◀──────POST đơn hàng───────┘
                                 └─ tính lại giá, kiểm tra lựa chọn, trừ kho
```

- **Thủ công** chỉ mô tả trải nghiệm của khách: có những bước nào, mỗi bước có lựa chọn gì, giá bao nhiêu, cái gì đi với cái gì.
- **Kho nguyên liệu** là nơi **duy nhất** giữ số tồn. Lựa chọn chỉ **trỏ tới** nguyên liệu qua id, không tự giữ số tồn.
- Admin tự tạo các **bước** theo thứ tự. Mỗi bước dùng một trong 5 **component** có sẵn (mục 4).
- Web **không có danh sách bước cứng**: đọc `steps` và dựng từng bước theo `kind`.
- Giá trên web chỉ là ước tính. **BE phải tính lại giá và kiểm tra lựa chọn khi tạo đơn**, không tin số client gửi lên.
- Tiền là **VNĐ, số nguyên (đồng)** ở mọi nơi.

| Thuật ngữ | Kiểu | Nghĩa |
|---|---|---|
| Cấu hình | `CraftConfig` | Toàn bộ trang Thủ công: danh sách bước theo thứ tự. |
| Bước | `CraftStep` | Một mục khách đi qua, vd "Sáp". `kind` quyết định giao diện và cách chọn. |
| Component | `kind` | `vessel`, `cards`, `swatches`, `blend`, `inputs`. |
| Lựa chọn | `StepOption` | Một mục trong bước, vd "Sáp đậu nành". Có phụ thu, trỏ tới nguyên liệu trong kho. |
| Kích thước | `SizeOption` | Một cỡ hũ, vd 150ml. Quyết định giá gốc. |
| Lựa chọn của khách | `CraftSelection` | Những gì khách đã chọn, gửi lên khi thêm giỏ và đặt đơn. |

## 2. Cấu hình và bước

### 2.1 `CraftConfig`

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `version` | `1` | Tăng khi đổi cấu trúc. Gặp phiên bản lạ thì từ chối. |
| `currency` | `"VND"` | Cố định. |
| `steps` | `CraftStep[]` | Thứ tự trong mảng = thứ tự trên web. |
| `updatedAt` | `string?` (ISO) | BE ghi đè bằng giờ server mỗi lần lưu. Dùng làm phiên bản khi sửa đồng thời. |

### 2.2 Trường chung của mọi bước

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | `string` | Slug, duy nhất trong cấu hình (`wax`, `phu-kien-kem`). **Cố định sau khi tạo**: đơn hàng và quy tắc `onlyWith` trỏ tới id này. |
| `kind` | `vessel \| cards \| swatches \| blend \| inputs` | Mục 4. |
| `title` | `{ vi, en }` | Tên bước. |
| `hint` | `{ vi, en }?` | Dòng mô tả nhỏ dưới tên. |
| `icon` | `StepIcon` | Một trong `vessel, layers, flower, flame, palette, sparkles, pen, gift, tag, box` (mục 11). |
| `enabled` | `boolean` | `false` = ẩn khỏi web, giữ dữ liệu. Bước mới tạo mặc định `false`. |
| `required` | `boolean` | Khách phải chọn trước khi thêm giỏ. Với `inputs`: nhập ít nhất một ô hoặc tích một tuỳ chọn. |

## 3. Lựa chọn

`StepOption` dùng chung cho `vessel`, `cards`, `swatches`, `blend`.

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | `string` | Duy nhất trong bước. **Cố định sau khi tạo.** |
| `name` | `{ vi, en }` | |
| `description` | `{ vi, en }?` | |
| `priceDelta` | `number` | Phụ thu mỗi hũ, ≥ 0. |
| `available` | `boolean` | `false` = shop tạm ẩn, web không hiện. |
| `materialId` | `string?` | Nguyên liệu trong kho bị trừ khi khách chọn mục này. **Bỏ trống = không theo dõi tồn** (vd "Không mùi"). **Hũ không dùng trường này** mà dùng `sizeMaterials` (mục 4.1). |
| `swatch` | `string?` | Mã màu hex, dùng khi không có ảnh. Ở `swatches`, không có màu = "không pha màu" (web vẽ ô sọc). |
| `images` | `string[]?` | Ảnh thật, ảnh đầu là ảnh chính. Hiện là `data:` URL, khi có BE đổi sang URL (mục 9.4). |
| `look` | `string?` | Kiểu vẽ trên ảnh minh họa khi bước có `previewRole` (mục 5). |
| `onlyWith` | `{ [stepId]: optionId[] }?` | Chỉ chọn được khi bước `stepId` đang chọn một trong các mục này. Bỏ trống = không giới hạn. Vd bấc gỗ chỉ đi với một số hũ. |
| `maxGrams` | `number?` | Không dùng được khi lượng sáp đổ (`size.grams`) lớn hơn số này. |
| `exclusive` | `boolean?` | Chỉ ở `blend`: chọn mục này thì không phối thêm mục khác (vd "Không mùi"). |

## 4. Năm component

| `kind` | Ví dụ | Khách chọn | Lựa chọn của khách |
|---|---|---|---|
| `vessel` | Hũ nến | 1 hũ + 1 cỡ + có/không nắp | `{ optionId, sizeId, withLid }` |
| `cards` | Sáp, Bấc, Trang trí | 1 hoặc nhiều thẻ | `{ optionIds }` |
| `swatches` | Màu sáp | đúng 1 màu | `{ optionIds: [id] }` |
| `blend` | Mùi hương | 1 tới `maxBlend` mục kèm tỉ lệ, độ đậm | `{ items, intensity }` |
| `inputs` | Cá nhân hóa | ô chữ + tuỳ chọn thêm | `{ values, addons }` |

### 4.1 `vessel`: Hũ & kích thước

Mỗi cấu hình có **đúng 1** bước loại này. Bước luôn bật, luôn bắt buộc và **quyết định giá gốc**.

**Kích thước** (`sizes: SizeOption[]` của bước):

| Trường | Ghi chú |
|---|---|
| `id` | Vd `s150`. |
| `ml` | **Dung tích hũ**, cũng là tên cỡ khách thấy ("150ml"). |
| `grams` | **Lượng sáp đổ** vào hũ. Dùng để tính nguyên liệu tiêu hao và so với `maxGrams`. |
| `burnHours?` | Chỉ điền khi xưởng đã đo thực tế. |
| `basePrice` | **Giá gốc của cây nến** ở cỡ này. |
| `available` | Cỡ đang bán. |

**Lựa chọn hũ** (`VesselOption`, mở rộng `StepOption`):

| Trường | Ghi chú |
|---|---|
| `shape` | `tumbler \| jar \| tin \| bowl`: dáng hũ để vẽ ảnh minh họa. |
| `translucent?` | Hũ trong suốt, ảnh minh họa thấy màu sáp. |
| `supportedSizeIds` | Các cỡ hũ này đổ được. |
| `sizeMaterials` | `{ [sizeId]: { materialId?, lidMaterialId? } }`: **mã hũ và mã nắp trong kho của từng cỡ**. Cỡ không có `materialId` thì không theo dõi tồn. Chỉ chứa cỡ có trong `supportedSizeIds`. |
| `lid` | `{ priceDelta }`: khách được chọn thêm nắp. `null` = hũ không có nắp. |

> **Vì sao tồn kho hũ tính theo cỡ:** hũ 150ml và hũ 250ml là hai món hàng khác nhau trong xưởng, không thay được cho nhau. Nếu gộp chung một số tồn, web sẽ nhận đơn cỡ 250ml dù xưởng chỉ còn hũ 150ml. Vì vậy mỗi cỡ trỏ tới một nguyên liệu riêng trong kho, và nắp cũng vậy.

```json
{
  "id": "ceramic",
  "name": { "vi": "Hũ gốm", "en": "Ceramic" },
  "priceDelta": 100000,
  "available": true,
  "shape": "tumbler",
  "supportedSizeIds": ["s150", "s200", "s250"],
  "sizeMaterials": {
    "s150": { "materialId": "jar-ceramic-150", "lidMaterialId": "lid-ceramic-150" },
    "s200": { "materialId": "jar-ceramic-200", "lidMaterialId": "lid-ceramic-200" },
    "s250": { "materialId": "jar-ceramic-250", "lidMaterialId": "lid-ceramic-250" }
  },
  "lid": { "priceDelta": 25000 }
}
```

**Web hiển thị** theo thứ tự: thẻ hũ, rồi các cỡ theo dung tích, rồi ô "Thêm nắp" (chỉ khi hũ có `lid`). Trạng thái khóa xem mục 8.

### 4.2 `cards`: Thẻ lựa chọn

| Trường | Ghi chú |
|---|---|
| `multiple` | `true` = chọn nhiều (checkbox), `false` = chọn một (radio). |
| `maxSelect?` | Khi `multiple`: số mục tối đa. Bỏ trống = không giới hạn. |
| `previewRole?` | `waxColor \| wick \| decoration` (mục 5). |
| `gramsPerGram?` | Với nguyên liệu tính theo g/ml: mỗi hũ cần `gramsPerGram × size.grams`. Mặc định 1 (sáp: cỡ đổ 120g cần 120g sáp). |

**Web hiển thị:** lưới thẻ (ảnh hoặc màu, tên, mô tả, phụ thu), có dấu tick khi chọn. Thẻ hết hàng hoặc không tương thích thì khóa, kèm lý do.

### 4.3 `swatches`: Bảng màu

Giống `cards` nhưng **luôn chọn đúng một**. `previewRole?` chỉ nhận `waxColor`. Có `gramsPerGram?`.

**Web hiển thị:** ô màu tròn kèm tên và phụ thu. Lựa chọn không có `swatch` vẽ ô sọc ("không pha màu").

### 4.4 `blend`: Phối tỉ lệ

| Trường | Ghi chú |
|---|---|
| `maxBlend` | Số mục phối tối đa trong 1 hũ, từ 1 đến 4. `1` = chọn một, không có thanh tỉ lệ. |
| `intensity` | `null` = không cho chọn độ đậm. Nếu có: `{ priceDelta: { light, medium, strong }, load: { light, medium, strong } }`. `load` = lượng tinh dầu trên mỗi gram sáp (mặc định 0.06 / 0.08 / 0.10). |

**Web hiển thị:** lưới thẻ chọn nhiều. Từ 2 mục trở lên thì hiện thanh tỉ lệ cho từng mục (10–100, bước 5). Có `intensity` thì hiện 3 nút Nhẹ / Vừa / Đậm. Chọn mục `exclusive` thì bỏ các mục khác và ẩn độ đậm.

**Lựa chọn của khách:** `{ items: [{ optionId, weight }], intensity }`. `weight` là tỉ lệ tương đối, quy ra % theo mục 7.1.

### 4.5 `inputs`: Ô nhập & tuỳ chọn thêm

Bước này không có `options`. Thay vào đó:

- `fields: TextFieldDef[]`: `id`, `label`, `placeholder?`, `maxLength` (1–500), `priceDelta` (tính khi khách có nhập), `enabled`, `multiline?`, `onLabel?` (in chữ lên nhãn trong ảnh minh họa).
- `addons: AddonDef[]`: `id`, `name`, `description?`, `priceDelta`, `available`, `enabled`, `materialId?` (vd hộp quà trong kho).

Id ô nhập và tuỳ chọn duy nhất trong bước.

**Web hiển thị:** ô nhập đang `enabled` kèm bộ đếm `n/maxLength`; tuỳ chọn đang `enabled` dạng checkbox, hết hàng thì khóa.

## 5. Ảnh minh họa cây nến

Web vẽ bằng SVG (`fe/src/components/customizer/candle-preview.tsx`):

| Phần trên ảnh | Lấy từ |
|---|---|
| Dáng, màu, độ trong của hũ | Hũ đang chọn: `shape`, `swatch`, `translucent`. |
| Màu sáp | Các bước có `previewRole: "waxColor"`, duyệt theo thứ tự; **bước sau ghi đè bước trước** nếu lựa chọn đang chọn có `swatch`. Không có thì `#f6efe2`. |
| Kiểu bấc | Bước đầu tiên có `previewRole: "wick"`: `look` = `cotton` hoặc `wood`. Mặc định `cotton`. |
| Trang trí | Bước đầu tiên có `previewRole: "decoration"`: `look` = `flowers`, `pattern` hoặc `topper`. Không có thì không vẽ. |
| Chữ trên nhãn | Ô nhập đầu tiên có `onLabel: true` mà khách đã nhập. |

Muốn thêm giá trị `look` mới thì phải bổ sung hình vẽ ở web trước.

## 6. Lựa chọn của khách

Web gửi kèm dòng giỏ hàng và khi tạo đơn:

```ts
type CraftSelection = {
  // updatedAt của cấu hình lúc khách chọn
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
- Bước đang ẩn bị bỏ qua dù client có gửi.
- Link "Lưu cấu hình" của web mã hóa `CraftSelection` vào `?config=` (base64 JSON).

**Đơn hàng lưu bản chụp** (`snapshot`), vì admin có thể sửa hoặc xóa bước sau này. Trang đơn hàng trên BO đọc từ bản chụp, không đọc lại cấu hình. Bản chụp gồm:

- `selection`;
- mô tả đã dịch `{ vi, en }`, vd `"Hũ gốm 150ml · Sáp đậu nành · Vanilla 70% / Lavender 30%"`;
- các dòng giá `[{ stepId, label, amount }]`;
- giá đơn vị lúc đặt.

## 7. Tính giá

BE tính lại đúng công thức này khi tạo đơn; web tính y hệt để hiện giá ước tính.

```
giá 1 hũ = size.basePrice
         + hũ:            option.priceDelta + (withLid ? option.lid.priceDelta : 0)
         + cards/swatches: Σ priceDelta các mục đã chọn
         + blend:          round( Σ(priceDelta × percent) / 100 ) + (intensity ? intensity.priceDelta[level] : 0)
         + inputs:         Σ field.priceDelta (ô có chữ sau khi trim) + Σ addon.priceDelta (tuỳ chọn đã tích)
tổng dòng = giá 1 hũ × số lượng
```

### 7.1 Quy `weight` ra phần trăm (blend)

Làm tròn sao cho **tổng luôn bằng 100** (phương pháp phần dư lớn nhất):

1. `raw_i = weight_i / Σweight × 100`, `p_i = floor(raw_i)`.
2. Phần thiếu `100 − Σp_i` chia lần lượt +1 cho các mục có phần lẻ `raw_i − p_i` lớn nhất.

Code tham chiếu: `fragranceShares` trong `fe/src/lib/customizer/options.ts`.

## 8. Tồn kho trên web

Định nghĩa mức tồn (`ok`, `low`, `out`, `untracked`), cách tính lượng tiêu hao và trừ kho nằm ở [Kho nguyên liệu](./inventory.md). Phần này chỉ nói web khóa gì.

| Trường hợp | Web hiển thị |
|---|---|
| Lựa chọn có `materialId` ở mức `out` | Khóa thẻ, nhãn "Tạm hết". |
| Lựa chọn không có `materialId` | Luôn còn hàng. |
| Hũ: mã hũ của **một cỡ** ở mức `out` | Chỉ khóa cỡ đó, nhãn "Hết hàng". Các cỡ khác vẫn chọn được. |
| Hũ: **mọi** cỡ đổ được đều `out` | Khóa thẻ hũ, nhãn "Tạm hết". |
| Hũ: mã nắp của cỡ đang chọn ở mức `out` | Khóa ô "Thêm nắp", ghi "Hết nắp cỡ này". Hũ vẫn bán. |
| Cỡ không có trong `supportedSizeIds` của hũ | Làm mờ, ghi "Không hợp với hũ này". |
| Tuỳ chọn thêm (`addon`) có `materialId` ở mức `out` | Khóa checkbox, ghi "Tạm hết". |
| Đủ nguyên liệu cho N hũ, N ≤ 5 | Hiện "Chỉ còn đủ làm N hũ". N = 0 thì khóa nút thêm giỏ. |

Web **không nhận id kho**: BE thay id bằng mức tồn trước khi trả cấu hình (mục 9.1).

## 9. Việc của BE

### 9.1 API

| Method | Đường dẫn | Quyền | Mô tả |
|---|---|---|---|
| `GET` | `/api/shop-config/craft` | Công khai | Cấu hình cho web (xem bên dưới). Cache ngắn (30–60 giây), trả `ETag`. |
| `GET` | `/api/admin/shop-config/craft` | Admin | Cấu hình đầy đủ cho BO. |
| `PUT` | `/api/admin/shop-config/craft` | Admin | Ghi đè cả cấu hình (body `CraftConfig`). Header `If-Match: <updatedAt đang sửa>`; lệch bản hiện tại thì trả `409` để BO báo "có người vừa sửa". Thành công trả cấu hình đã lưu với `updatedAt` mới. Lỗi kiểm tra trả `400` (mục 9.3). |
| `POST` | `/api/admin/uploads` | Admin | Upload ảnh lựa chọn, trả URL (mục 9.4). |
| `GET` | `/api/admin/shop-config/craft/revisions` | Admin | *(Tùy chọn)* Lịch sử để khôi phục bản trước. |

**Bản công khai cho web** khác bản admin ở chỗ:

- bỏ bước `enabled: false`, lựa chọn `available: false`, ô nhập và tuỳ chọn `enabled: false`, cỡ `available: false`;
- thay `materialId` bằng `stock: { level, unit, available }`, với `available` là số hũ còn làm được tính từ nguyên liệu đó;
- với hũ, thay `sizeMaterials` bằng `sizeStock: { [sizeId]: { jar: stock, lid: stock } }`.

Hiện fe gọi `GET /api/shop-config` trả `{ customizer, production, payment, contact }` (`fe/src/lib/shop-config.ts`). Chọn một trong hai cách và cập nhật cả fe: giữ endpoint gộp và thay khóa `customizer` bằng `CraftConfig`, hoặc tách riêng `/craft` như bảng trên.

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

- Lưu cả cấu hình dạng JSON là đủ: dữ liệu nhỏ, luôn đọc và ghi trọn gói.
- Chưa có bản ghi `craft` thì trả nội dung `bo/src/lib/craft/default-config.ts`. Các `materialId` trong đó khớp với dữ liệu kho mẫu (xem [Kho nguyên liệu](./inventory.md#9-lưu-trữ-prisma-gợi-ý)).

### 9.3 Kiểm tra khi `PUT`

**Lỗi cấu trúc** (từ chối `400`):

- `version === 1`, `currency === "VND"`.
- `kind` thuộc 5 giá trị; `icon` thuộc danh sách icon.
- `previewRole` hợp lệ theo `kind`: `cards` nhận `waxColor`, `wick`, `decoration`; `swatches` chỉ nhận `waxColor`; các loại khác không có.
- Id bước dạng `^[a-z0-9]+(-[a-z0-9]+)*$`; id lựa chọn, ô nhập, tuỳ chọn dạng `^[A-Za-z0-9-]+$`.
- Không trùng id bước trong cấu hình; không trùng id lựa chọn, ô nhập, tuỳ chọn trong cùng bước.
- Mọi số tiền là số nguyên ≥ 0. `maxLength` 1–500, `maxBlend` 1–4, `load` 0–0.3.
- Mỗi kích thước có `ml > 0` và `grams > 0`.
- `supportedSizeIds` chỉ chứa id có trong `sizes`; khóa của `sizeMaterials` nằm trong `supportedSizeIds`.
- Hũ không có `materialId` (dùng `sizeMaterials`).

**Lỗi nghiệp vụ** (từ chối `400`, giống các lỗi mức `error` của `validateConfig`):

- Có đúng 1 bước `vessel`, bước đó `enabled` và `required`.
- Bước `vessel` có ít nhất 1 cỡ `available`.
- Có ít nhất 1 bước `enabled`.
- Bước `enabled` + `required` còn ít nhất 1 lựa chọn đang bán và còn hàng **theo tồn kho hiện tại**.

**Cảnh báo** (vẫn lưu, trả kèm `warnings`):

- `onlyWith` trỏ tới bước hoặc lựa chọn không còn. Nên tự gỡ khi lưu.
- `materialId`, mã hũ / nắp theo cỡ, hoặc `materialId` của addon trỏ tới nguyên liệu không còn trong kho.
- Hũ đã gắn mã cho vài cỡ nhưng bỏ trống cỡ khác: cỡ bỏ trống bán không giới hạn.
- Hũ đang bán mà chưa chọn cỡ nào.
- Bước `enabled` chưa có lựa chọn nào; bước `inputs` chưa bật ô nhập hay tuỳ chọn nào.

**Không cho đổi id** bước và lựa chọn đã có, vì đơn hàng và link đã lưu đang dùng. Muốn bỏ thì tắt `enabled` / `available`, hoặc xóa.

### 9.4 Ảnh

- BO hiện nén ảnh sang webp (tối đa 800px) và nhúng `data:` URL vào JSON. Chỉ dùng tạm cho bản nháp.
- Khi có BE: BO upload từng ảnh qua `POST /api/admin/uploads` rồi lưu URL vào `images`.
- `PUT` từ chối `data:` URL, hoặc tự tách ra để upload.

### 9.5 Kiểm tra khi tạo đơn có nến tự phối

Với mỗi dòng nến tự phối, BE tải cấu hình **hiện tại** rồi kiểm tra `CraftSelection`:

1. Mỗi bước `enabled` + `required` có lựa chọn.
2. Mọi `optionId`, `sizeId`, `fieldId`, `addonId` tồn tại và đang bán.
3. **Hũ:**
   - cỡ đã chọn `available` và nằm trong `supportedSizeIds` của hũ;
   - mã hũ **của cỡ đó** đủ tồn cho số lượng đặt;
   - `withLid` chỉ hợp lệ khi hũ có `lid` và nắp **của cỡ đó** đủ tồn.
4. **`cards`:** `multiple: false` thì tối đa 1 mục; `multiple: true` thì không vượt `maxSelect`. **`swatches`:** đúng 1 mục.
5. **`blend`:** 1 tới `maxBlend` mục, `weight` 10–100; mục `exclusive` đứng một mình; `intensity` là `null` khi cấu hình không có độ đậm hoặc khi chọn mục `exclusive`.
6. **`inputs`:** độ dài từng ô (sau khi trim) ≤ `maxLength`.
7. **`onlyWith`:** với mỗi bước được nhắc tới (nếu bước đó đang bật và khách có chọn), **mọi** mục khách chọn ở bước đó nằm trong danh sách cho phép.
8. **`maxGrams`:** không nhỏ hơn `grams` của cỡ đã chọn.
9. **Tồn kho:** đủ nguyên liệu cho số lượng đặt, đã cộng dồn các lựa chọn dùng chung một nguyên liệu (xem [Kho nguyên liệu, mục 6](./inventory.md#6-lượng-nguyên-liệu-mỗi-hũ)).
10. Tính lại giá theo mục 7, ghi bản chụp theo mục 6, rồi trừ hoặc giữ kho.

Nếu `configUpdatedAt` cũ hơn cấu hình hiện tại, vẫn kiểm tra theo cấu hình hiện tại. Lựa chọn không còn hợp lệ thì trả `409` kèm `[{ stepId, code }]` để web báo khách chọn lại.

Mã lỗi: `required`, `unavailable`, `incompatible`, `tooLong`, `tooMany`, `outOfStock` (khớp với `fe/src/lib/customizer/types.ts`).

## 10. Việc của storefront

1. **Tiền tệ:** fe đang hiển thị USD (`formatMoney` trong `fe/src/lib/customizer/pricing.ts`, `formatPrice` trong `fe/src/lib/data.ts`). Cần chuyển sang VNĐ cho cả sản phẩm, giỏ hàng, checkout, trước hoặc cùng lúc với việc nối cấu hình.
2. **Bỏ 7 nhóm cố định** (`groupIds`, `CustomizerCatalog`, `CandleConfiguration`, các component `container-group`, `wax-group`…). Thay bằng một bộ dựng chung đọc `steps` và render theo `kind`. Đổi tương ứng:
   - `options.ts`, `pricing.ts`, `validation.ts`, `snapshot.ts` theo mục 5–8;
   - `customization-progress.tsx`, `configuration-summary.tsx` theo `steps`;
   - tên và mô tả bước lấy từ cấu hình, không lấy từ file dịch.
3. **Bước hũ:** hiển thị cỡ theo `ml`; khóa cỡ và nắp theo `sizeStock` (mục 8).
4. **Giỏ hàng cũ** lưu theo `CandleConfiguration` cần bỏ: tăng `version` của store trong `fe/src/stores/cart-store.ts`.
5. **Link `?config=` định dạng cũ** giải mã không được thì bỏ qua và dùng lựa chọn mặc định.
6. **Lựa chọn mặc định khi mở trang:**
   - mỗi bước bắt buộc chọn sẵn mục đầu tiên đang bán, còn hàng và tương thích;
   - bước hũ chọn sẵn cỡ đầu tiên còn hàng của hũ đó;
   - bước `blend` chọn 1 mục không `exclusive`, `weight` 50, độ đậm `medium` nếu có;
   - bước không bắt buộc để trống.

## 11. Ánh xạ icon

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

## 12. BO đã có gì

Trang **Trình dựng Thủ công** (`/craft`, URL giữ trạng thái `?step=&view=&edit=`):

- **Sửa trên bản nháp, bấm Lưu mới lên web.** Mọi thay đổi (bước, lựa chọn, kích thước, cài đặt) vào bản nháp, giữ cả khi rời trang. Thanh dính đáy ghi rõ bước nào đã sửa / thêm / xóa / đổi thứ tự, kèm nút **Bỏ thay đổi** và **Lưu thay đổi**; danh sách bước có chấm cam ở bước chưa lưu. Nút **Xem thay đổi** mở danh sách chi tiết theo từng bước (trường nào, cũ → mới; vd "Sáp đậu nành · Phụ thu: 0 ₫ → 20.000 ₫"), bấm một dòng để mở đúng chỗ, **Hoàn tác** từng bước, **Lưu tất cả** (`describeChanges` trong `bo/src/lib/craft/changes.ts`). Còn cảnh báo vẫn lưu được; còn lỗi thì hỏi xác nhận. Khi có BE, nút Lưu gọi `PUT` (mục 9.1) với `If-Match`. Kho nguyên liệu, tìm kiếm và web chỉ đọc bản đã lưu.
- **Thống kê:** số bước đang hiện; số lựa chọn đang bán; số lựa chọn (và cỡ hũ) **đang bị khóa** vì hết nguyên liệu, có link sang Kho; **giá thấp nhất** một hũ khách đặt được.
- **Khung cảnh báo** dùng `validateConfig(config, materials)`, cùng quy tắc với mục 9.3.
- **Danh sách bước:** thêm bước bằng cách chọn component (có hình minh họa), đổi thứ tự, bật/tắt, chấm cảnh báo ở bước có lỗi.
- **Các tab của một bước:**
  - **Lựa chọn:** bảng (bật/tắt bán ngay trên bảng) và drawer sửa.
    - Cột "Tồn kho" lấy từ nguyên liệu gắn kèm; bước hũ hiện "Tồn kho theo cỡ".
    - Ô "Nguyên liệu trong kho": chọn nguyên liệu có sẵn, chọn "Không theo dõi", hoặc **tạo nguyên liệu mới** kèm tồn ban đầu (đơn vị Cái / Gram / Mililít). Nguyên liệu mới mang nhãn "Chờ lưu" và chỉ vào Kho khi bấm Lưu.
    - Riêng hũ: khối **"Kích cỡ & tồn kho"**, mỗi cỡ một dòng để tích cỡ đổ được, chọn hoặc tạo mã hũ và mã nắp ("Hũ sứ 150ml", "Nắp hũ sứ 150ml"…).
    - Các trường khác hiện theo component: dáng hũ, nắp, kiểu minh họa, "không phối thêm", `onlyWith`, `maxGrams`.
  - **Kích thước** (chỉ bước hũ): dung tích (ml), sáp đổ (g), giá gốc, thời gian cháy, đang bán.
  - **Ô nhập & tuỳ chọn** (chỉ bước `inputs`): tuỳ chọn thêm cũng gắn nguyên liệu.
  - **Cài đặt:** tên, mô tả, icon, bắt buộc, chọn nhiều, vai trò minh họa, hệ số gram, phối tối đa, độ đậm, xóa bước.
  - **Xem trước:** mô phỏng giao diện web, bấm thử được, khóa đúng như mục 8.
- **Xuất JSON** tải file đúng định dạng `CraftConfig`; **Cấu hình mẫu** khôi phục cấu hình mặc định.
