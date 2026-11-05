# Thủ công

**Đường dẫn:** `/craft`

**Mục đích:** cấu hình các bước khách tự phối nến: hũ, sáp, mùi hương, bấc, màu, trang trí, cá nhân hóa. Đặc tả kỹ thuật ở [craft-builder.md](../craft-builder.md).

## Bố cục

- **Thẻ thống kê:** Bước đang hiện, Lựa chọn đang bán, Đang bị khóa, Giá thấp nhất.
- **Cảnh báo giá:** số cỡ, lựa chọn cần xem lại giá bán, xem mục Giá bán và giá vốn.
- **Đầu trang:** Cấu hình mẫu, Xuất JSON (tải file cấu hình đang sửa), trạng thái Đã lưu.
- **Danh sách bước (trái):** thứ tự, thêm bước. Kéo tay nắm ⠿ để đổi thứ tự, bằng chuột, chạm hoặc bàn phím (Tab tới tay nắm, Space nhấc, mũi tên, Space đặt). Bước có thay đổi chưa lưu có dấu chấm, bước đang ẩn có icon con mắt gạch.
- **Trình sửa bước (phải):** các tab theo loại bước.

| Tab | Nội dung |
|---|---|
| Hũ / Lựa chọn | Danh sách lựa chọn, phụ thu (bước Hũ: giá theo từng cỡ), giá vốn tối thiểu, thêm, sửa, xóa |
| Ô nhập & tuỳ chọn | Ô chữ và tuỳ chọn thêm của bước Cá nhân hóa |
| Cài đặt | Tên và mô tả bước (Việt, Anh), icon, các thiết lập riêng của bước, xóa bước |
| Xem trước | Bước này hiện trên web ra sao |

## Lựa chọn và Kho

- Mỗi lựa chọn trỏ tới một nguyên liệu trong Kho, không giữ số tồn.
- **Hũ tính theo từng cỡ:** hũ 150ml, 200ml, 250ml là các mã khác nhau, nắp cũng vậy. Xem mục Hũ và kích thước.
- Ảnh được ưu tiên hơn màu khi hiển thị.
- Tạo lựa chọn với nguyên liệu mới thì nguyên liệu ở trạng thái **Chờ lưu**, chỉ vào Kho khi bấm Lưu. Bỏ thay đổi thì không tạo.

## Hũ và kích thước

Mỗi loại hũ có **giá riêng** và **các cỡ riêng**, không còn tab Kích thước chung.

- **Ở Kho:** nguyên liệu loại **Hũ & nắp** có ô **Loại hũ** (vd "Hũ thạch cao") và **Dung tích** (ml). Điền hai ô thì tên tự gợi ý "Hũ thạch cao 150ml". Tạo thêm "Hũ thạch cao 200ml" cùng loại thì loại hũ này có 2 cỡ. Nắp để trống Loại hũ.
- **Drawer sửa hũ:**
  - **Giá hũ**: giá ở cỡ nhỏ nhất.
  - **Loại hũ trong Kho**: chọn loại, các cỡ tự hiện theo mã hũ cùng loại, xếp theo dung tích.
  - Mỗi cỡ một khối: tích **Bán**, **Phụ thu cỡ**, **Sáp đổ** (g, mặc định 80% dung tích), **Cháy (giờ)**, **Nắp** (khi bật Có nắp), tồn của mã hũ, và dòng "Khách trả X · Vốn Y · lãi Z%".
