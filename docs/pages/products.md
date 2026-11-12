# Sản phẩm trưng bày

**Đường dẫn:** `/products`, lọc sẵn theo danh mục `?category=<id>`, sửa `?edit=<id>`, thêm mới `?edit=new`, tạo từ nến hủy `?edit=from:<id>`

**Mục đích:** quản lý các mẫu nến hiện trên web để khách đặt, xưởng làm trong 2–3 ngày.

Sản phẩm trưng bày **không có số tồn thành phẩm**. Khách đặt thì xưởng làm mới, nguyên liệu tính theo công thức của sản phẩm.

**Bắt đầu trống:** không còn sản phẩm mẫu. Mọi sản phẩm tạo mới bằng cách chọn nguyên liệu giống nến tự phối (mục Công thức theo Thủ công), nên khách đặt là giữ và trừ đúng Kho. Bỏ nút Dữ liệu mẫu.

## Trang danh sách

- **Thẻ thống kê:** Sản phẩm, Đang bán, Đang giảm giá, Nổi bật.
- **Bộ lọc:** trạng thái (Tất cả, Đang bán, Tạm ẩn), tìm theo tên hoặc slug không dấu, danh mục, kích thước.
- **Sắp xếp:** mới nhất, bán chạy, nổi bật trước, giá tăng dần, giá giảm dần.
- **Kiểu xem:** bảng hoặc lưới. Điện thoại mặc định lưới.
- **Trên từng dòng:** bật/tắt bán, bật/tắt nổi bật, sửa. Xóa nằm trong drawer sửa hoặc khi chọn nhiều.
- **Chọn nhiều:** hiện, ẩn hoặc xóa hàng loạt.

## Giá vốn

Giá bán (hoặc giá giảm nếu có) so với giá vốn công thức 1 cây theo **giá nhập bình quân hiện tại** trong Kho, không phải giá lúc tạo sản phẩm. Giá nhập tăng làm sản phẩm thấp hơn vốn, lãi dưới mức tối thiểu ở [Cài đặt](./settings.md), hoặc khách bỏ cọc thì lỗ (xem dưới) thì:

- Đầu trang có thông báo **N sản phẩm cần xem lại giá bán**, nút **Chỉ xem các sản phẩm này** để lọc (bấm lại **Xem tất cả**).
- Dưới giá trên bảng và thẻ lưới có nhãn **Thấp hơn vốn X ₫** (đỏ), **Bỏ cọc lỗ X ₫** hoặc **Lãi thấp Y%** (cam), rê chuột xem giá vốn và phép tính khi bỏ cọc.
- Không tự đổi giá; mở sản phẩm để xem gợi ý giá dưới ô Giá bán. Sản phẩm chưa có công thức không kiểm tra.
- Dưới ô giá có dòng "Khách cọc 50% rồi không nhận: cọc … − nguyên liệu … − ship … = còn / lỗ …", lỗ thì ghi giá thấp nhất để không lỗ.
- **Gợi ý giá** lấy mức cao nhất của: giá vốn × hệ số, mức đạt lãi tối thiểu, mức đủ bù khi khách bỏ cọc.

**Khách chỉ cọc rồi không nhận hàng:** cọc (% ở Cài đặt, trên giá bán) − nguyên liệu − **phí giao của phương thức mặc định** (phương thức đang bật đầu tiên ở Cài đặt › Phí vận chuyển) phải ≥ 0. Kiểm tra lúc đặt giá sản phẩm, không báo lúc tạo đơn (giá trên đơn đã theo giá sản phẩm). Giá thấp nhất để không lỗ = (nguyên liệu + phí ship) ÷ % cọc, làm tròn lên 5.000 ₫. Vd nguyên liệu 90.000 ₫, cọc 50%, phí giao 30.000 ₫ → bán 200.000 ₫ thì lỗ 20.000 ₫ khi khách bỏ cọc, cần từ 240.000 ₫. Chỉ áp cho giá trọn một cây, không áp cho phụ thu lẻ ở Thủ công (hương, nắp, ô nhập).

## Drawer thêm, sửa

