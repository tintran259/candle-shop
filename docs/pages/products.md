# Sản phẩm trưng bày

**Đường dẫn:** `/products`, lọc sẵn theo danh mục `?category=<id>`, sửa `?edit=<id>`, thêm mới `?edit=new`, tạo từ nến hủy `?edit=from:<id>`

**Mục đích:** quản lý các mẫu nến hiện trên web để khách đặt, xưởng làm trong 2–3 ngày.

Sản phẩm trưng bày **không có số tồn thành phẩm**. Khách đặt thì xưởng làm mới, nguyên liệu tính theo công thức của sản phẩm.

## Trang danh sách

- **Thẻ thống kê:** Sản phẩm, Đang bán, Đang giảm giá, Nổi bật.
- **Bộ lọc:** trạng thái (Tất cả, Đang bán, Tạm ẩn), tìm theo tên hoặc slug không dấu, danh mục, kích thước.
- **Sắp xếp:** mới nhất, bán chạy, nổi bật trước, giá tăng dần, giá giảm dần.
- **Kiểu xem:** bảng hoặc lưới. Điện thoại mặc định lưới.
- **Trên từng dòng:** bật/tắt bán, bật/tắt nổi bật, sửa. Xóa nằm trong drawer sửa hoặc khi chọn nhiều.
- **Chọn nhiều:** hiện, ẩn hoặc xóa hàng loạt.

## Drawer thêm, sửa

| Khối | Trường | Quy tắc |
|---|---|---|
| Thông tin cơ bản | Tên, slug, mô tả | Slug tự tạo theo tên, không được trùng |
| Giá | Giá bán, giá giảm | Giá giảm phải thấp hơn giá bán |
| Phân loại & đặc tính | Danh mục, kích thước, độ thơm, nốt hương, loại sáp, thời gian cháy | Danh mục bắt buộc, lấy từ trang [Danh mục](./categories.md), sản phẩm mới chọn sẵn danh mục đầu tiên đang hiện. Loại sáp lấy từ bước Sáp ở Thủ công |
| Công thức nguyên liệu | Nguyên liệu, lượng cho 1 cây | Sản phẩm mới bắt buộc ít nhất 1 nguyên liệu, không trùng. Chỉ chọn nguyên liệu có theo dõi tồn. Dưới công thức hiện giá vốn 1 cây và % lãi trên giá bán |
| Hình ảnh | Nhiều ảnh, ảnh đầu là ảnh chính | Bắt buộc ít nhất 1 ảnh |
| Hiển thị | Đang bán, nhãn Mới, Nổi bật | Tắt Đang bán thì ẩn khỏi web |
| Số liệu | Đánh giá, số đã bán | Chỉ xem khi sửa |

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
- `products`: thẻ thống kê, tab trạng thái, tìm, lọc kích thước và danh mục, sắp xếp, bảng / lưới, điện thoại mặc định lưới, công tắc nổi bật và đang bán, ẩn / hiện / xóa hàng loạt, thêm sản phẩm (slug theo tên, giá giảm, danh mục chọn sẵn, công thức không trùng, ảnh), slug trùng, sản phẩm chưa có công thức, đổi ảnh chính, xóa trong drawer.
- `logic/products`: bộ lọc và 5 cách sắp xếp, phần trăm giảm, chuyển form, tạo từ nến hủy đơn, nguyên liệu theo công thức (không công thức thì không giữ, không trừ Kho; chỉ đơn Đã thanh toán giữ; báo thiếu).
- Một phần ở `drawers`, `categories`, `cancelled-products`, `orders-decisions`.