- **Giá khách trả** = giá hũ + phụ thu cỡ (+ nắp, + các lựa chọn khác). Vd Hũ A 30.000 ₫: 150ml +0, 200ml +5.000. Hũ B 20.000 ₫: 150ml +0, 200ml +1.000.
- **Cỡ mới trong Kho:** trang báo "Kho có cỡ mới của “…” (300ml) — mở hũ để đặt giá và bán". Mở drawer thấy cỡ đó ghi "mới trong Kho", để tắt: đặt giá rồi tích Bán. Hũ đang tạo mới thì các cỡ tích sẵn.
- Đổi Loại hũ thì các cỡ đổi theo mã của loại mới. Trang Thủ công không tạo mã hũ; thêm cỡ là tạo hũ ở Kho.
- **Bảng bước Hũ:** cột **Giá theo cỡ** liệt kê giá khách trả từng cỡ đang bán, cột tồn kho theo cỡ.
- **Xem trước, popup Tự phối nến:** thẻ hũ ghi "từ X ₫", nút cỡ ghi giá đã cộng phụ thu cỡ. Đổi hũ trong popup thì giữ cỡ cùng dung tích nếu hũ mới có.
- **Cấu hình cũ** tự chuyển, giá khách trả không đổi: giá hũ = phụ thu hũ cũ + giá bán gốc cỡ nhỏ nhất, phụ thu cỡ = phần chênh. Kho cũ tự đoán Loại hũ và Dung tích theo tên dạng "Hũ gốm trụ 150ml".

## Chọn 1 hoặc chọn nhiều

Mọi bước dạng thẻ và bảng màu, gồm cả bước tạo mới, có cài đặt **Số lựa chọn** ở tab Cài đặt: **Chọn 1** hoặc **Chọn nhiều**, kèm ô **Tối đa** từ 2 trở lên. Để trống Tối đa là không giới hạn, ô này khóa ở 1 khi Chọn 1. Bước mới mặc định Chọn 1. Sáp, Màu sáp, Trang trí mặc định Chọn nhiều. Bước Mùi hương dùng cài đặt riêng là số mục phối tối đa.

Vượt số tối đa thì mục chọn sớm nhất tự bỏ. Đổi giữa Chọn 1 và Chọn nhiều thì số Tối đa được xóa.

Mỗi lựa chọn có công tắc **Đứng một mình**: chọn mục này thì bỏ các mục khác và ngược lại. Không mùi, Không màu, Không trang trí đang bật sẵn.

## Giá theo lượng (sáp, màu, mùi hương)

Sáp, màu sáp, mùi hương không có phụ thu cố định mà tính theo **lượng dùng cho hũ đã chọn**.

- **Giá bán theo đơn vị:** drawer lựa chọn có ô **Giá bán / 100 g** (sáp) hoặc **Giá bán / ml** (màu, tinh dầu). Bảng lựa chọn có cột cùng tên.
- **Khách trả** = lượng × giá này, làm tròn tới 100 ₫. Vd sáp đậu nành nhập 1.000 ₫/100 g, bán 2.000 ₫/100 g; hũ 150ml đổ 120 g sáp → 120 × 2.000 / 100 = **2.400 ₫**.
- **Lượng:** sáp = số gram sáp đổ của cỡ hũ; màu = gram sáp × 1 ml/100 g; hương = gram sáp × tỉ lệ độ đậm.
- **Chọn nhiều** (nhiều sáp, nhiều màu, phối hương): lượng chia theo % từng loại (mặc định chia đều, admin điền lượng thì theo lượng đó), mỗi loại một dòng giá rồi cộng lại. Vd 2 loại sáp ở hũ 160 g: 80 g × giá loại 1 + 80 g × giá loại 2.
- Drawer hiện ví dụ ở hũ nhỏ nhất: "Vd Hũ gốm 150ml (120 g sáp): 120 g × 10.000 ₫/100 g = 12.000 ₫".
- **So giá vốn:** giá bán mỗi 100 g / mỗi ml ≥ giá nhập bình quân cùng đơn vị (cột "Vốn 9.000 ₫/100 g · lãi 50%"). Gợi ý giá bán làm tròn lên 100 ₫.
- Xem trước và popup Tự phối nến: thẻ ghi "18.000 ₫/100 g"; dòng giá ghi "Sáp đậu nành 120 g", "Vanilla 9,6 ml".
- Không mùi, Không màu và mục chưa đặt giá: 0 ₫.
- Cấu hình cũ có phụ thu cố định: tự đổi ra giá theo lượng của hũ 160 g sáp (gần đúng), cần xem lại.

