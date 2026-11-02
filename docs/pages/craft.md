# Thủ công

**Đường dẫn:** `/craft`

**Mục đích:** cấu hình các bước khách tự phối nến: hũ, sáp, mùi hương, bấc, màu, trang trí, cá nhân hóa. Đặc tả kỹ thuật ở [craft-builder.md](../craft-builder.md).

## Bố cục

- **Thẻ thống kê:** Bước đang hiện, Lựa chọn đang bán, Đang bị khóa, Giá thấp nhất.
- **Danh sách bước (trái):** thứ tự, bật/tắt, đổi thứ tự, thêm bước. Bước có thay đổi chưa lưu có dấu chấm.
- **Trình sửa bước (phải):** các tab theo loại bước.

| Tab | Nội dung |
|---|---|
| Hũ / Lựa chọn | Danh sách lựa chọn, thêm, sửa, xóa |
| Ô nhập & tuỳ chọn | Ô chữ và tuỳ chọn thêm của bước Cá nhân hóa |
| Kích thước | Dung tích (ml), lượng sáp (g), giá gốc (chỉ bước Hũ) |
| Cài đặt | Tên và mô tả bước (Việt, Anh), icon, các thiết lập riêng của bước, xóa bước |
| Xem trước | Bước này hiện trên web ra sao |

## Lựa chọn và Kho

- Mỗi lựa chọn trỏ tới một nguyên liệu trong Kho, không giữ số tồn.
- **Hũ tính theo từng cỡ:** hũ 150ml, 200ml, 250ml là các mã khác nhau, nắp cũng vậy.
- Ảnh được ưu tiên hơn màu khi hiển thị.
- Tạo lựa chọn với nguyên liệu mới thì nguyên liệu ở trạng thái **Chờ lưu**, chỉ vào Kho khi bấm Lưu. Bỏ thay đổi thì không tạo.

## Chọn 1 hoặc chọn nhiều

Mọi bước dạng thẻ và bảng màu, gồm cả bước tạo mới, có cài đặt **Số lựa chọn** ở tab Cài đặt: **Chọn 1** hoặc **Chọn nhiều**, kèm ô **Tối đa** từ 2 trở lên. Để trống Tối đa là không giới hạn, ô này khóa ở 1 khi Chọn 1. Bước mới mặc định Chọn 1. Sáp, Màu sáp, Trang trí mặc định Chọn nhiều. Không màu, Không trang trí đứng một mình.

## Mùi hương

Tab Cài đặt có **Phụ thu hương**: mức chuẩn (%) và số tiền, mặc định 10% và 10.000 ₫. Tới mức chuẩn tính số tiền này, vượt thì tăng theo tỉ lệ ml. Đặt 0 ₫ là tắt. Phụ thu riêng của từng mùi và của Độ đậm vẫn cộng thêm.

## Màu sáp

Màu nhuộm tính theo ml. Hệ số mặc định 0,01, tức 1 ml cho 100 g sáp. Không màu đứng một mình, không chọn chung với màu khác.

## Bước Sáp

Không còn lựa chọn Sáp pha trộn: muốn pha thì chọn nhiều loại khi tạo đơn. Nguyên liệu Sáp pha trộn vẫn còn trong Kho, ở trạng thái chưa dùng trên web.

## Bản nháp và Lưu

Mọi sửa đổi vào bản nháp. Web, Kho, tạo đơn chỉ dùng bản đã lưu.

- **Thanh lưu:** số thay đổi và số bước bị ảnh hưởng, các nút Xem thay đổi, Bỏ thay đổi, Lưu thay đổi.
- **Xem thay đổi:** liệt kê từng trường cũ → mới theo từng bước, hoàn tác từng bước, danh sách nguyên liệu mới.
- **Có lỗi vẫn lưu được:** hệ thống hỏi lại và liệt kê lỗi.
- **Dùng mẫu:** đưa cấu hình mẫu vào bản nháp, chỉ có hiệu lực khi Lưu.

## Kiểm tra cấu hình

- **Lỗi:** không có đúng 1 bước Hũ, chưa bật bước nào, tắt bước Hũ, không còn kích thước đang bán, bước bắt buộc không có lựa chọn hoặc không còn lựa chọn bán được.
- **Cảnh báo:** hũ chưa chọn kích thước đổ được hoặc chưa gắn mã theo cỡ, lựa chọn gắn với nguyên liệu không còn tồn tại, bước không bắt buộc chưa có lựa chọn, bước nhập chưa bật ô nào.

## Liên kết trang khác

- **Tạo đơn:** popup Tự phối nến dùng bản đã lưu, các bước đang bật.
- **Sản phẩm trưng bày:** danh sách Loại sáp lấy từ bước Sáp.
- **Kho:** hiện lựa chọn nào đang dùng nguyên liệu đó.

## Chưa có

Web chưa đọc cấu hình này.
