# Kho nguyên liệu: đặc tả dữ liệu & nghiệp vụ

Tài liệu cho người làm **BE**: lưu nguyên liệu, ghi phiếu kho, tính lượng tiêu hao của nến tự phối và trừ kho theo đơn. Phần cấu hình trang Thủ công nằm ở tài liệu riêng: [Trình dựng Thủ công](./craft-builder.md).

> **Trạng thái:** bản nháp, chưa có BE. BO đã dựng xong giao diện ở trang `/inventory`, dữ liệu đang lưu tạm trên trình duyệt (`localStorage`, khóa `bo-inventory-v2`).
>
> **Nguồn sự thật trong code** (tài liệu lệch code thì code đúng, hãy sửa tài liệu):
>
> | Nội dung | File |
> |---|---|
> | Kiểu dữ liệu | [`bo/src/lib/inventory/types.ts`](../bo/src/lib/inventory/types.ts) |
> | Dữ liệu mẫu (seed) | [`bo/src/lib/inventory/mock.ts`](../bo/src/lib/inventory/mock.ts) |
> | Mức tồn, nơi dùng, tồn theo cỡ hũ | [`bo/src/lib/inventory/stock.ts`](../bo/src/lib/inventory/stock.ts) |
> | Ghi phiếu kho | `move` trong [`bo/src/hooks/use-inventory.ts`](../bo/src/hooks/use-inventory.ts) |

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Nguyên liệu](#2-nguyên-liệu)
3. [Mức tồn](#3-mức-tồn)
4. [Phiếu kho](#4-phiếu-kho)
5. [Liên kết với trang Thủ công](#5-liên-kết-với-trang-thủ-công)
6. [Lượng nguyên liệu mỗi hũ](#6-lượng-nguyên-liệu-mỗi-hũ)
7. [Số lượng tối đa & trừ kho theo đơn](#7-số-lượng-tối-đa--trừ-kho-theo-đơn)
8. [API](#8-api)
9. [Lưu trữ (Prisma, gợi ý)](#9-lưu-trữ-prisma-gợi-ý)
10. [BO đã có gì](#10-bo-đã-có-gì)

## 1. Tổng quan

- Kho là nơi **duy nhất** giữ số tồn của xưởng: sáp, tinh dầu, màu, bấc, hũ, nắp, phụ kiện, bao bì.
- Trang Thủ công **không giữ số tồn**. Mỗi lựa chọn chỉ trỏ tới một nguyên liệu qua id (mục 5). Nhiều lựa chọn có thể dùng chung một nguyên liệu.
- **Số tồn chỉ thay đổi qua phiếu kho** (nhập, xuất, kiểm kê, trừ theo đơn). Mỗi phiếu được lưu lại làm lịch sử, nên luôn biết vì sao số tồn thành như hiện tại.
- Khách trên web **không thấy** tên hay mã nội bộ của kho. Web chỉ nhận mức tồn (còn / sắp hết / hết) của từng lựa chọn.

## 2. Nguyên liệu

### 2.1 `Material`

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | `string` | Slug, **cố định sau khi tạo**: lựa chọn trên trang Thủ công và lịch sử kho trỏ tới id này. |
| `name` | `string` | Tên nội bộ của xưởng. Khách không thấy. |
| `sku` | `string?` | Mã nội bộ hoặc mã nhà cung cấp. |
| `category` | `vessel \| wax \| fragrance \| wick \| dye \| decor \| packaging \| other` | Hũ & nắp, sáp, tinh dầu, bấc, màu nhuộm, trang trí, bao bì, khác. Chỉ để lọc. |
| `unit` | `pcs \| g \| ml` | Đơn vị đếm tồn (mục 2.2). |
| `tracked` | `boolean` | `false` = không đếm tồn, luôn coi là còn hàng. |
| `stock` | `number` | Số nguyên ≥ 0, tính theo `unit`. **Chỉ đổi qua phiếu kho.** |
| `lowStock` | `number` | Dưới ngưỡng này là "sắp hết". Mỗi nguyên liệu một ngưỡng riêng. |
| `swatch` | `string?` | Màu nhận diện trong bảng kho. |
| `note` | `string?` | |
| `updatedAt` | `string` (ISO) | Cập nhật khi sửa thông tin hoặc có phiếu mới. |

### 2.2 Đơn vị

| `unit` | Tên trên BO | Dùng cho | Ngưỡng sắp hết mặc định |
|---|---|---|---|
| `pcs` | Cái | Hũ, nắp, bấc, khuôn, phụ kiện, bao bì | 10 |
| `g` | Gram | Sáp | 500 |
| `ml` | Mililít | Tinh dầu, màu lỏng | 500 |

Khi tính lượng tiêu hao, `ml` dùng chung công thức với `g` và coi **1ml ≈ 1g**. Tinh dầu thực tế nhẹ hơn nước một chút. Nếu cần chính xác, sau này thêm trường `density` cho nguyên liệu, không phải đổi cấu hình Thủ công.

### 2.3 Hũ và nắp: mỗi dung tích là một nguyên liệu

Hũ 150ml và hũ 250ml không thay được cho nhau, nên **mỗi dung tích là một nguyên liệu riêng**. Nắp cũng vậy. Quy ước đặt id:

| Món | Id | Tên |
|---|---|---|
| Hũ | `jar-<loại>-<ml>` | `jar-ceramic-150` · "Hũ gốm trụ 150ml" |
| Nắp | `lid-<loại>-<ml>` | `lid-ceramic-150` · "Nắp gỗ hũ gốm 150ml" |

Quy ước này chỉ giúp dễ đọc, BE không dựa vào nó. Việc hũ nào, cỡ nào dùng nguyên liệu nào do `sizeMaterials` trên trang Thủ công quyết định (mục 5).

## 3. Mức tồn

| Mức | Điều kiện | Nhãn |
|---|---|---|
| `untracked` | `tracked = false` | Không theo dõi |
| `out` | `stock ≤ 0` | Hết hàng |
| `low` | `stock < lowStock` | Sắp hết |
| `ok` | còn lại | Còn hàng |

Các mức này dùng chung cho bảng kho, khối "Cần nhập thêm", badge trên menu, thông báo và việc khóa lựa chọn trên web.

## 4. Phiếu kho

### 4.1 `StockMovement`

| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | `string` | |
| `materialId` | `string` | |
| `type` | `in \| out \| adjust \| order` | Xem bảng dưới. |
| `change` | `number` | Lượng thay đổi có dấu: + là tăng, − là giảm. |
| `after` | `number` | Số tồn sau phiếu. |
| `note` | `string?` | Vd "Nhập lô tháng 10 — NCC Hạt Mộc", "Vỡ khi vận chuyển". |
| `orderCode` | `string?` | Mã đơn, khi `type = order` hoặc khi hoàn kho do hủy đơn. |
| `by` | `string` | Người thao tác; "Hệ thống" với phiếu tự động. |
| `at` | `string` (ISO) | |

### 4.2 Các loại phiếu

| `type` | Tên trên BO | Admin nhập | Kết quả |
|---|---|---|---|
| `in` | Nhập thêm | Số lượng nhập | `after = stock + amount` |
| `out` | Xuất / hao hụt | Số lượng xuất (≤ số tồn) | `after = stock − amount` |
| `adjust` | Kiểm kê | Số đếm thực tế | `after = amount` |
| `order` | Theo đơn hàng | (BE tự tạo) | `after = stock − lượng cần cho đơn` (mục 7) |

Quy tắc:

- `amount` là số nguyên ≥ 0. Số tồn không bao giờ âm.
- **Xuất quá số đang có thì từ chối** (`400`), không tự đưa về 0: hao hụt thật phải được ghi đúng số. Đếm lại thấy lệch thì dùng kiểm kê.
- `change = after − stock` (với `adjust` có thể âm hoặc dương).
- Phiếu `in` / `out` làm số tồn không đổi (vd xuất khi đã hết) thì không ghi.
- Phiếu kiểm kê luôn được ghi, kể cả khi số đếm đúng bằng số tồn: đó là bằng chứng đã kiểm.
- **Không sửa, không xóa phiếu.** Ghi sai thì ghi thêm một phiếu ngược lại.
- Phiếu và số tồn mới phải lưu trong **cùng một transaction**.

## 5. Liên kết với trang Thủ công

Những chỗ trong cấu hình Thủ công trỏ tới nguyên liệu (chi tiết ở [Trình dựng Thủ công](./craft-builder.md)):

| Chỗ trỏ tới | Trường | Trừ khi |
|---|---|---|
| Lựa chọn của bước `cards`, `swatches`, `blend` | `option.materialId` | khách chọn mục đó |
| Hũ, theo từng cỡ | `option.sizeMaterials[sizeId].materialId` | khách chọn hũ đó **ở cỡ đó** |
| Nắp, theo từng cỡ | `option.sizeMaterials[sizeId].lidMaterialId` | khách chọn thêm nắp ở cỡ đó |
| Tuỳ chọn thêm của bước `inputs` | `addon.materialId` | khách tích tuỳ chọn đó |

**Mức tồn của một lựa chọn:**

- không gắn nguyên liệu: `untracked`, luôn bán được (vd "Không mùi", "Không màu");
- gắn nguyên liệu: lấy mức của nguyên liệu đó (mục 3);
- gắn id không còn trong kho: coi như `out`, và BO hiện cảnh báo.

**Riêng hũ**, mức tồn tính trên các cỡ hũ đổ được:

- một cặp (hũ, cỡ) bán được khi mã hũ của cỡ đó không `out`;
- hũ `out` chỉ khi **mọi** cỡ đều `out`;
- hũ `low` khi có cỡ `out` hoặc `low`;
- nắp `out` ở một cỡ chỉ khóa việc thêm nắp ở cỡ đó, không khóa hũ.

Ví dụ: hũ gốm còn 10 cái 150ml, 0 cái 200ml, 6 cái 250ml. Khách vẫn đặt được cỡ 150ml và 250ml; riêng cỡ 200ml bị khóa.

**Nơi dùng (`usage`):** mỗi nguyên liệu biết đang được lựa chọn nào dùng. Danh sách này cho cột "Dùng trên web", bộ lọc "Chưa dùng trên web", và chặn xóa nguyên liệu đang dùng (mục 8).

## 6. Lượng nguyên liệu mỗi hũ

`grams` là **lượng sáp đổ** của cỡ khách chọn (`size.grams`), không phải dung tích `size.ml`. Ví dụ cỡ 150ml đổ 120g sáp.

| Nguồn | Nguyên liệu `pcs` | Nguyên liệu `g` / `ml` |
|---|---|---|
| Hũ của cỡ đã chọn | 1 | 1 (nên để `pcs`) |
| Nắp của cỡ đã chọn (khi `withLid`) | 1 | 1 (nên để `pcs`) |
| Tuỳ chọn thêm đã tích | 1 | 1 |
| `cards` / `swatches` | 1 | `grams × (step.gramsPerGram ?? 1)` |
| `blend`, mỗi mục không `exclusive` | 1 | `grams × load × percent / 100` |

- `load` = `step.intensity.load[level]`. Bước không có độ đậm thì dùng 0.08.
- `percent` là tỉ lệ phối đã quy ra phần trăm ([Trình dựng Thủ công, mục 7.1](./craft-builder.md#71-quy-weight-ra-phần-trăm-blend)).
- Làm tròn lên (`ceil`) lượng cần của mỗi nguyên liệu cho một hũ.
- Không trừ khi: không gắn nguyên liệu, nguyên liệu `tracked = false`, hoặc mục `exclusive` của `blend`.
- **Nhiều lựa chọn dùng chung một nguyên liệu:** cộng dồn lượng cần trước khi so với tồn kho. Vd sáp pha trộn và sáp đậu nành cùng trỏ `wax-soy` thì cộng cả hai.

Ví dụ một hũ gốm 150ml (120g sáp), có nắp, sáp đậu nành, Vanilla 70% / Lavender 30% độ đậm Vừa:

| Nguyên liệu | Lượng trừ |
|---|---|
| `jar-ceramic-150` | 1 cái |
| `lid-ceramic-150` | 1 cái |
| `wax-soy` | 120 g |
| `oil-vanilla` | 120 × 0.08 × 70% = 6.72 → 7 ml |
| `oil-lavender` | 120 × 0.08 × 30% = 2.88 → 3 ml |

## 7. Số lượng tối đa & trừ kho theo đơn

**Số hũ tối đa** khách đặt được với một cấu hình:

```
N = min over mọi nguyên liệu có theo dõi ( floor( stock / lượng cần mỗi hũ ) )
```

Với hũ và nắp, chỉ xét mã **của cỡ đã chọn**. Web hiện "Chỉ còn đủ làm N hũ" khi N ≤ 5, và khóa nút thêm giỏ khi N = 0.

**Trừ kho:**

- Trừ khi đơn chuyển sang "đã thanh toán". Nếu nghiệp vụ muốn giữ hàng từ lúc tạo đơn thì trừ khi tạo đơn; chọn một và làm nhất quán.
- Trong **một transaction**: khóa các dòng nguyên liệu liên quan, kiểm tra lại `stock` đủ (tránh bán âm khi hai đơn cùng lúc), trừ, rồi ghi một phiếu `order` cho mỗi nguyên liệu, kèm `orderCode`.
- Không đủ tồn thì từ chối với mã `outOfStock` cho bước liên quan.
- **Hủy đơn đã trừ kho:** ghi phiếu `in` hoàn lại đúng lượng đã trừ, kèm `orderCode` và note "Hoàn kho do hủy đơn".
- Trừ theo **lượng đã ghi trong phiếu `order` của đơn**, không tính lại từ cấu hình hiện tại, vì cấu hình có thể đã đổi.

## 8. API

| Method | Đường dẫn | Mô tả |
|---|---|---|
| `GET` | `/api/admin/inventory` | Danh sách nguyên liệu. Lọc `?status=out\|low\|ok\|untracked\|unused`, `?category=`, `?q=` (tên, sku, id). Sắp xếp `?sort=urgent\|name\|updated`. Mỗi dòng kèm `usage` (lựa chọn đang dùng). |
| `GET` | `/api/admin/inventory/:id` | Một nguyên liệu, kèm `usage` và 20 phiếu gần nhất. |
| `POST` | `/api/admin/inventory` | Tạo nguyên liệu. Nhận `stock` làm tồn ban đầu và ghi phiếu `in` với note "Tồn ban đầu" nếu > 0 (BO đang làm đúng như vậy). |
| `PATCH` | `/api/admin/inventory/:id` | Sửa thông tin. **Không nhận `stock`** (đổi tồn qua phiếu) và không cho đổi `id`. |
| `DELETE` | `/api/admin/inventory/:id` | Xóa nguyên liệu. Đang được lựa chọn dùng thì trả `409` kèm danh sách nơi dùng, trừ khi có `?force=true`. |
| `POST` | `/api/admin/inventory/:id/movements` | Ghi phiếu `{ type: "in" \| "out" \| "adjust", amount, note? }`. Trả nguyên liệu sau cập nhật và phiếu vừa ghi. |
| `GET` | `/api/admin/inventory/movements` | Lịch sử phiếu, lọc `?materialId=`, `?type=`, `?orderCode=`, phân trang, mới nhất trước. |

**Kiểm tra dữ liệu:**

- `id` dạng `^[a-z0-9]+(-[a-z0-9]+)*$`, không trùng.
- `name` không rỗng; `category` và `unit` thuộc danh sách; `stock`, `lowStock`, `amount` là số nguyên ≥ 0.
- **Đổi `unit` của nguyên liệu đang được dùng** làm thay đổi cách trừ kho (vd từ `pcs` sang `g`). Vẫn cho đổi, nhưng trả kèm cảnh báo; BO đã hiện nhắc nhở này.

**Trang Thủ công dùng kho thế nào:** BE trả cấu hình công khai cho web kèm mức tồn của từng lựa chọn và từng cỡ hũ, thay cho id kho ([Trình dựng Thủ công, mục 9.1](./craft-builder.md#91-api)).

## 9. Lưu trữ (Prisma, gợi ý)

```prisma
model Material {
  id        String   @id                // slug, cố định
  name      String
  sku       String?
  category  String                      // vessel | wax | fragrance | wick | dye | decor | packaging | other
  unit      String                      // pcs | g | ml
  tracked   Boolean  @default(true)
  stock     Int      @default(0)
  lowStock  Int
  swatch    String?
  note      String?
  updatedAt DateTime @updatedAt
  movements StockMovement[]
}

model StockMovement {
  id         String   @id @default(cuid())
  material   Material @relation(fields: [materialId], references: [id], onDelete: Cascade)
  materialId String
  type       String                     // in | out | adjust | order
  change     Int
  after      Int
  note       String?
  orderCode  String?
  by         String
  at         DateTime @default(now())
  @@index([materialId, at])
  @@index([orderCode])
}
```

- **Seed** từ `bo/src/lib/inventory/mock.ts` để các id khớp với cấu hình Thủ công mặc định (`bo/src/lib/craft/default-config.ts`).
- `usage` không lưu riêng: tính từ cấu hình Thủ công mỗi lần đọc (dữ liệu nhỏ), hoặc cache lại sau mỗi lần `PUT` cấu hình.
- Nếu không muốn mất lịch sử khi xóa nguyên liệu, đổi `onDelete: Cascade` thành xóa mềm (`deletedAt`).

## 10. BO đã có gì

Trang **Kho nguyên liệu** (`/inventory`):

- **Thống kê:** tổng nguyên liệu, sắp hết, hết hàng, chưa dùng trên web.
- **Khối "Cần nhập thêm":** nguyên liệu hết hoặc sắp hết, kèm bước đang dùng chúng; bấm để mở.
- **Bộ lọc:**
  - trạng thái trên URL (`?status=out|low|ok|untracked|unused`), có số đếm từng trạng thái;
  - tìm theo tên, mã hoặc id; lọc theo loại;
  - sắp xếp "Cần nhập trước" (mặc định), "Tên A–Z", "Mới cập nhật".
- **Bảng:** tồn kho kèm thanh mức, ngưỡng sắp hết, "Dùng trên web", thời gian cập nhật, nút **+** để nhập nhanh.
- **Drawer nguyên liệu** (`?material=<id>` hoặc `?material=new`):
  - số tồn hiện tại và phiếu nhanh: nhập thêm, xuất, kiểm kê;
  - thông tin: tên, mã, loại, đơn vị (Cái / Gram / Mililít), theo dõi tồn hay không, ngưỡng sắp hết, màu, ghi chú;
  - danh sách lựa chọn đang dùng, bấm để sang trang Thủ công;
  - 20 phiếu gần nhất.
- **Nút "Phiếu kho":** ghi phiếu cho bất kỳ nguyên liệu nào, có xem trước số tồn sau phiếu.
- **Chặn xuất quá tồn** ở cả drawer và modal phiếu, kèm gợi ý dùng Kiểm kê.
- **Tạo nguyên liệu có tồn ban đầu** (từ Kho hoặc từ trang Thủ công) tự ghi phiếu "Tồn ban đầu".
- **Ô chọn nguyên liệu** tìm không phân biệt dấu ("sap dau" ra "Sáp đậu nành").
- **Phiếu kho gần đây:** 8 phiếu mới nhất của cả kho.
- **Ở các chỗ khác:**
  - menu "Kho nguyên liệu" có badge số nguyên liệu hết hàng;
  - chuông thông báo báo hết hàng / sắp hết, bấm mở thẳng trang Kho đã lọc;
  - ô tìm kiếm trên header tìm được nguyên liệu;
  - trang Thủ công tạo được nguyên liệu mới khi thêm lựa chọn (kể cả mã hũ / nắp cho từng cỡ). Nguyên liệu đó thuộc bản nháp ("Chờ lưu") và **chỉ vào Kho khi bấm Lưu** trên trang Thủ công; Bỏ thay đổi, xóa lựa chọn hay hoàn tác bước thì không tạo gì trong Kho. Khi có BE: tạo nguyên liệu (`POST /api/admin/inventory`) rồi mới `PUT` cấu hình, trong cùng một lần Lưu.