## Mùi hương

Giá theo ml, xem mục Giá theo lượng. Lượng hương = lượng sáp của cỡ × tỉ lệ độ đậm (Nhẹ 6%, Vừa 8%, Đậm 10%) × % phối. Đậm hơn thì nhiều ml hơn nên giá tự tăng; không còn Phụ thu hương hay phụ thu riêng của Độ đậm.

## Màu sáp

Màu nhuộm tính theo ml. Hệ số mặc định 0,01, tức 1 ml cho 100 g sáp. Chọn nhiều màu thì lượng mặc định chia đều, giá theo lượng từng màu.

## Bước Sáp

Không còn lựa chọn Sáp pha trộn: muốn pha thì chọn nhiều loại khi tạo đơn, lượng mặc định chia đều, giá theo lượng từng loại. Nguyên liệu Sáp pha trộn vẫn còn trong Kho, ở trạng thái chưa dùng trên web.

## Bản nháp và Lưu

Mọi sửa đổi vào bản nháp. Web, Kho, tạo đơn chỉ dùng bản đã lưu.

- **Thanh lưu:** số thay đổi và số bước bị ảnh hưởng, các nút Xem thay đổi, Bỏ thay đổi, Lưu thay đổi.
- **Xem thay đổi:** liệt kê từng trường cũ → mới theo từng bước, hoàn tác từng bước, danh sách nguyên liệu mới.
- **Có lỗi vẫn lưu được:** hệ thống hỏi lại và liệt kê lỗi.
- **Dùng mẫu:** đưa cấu hình mẫu vào bản nháp, chỉ có hiệu lực khi Lưu.

## Giá bán và giá vốn

Hai giá khác nhau, không tự gộp:

