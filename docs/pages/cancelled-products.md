# Sản phẩm hủy đơn

**Đường dẫn:** `/cancelled-products`, xem chi tiết `?item=<id>`

**Mục đích:** quản lý nến thủ công đã làm xong nhưng đơn bị hủy. Chỉ có ở BO, không hiện trên web.

## Khi nào có bản ghi

Tự tạo khi hủy đơn có nến thủ công và:

- Đơn Đang làm, admin chọn "Đã làm".
- Hoặc đơn Chờ giao.
- Hoặc đơn Đã hoàn về, nến còn tốt.

| Trường hợp | Kết quả |
|---|---|
| 1 dòng nến tự phối, số lượng 2 | 1 sản phẩm, số lượng 2 |
| 2 cấu hình khác nhau trong đơn | 2 sản phẩm |
| Đơn có cả nến tự phối và nến có sẵn | Chỉ nến tự phối vào đây |
| Đơn toàn nến có sẵn | Không tạo gì, vì đã có ở Sản phẩm trưng bày |
| Đơn Đã hoàn về, nến hỏng | Không tạo gì |

## Trạng thái

| Trạng thái | Nghĩa |
|---|---|
| Chờ xử lý | Chưa quyết định |
| Đã tạo trưng bày | Đã tạo sản phẩm trưng bày, có link tới sản phẩm |
| Đã bỏ | Không dùng nữa, không hoàn tác được |

## Trang danh sách

- **Thẻ thống kê:** Tổng sản phẩm, Chờ xử lý, Đã tạo trưng bày, Đã bỏ.
- **Bộ lọc:** trạng thái, tìm theo tên, cấu hình, mã đơn, tên khách.
- **Bảng:** sản phẩm kèm cấu hình, đơn gốc, ngày và lý do hủy, số lượng, giá gốc, trạng thái, xử lý.
- **Nhãn "Có chữ riêng":** nến có chữ của khách, cần kiểm tra trước khi dùng lại.

Màn hẹp tự ẩn cột phụ để không cuộn ngang. Dưới 992px, 2 nút xử lý nằm trong drawer.

## Hai cách xử lý

Áp dụng cho cả số lượng của bản ghi.

1. **Tạo sản phẩm trưng bày:** sang trang Sản phẩm trưng bày, drawer đã điền sẵn thông tin. Tạo xong thì đổi nhãn "Đã tạo trưng bày". Đóng drawer thì vẫn Chờ xử lý.
2. **Bỏ:** xác nhận một bước, đổi nhãn "Đã bỏ".

## Quy tắc

- Không ảnh hưởng Kho: nguyên liệu đã trừ lúc bắt đầu làm.
- Tạo sản phẩm trưng bày thì công thức điền sẵn từ công thức lưu trên đơn.
- Link tạo từ bản ghi đã xử lý không mở lại được, tránh tạo trùng.
- Nến tự phối chưa có ảnh nên admin phải thêm ảnh mới tạo được sản phẩm.

## Chưa có

- Xử lý riêng từng cây trong cùng một bản ghi.
- Hoàn tác thao tác Bỏ.