| Khối | Trường | Quy tắc |
|---|---|---|
| Thông tin cơ bản | Tên, slug, mô tả | Slug tự tạo theo tên, không được trùng |
| Giá (dưới phần nguyên liệu) | Giá bán, giá giảm | Giá giảm phải thấp hơn giá bán. Dưới ô giá có Vốn · lãi và Gợi ý giá bán |
| Nguyên liệu | Các bước Thủ công giống popup Tự phối nến | Xem mục Công thức theo Thủ công |
| Phụ kiện khác | Nguyên liệu từ Kho, lượng và giá bán cho 1 cây | Không trùng; giá bán không bắt buộc |
| Tóm tắt nguyên liệu | Mô tả, cỡ, giá theo Thủ công, giá vốn, công thức, số cây Kho đủ làm | Chỉ xem, có nút Dùng giá này |
| Phân loại & đặc tính | Danh mục, concept, độ thơm, nốt hương, thời gian cháy | Danh mục bắt buộc, lấy từ trang [Danh mục](./categories.md), sản phẩm mới chọn sẵn danh mục đầu tiên đang hiện. Concept (dịp lễ) không bắt buộc, chọn nhiều, lấy từ trang [Concept](./concepts.md). Cỡ trên web và loại sáp tự suy ra, không chọn tay |
| Hình ảnh | Nhiều ảnh, ảnh đầu là ảnh chính | Bắt buộc ít nhất 1 ảnh |
| Hiển thị | Đang bán, nhãn Mới, Nổi bật | Tắt Đang bán thì ẩn khỏi web |
| Số liệu | Đánh giá, số đã bán | Chỉ xem khi sửa |

## Công thức theo Thủ công

Phần nguyên liệu của form **giống popup Tự phối nến** ở Đơn hàng (dùng chung component): đi theo các bước đang hiện ở [Thủ công](./craft.md), bỏ bước Cá nhân hóa (khắc chữ, lời nhắn là của từng khách).

- **Các bước:** thẻ hũ kèm nút cỡ và ô thêm nắp, thẻ sáp (chọn nhiều), mùi hương kèm độ đậm và ô **Lượng cho 1 hũ**, bấc, màu, trang trí. Lựa chọn hết nguyên liệu bị khóa kèm lý do. Thẻ ghi giá theo Thủ công (hũ "từ X ₫", sáp "18.000 ₫/100 g"…).
- **Bắt buộc** với sản phẩm mới: chọn đủ các bước bắt buộc. Thiếu thì báo "Còn N bước cần chọn lại." và ghi lỗi ngay dưới từng bước.
- **Phụ kiện khác:** nguyên liệu không có ở các bước Thủ công (bao bì, phụ kiện…), chọn thẳng từ Kho kèm lượng cho 1 cây, không trùng. Mỗi dòng có **Giá bán** riêng (giá của lượng đó trên 1 cây); dưới dòng hiện vốn của lượng đó theo giá nhập bình quân, trạng thái (thấp hơn vốn / lãi %) và nút gợi ý giá theo hệ số và lãi tối thiểu ở Cài đặt. Để trống giá thì coi như tặng kèm ("Chưa tính tiền khách"). Tóm tắt nguyên liệu tách **Giá theo Thủ công** + **Phụ kiện khác** = **Giá tham khảo**, nút Dùng giá này điền tổng. Nến hủy đơn và sản phẩm cũ chỉ có công thức thì công thức đó nằm ở đây, không bắt buộc chọn các bước.
- **Tóm tắt nguyên liệu** (giống cột phải của popup): mô tả cấu hình, cỡ trên web theo dung tích hũ (vd "Nhỏ (150ml, 120 g sáp, cháy ~25 giờ)"), **Giá theo Thủ công** kèm nút **Dùng giá này**, giá vốn nguyên liệu, nguyên liệu cho 1 cây (trừ Kho) kèm số tồn, **Kho đủ làm N cây**.
- **Giá bán, Giá giảm** nằm **dưới** phần nguyên liệu. Ngay dưới ô giá: "Vốn X · lãi Y%" so với giá thực bán (giá giảm nếu có), thấp hơn vốn báo đỏ, lãi dưới mức tối thiểu ở [Cài đặt](./settings.md) báo cam, kèm nút **Gợi ý giá bán** (giá vốn × hệ số, làm tròn lên 5.000 ₫, điền Giá bán và bỏ giá giảm).
- **Tự suy ra, không chọn tay:**
  - công thức trừ Kho = nguyên liệu theo lựa chọn (như nến tự phối) + phụ kiện khác, cùng nguyên liệu thì cộng;
  - cỡ trên web (Nhỏ / Vừa / Lớn) theo dung tích hũ: ≤ 150ml Nhỏ, ≤ 220ml Vừa, lớn hơn là Lớn;
  - loại sáp: tên các loại sáp đã chọn, vd "Sáp đậu nành + Sáp dừa";
  - thời gian cháy để trống thì lấy giờ cháy đã đo của cỡ hũ.