| | Giá bán | Giá vốn |
|---|---|---|
| Là gì | Khách trả | Xưởng tốn nguyên liệu |
| Từ đâu | Giá bán gốc theo cỡ + phụ thu lựa chọn, admin nhập tay ở trang này | Lượng nguyên liệu × giá nhập bình quân trong [Kho](./inventory.md#giá-nhập) |
| Đổi khi | Admin sửa và Lưu | Nhập lô, sửa giá, mẻ sản xuất |

Giá bán không tự chạy theo giá vốn để giá trên web không nhảy mỗi lần nhập lô. Thay vào đó, **mỗi ô giá có giá vốn tối thiểu ngay bên cạnh**: giá bán nên ≥ giá vốn của đúng phần ô đó trả, không tính trùng.

| Ô giá | Trả cho | Giá vốn tối thiểu, vd dữ liệu mẫu |
|---|---|---|
| **Giá hũ + phụ thu cỡ** (từng cỡ trong drawer hũ) | Mã hũ cỡ đó và mục mặc định của các bước bắt buộc tính giá cố định (vd bấc) | Bát thạch cao 200ml: 35.000 + bấc cotton 1.500 ₫ = 36.500 ₫. Hũ tự sản xuất thì giá hũ là giá vốn bình quân các mẻ |
| **Giá bán / 100 g, / ml** (sáp, màu, hương) | Nguyên liệu đó theo lượng | Sáp ong: vốn 22.000 ₫/100 g. Rose: vốn 3.500 ₫/ml |
| **Phụ thu lựa chọn** ở bước bắt buộc tính giá cố định (Bấc…) | Phần đắt hơn mục mặc định, vì giá hũ đã trả mục mặc định | Bấc gỗ: 4.500 − 1.500 = 3.000 ₫ |
| **Phụ thu lựa chọn** ở bước không bắt buộc (Trang trí…) | Cả giá nguyên liệu của nó | Hoa khô: 6.000 ₫ |
| **Phụ thu nắp** (drawer hũ, dưới ô Phụ thu nắp) | Mã nắp của cỡ khách chọn, so ở cỡ có nắp đắt nhất | Nắp thiếc 5.000 ₫: phụ thu 0 ₫ là thấp hơn vốn. Nắp gốm 12.000 ₫ |
| **Phụ thu ô nhập, tuỳ chọn thêm** (bước Cá nhân hóa) | 1 cái nguyên liệu gắn kèm | In tên lên nhãn: nhãn decal 1.500 ₫. Hộp quà: 25.000 ₫ |

- **Mục mặc định** của bước: lựa chọn đang bán có phụ thu thấp nhất, bằng nhau thì giá vốn thấp hơn (vd Bấc cotton). Cột ghi "Tính trong giá hũ".
- **Cỡ để so:** phụ thu cố định so ở cỡ thiếu nhiều nhất, ghi kèm "cỡ 250ml". Bước Hũ: bảng hiện cỡ tệ nhất, từng cỡ xem trong drawer hũ. Sáp, màu, hương so theo đơn vị nên không phụ thuộc cỡ.
- **Trạng thái** dưới số vốn:
  - **Thấp hơn vốn X ₫** (đỏ): giá bán thấp hơn giá vốn tối thiểu.
  - **lãi Y%** (phụ). Dưới **Lãi tối thiểu** ở [Cài đặt](./settings.md) (mặc định 50%) thì màu cam kèm ⚠.
  - Đầu trang có thông báo đếm số cỡ, nắp (theo hũ), lựa chọn, ô nhập và tuỳ chọn thêm đang bán cần xem lại.
- **Gợi ý giá** (nút "Gợi ý …", chỉ hiện khi cần xem lại và cao hơn giá đang đặt, chỉ điền khi bấm): giá vốn tối thiểu × **Hệ số gợi ý giá** (mặc định ×2,5), không thấp hơn mức đạt lãi tối thiểu, làm tròn lên 5.000 ₫ (giá theo lượng làm tròn lên 100 ₫). Có ở từng cỡ trong drawer hũ (điền Phụ thu cỡ = giá gợi ý − giá hũ) và dưới ô giá trong drawer lựa chọn (tính theo phụ thu và nguyên liệu đang nhập, chưa cần Áp dụng).
- Nguyên liệu chưa có giá nhập: ghi "Thiếu giá N nguyên liệu", giá vốn đang thiếu phần đó. Nguyên liệu không theo dõi tồn không tính, giống giá vốn ở đơn hàng.
- **Ô nhập chữ** có thể gắn nguyên liệu (**Nguyên liệu trừ khi khách nhập**, vd nhãn decal): khách có nhập thì trừ 1 cái, hết thì không thêm được vào đơn. Cấu hình mẫu gắn "Chữ in trên nhãn" với nhãn decal. Ô không gắn nguyên liệu thì không so giá.
- Đơn hàng giữ cách cũ: giá bán chốt lúc tạo đơn, giá vốn cả hũ chốt lúc Bắt đầu làm.

## Kiểm tra cấu hình

- **Lỗi:** không có đúng 1 bước Hũ, chưa bật bước nào, tắt bước Hũ, không còn kích thước đang bán, bước bắt buộc không có lựa chọn hoặc không còn lựa chọn bán được.
- **Cảnh báo:** hũ chưa chọn kích thước đổ được hoặc chưa gắn mã theo cỡ, lựa chọn gắn với nguyên liệu không còn tồn tại, quy tắc "chỉ dùng với" nhắc tới lựa chọn đã xóa, bước không bắt buộc chưa có lựa chọn, bước nhập chưa bật ô nào.

## Liên kết trang khác

- **Tạo đơn:** popup Tự phối nến dùng bản đã lưu, các bước đang bật, và cho chỉnh lượng từng nguyên liệu trên từng cây nến.
- **Sản phẩm trưng bày:** danh sách Loại sáp lấy từ bước Sáp.
- **Kho:** hiện lựa chọn nào đang dùng nguyên liệu đó.

## Trên web

Trang Thủ công của web dựng theo đúng cấu hình đã lưu: các bước đang bật, thứ tự, Số lựa chọn, giá, phụ thu hương, quy tắc "chỉ dùng với". Mỗi lần hiện một bước. Bấm Lưu thay đổi ở BO rồi tải lại trang web là thấy, tồn kho cũng cập nhật theo số dùng được.

Khách không có ô Lượng cho 1 hũ, ô này chỉ có ở BO.

Đây là cầu nối tạm khi chạy trên máy. Khi có BE, web đọc cấu hình từ API.

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md).

**Đã có test:**

- `craft-builder`: dựng cấu hình từ đầu trên kho của E2E 1, hũ theo Loại hũ (cỡ từ Kho, phụ thu cỡ, nắp), gắn kho, bản nháp, lưu, bỏ thay đổi, xem trước khóa theo tồn.
- `craft-changes`, `orders-pending`: danh sách thay đổi, hoàn tác từng bước, nguyên liệu chờ lưu.
- `craft-drag`: kéo thả thứ tự bước bằng chuột và bàn phím.
- `craft-wax`, `craft-scent`, `craft-select`, `craft-exclusive`: chọn nhiều sáp, phụ thu theo tỉ lệ, phụ thu hương, màu theo ml, Chọn 1 / Chọn nhiều / Tối đa, Đứng một mình.
- `craft-fixes`: nút nhập nhanh, ảnh ưu tiên hơn màu.
- `craft-ui`: thẻ thống kê, sửa lựa chọn giữ quy tắc chỉ dùng với, xem trước, thêm / bật / đổi chỗ / xóa bước, lựa chọn kèm nguyên liệu mới, icon và tên tiếng Anh, bước Cá nhân hóa, bước Hũ không còn tab Kích thước, giá theo cỡ, Cấu hình mẫu, Xuất JSON, điện thoại.
- `craft-pricing`: bảng Hũ hiện giá theo từng cỡ; drawer hũ so khách trả với vốn hũ + sáp + bấc, giá hũ thấp hơn vốn báo đỏ, bấm gợi ý điền phụ thu cỡ; Kho thêm hũ cùng Loại hũ (tên tự điền) → Thủ công báo cỡ mới, cỡ mới để tắt, bật và đặt giá; Rose thấp hơn vốn, sáp mặc định tính trong giá hũ, sáp ong chỉ bù phần chênh, gợi ý phụ thu trong drawer; cột Giá bình quân ở Kho; Lãi tối thiểu và Hệ số ở Cài đặt.
- `price-guards`: drawer Hũ thiếc báo phụ thu nắp thấp hơn vốn nắp, gợi ý điền phụ thu nắp; bước Cá nhân hóa gắn nguyên liệu cho ô nhập, so phụ thu với vốn, gợi ý giá; cảnh báo đầu trang tính cả nắp.
- `logic/price-guards`: nắp so ở cỡ đắt nhất, bỏ qua hũ không nắp; ô nhập và tuỳ chọn thêm so với 1 cái nguyên liệu; nhập chữ in nhãn trừ 1 nhãn decal, bỏ trống không trừ, hết nhãn báo lỗi.
- `logic/craft-pricing`: giá khách trả = giá hũ + phụ thu cỡ; vốn hũ cỡ đó + sáp + bấc mặc định, thấp hơn vốn, lãi dưới mức, thiếu giá nhập; cột hũ lấy cỡ thiếu nhiều nhất; bước bắt buộc chỉ bù phần chênh, hương gồm phụ thu hương, lựa chọn mới chưa lưu; mã hũ cùng loại xếp theo dung tích, đoán loại hũ theo tên; chuyển cấu hình cũ giữ nguyên giá khách trả; giá gợi ý.
- `storefront-sync`: web chạy theo cấu hình BO. Chỉ chạy khi web chạy ở cổng 3000, không thì bỏ qua.