- Lưu cả lựa chọn (`build.selection`) và phụ kiện (`build.extras`) để mở lại đúng như lúc tạo.

## Công thức và Kho

- **Giữ:** đơn nhận cọc hoặc đủ tiền thì giữ nguyên liệu theo công thức.
- **Trừ:** bấm Bắt đầu làm thì trừ theo công thức × số lượng.
- **Đổi công thức:** đơn đã bắt đầu làm không đổi, đơn chưa làm dùng công thức mới.
- **Sản phẩm cũ chưa có công thức:** vẫn bán được nhưng không giữ, không trừ Kho, có nhãn "Chưa có công thức". Sửa sản phẩm để thêm.

## Tạo từ nến hủy đơn

Từ trang [Sản phẩm hủy đơn](./cancelled-products.md), drawer mở với tên, slug, giá, mô tả, ảnh, công thức đã điền sẵn và ghi rõ nguồn đơn hủy. Công thức lấy từ nến tự phối trên đơn; bản ghi cũ chưa có công thức thì admin tự nhập. Tạo thành công thì bản ghi hủy đơn đổi nhãn. Đóng drawer thì không đổi gì.

## Chưa có

- **Giới hạn số lượng** khi sản phẩm tạo từ một cây nến hủy: khách vẫn đặt được nhiều lần.

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md).

**Đã có test:**

- `workshop-cost`: giá vốn 1 cây và % lãi trong form sản phẩm.
- `products`: thẻ thống kê, tab trạng thái, tìm, lọc kích thước và danh mục, sắp xếp, bảng / lưới, điện thoại mặc định lưới, công tắc nổi bật và đang bán, ẩn / hiện / xóa hàng loạt, thêm sản phẩm (slug theo tên, giá giảm, danh mục chọn sẵn, chọn nguyên liệu giống nến tự phối, thiếu bước báo lỗi dưới từng bước, Giá nằm dưới phần nguyên liệu, tóm tắt cỡ và số cây Kho đủ làm, công thức, cỡ trên web, loại sáp, giờ cháy tự suy ra, ảnh), slug trùng, sản phẩm chưa có công thức, đổi ảnh chính, xóa trong drawer.
- `start-empty`: Đơn hàng, Sản phẩm trưng bày, Sản phẩm hủy đơn bắt đầu trống, không còn nút Dữ liệu mẫu, Kho giữ nguyên.
- `price-guards`: sản phẩm bán thấp hơn vốn có thông báo, nhãn cạnh giá, lọc riêng rồi xem lại tất cả.
- `logic/price-guards`: so theo giá giảm nếu có, không có công thức thì bỏ qua, giá nhập tăng thì sản phẩm vào danh sách cần xem lại, bộ lọc.
- `logic/products`: bộ lọc và 5 cách sắp xếp, phần trăm giảm, chuyển form, tạo từ nến hủy đơn (công thức vào phụ kiện khác), sản phẩm cũ giữ công thức, chọn giống nến tự phối (công thức theo lựa chọn + phụ kiện, cỡ theo dung tích, loại sáp, giờ cháy theo cỡ, bỏ bước Cá nhân hóa), nguyên liệu theo công thức (không công thức thì không giữ, không trừ Kho; chỉ đơn Đã thanh toán giữ; báo thiếu).
- Một phần ở `drawers`, `categories`, `cancelled-products`, `orders-decisions`.
