# Phần chung của BO

## Menu bên trái

| Nhóm | Mục | Số đỏ trên menu |
|---|---|---|
| Tổng quan | Dashboard | |
| Bán hàng | Đơn hàng | Đơn Chờ thanh toán, Đã thanh toán, Giao không thành, Đã hoàn về |
| | Sản phẩm trưng bày, Danh mục, Sản phẩm hủy đơn, Thủ công | |
| | Kho nguyên liệu | Nguyên liệu đã hết hàng |
| | Khách hàng, Đánh giá, Mã giảm giá | |
| Hệ thống | Cài đặt | |

Nút ở đầu trang thu gọn menu. Trên điện thoại, menu mở từ cạnh màn hình.

Cuối menu là tên tài khoản và nút **Đăng xuất**. Chưa đăng nhập thì mọi trang chuyển về [Đăng nhập](./login.md).

## Tìm kiếm trên header

Mở bằng ô tìm kiếm hoặc `Ctrl K`. Tìm không phân biệt dấu trong:

- Trang và thao tác nhanh: Thêm sản phẩm, Tạo mã giảm giá.
- Đơn hàng, khách hàng, sản phẩm trưng bày, mã giảm giá.
- Nguyên liệu và lựa chọn Thủ công.

Hiện kết quả mở gần đây khi chưa gõ. Chưa tìm được từng sản phẩm hủy đơn, danh mục và từng mục trong Cài đặt.

## Thông báo

Chuông trên header tự tổng hợp từ dữ liệu:

| Loại | Khi nào |
|---|---|
| Cần xử lý | Đơn trễ hạn làm xong; đơn cần xong hôm nay, ngày mai; đơn Giao không thành, Đã hoàn về; đơn chờ hoàn tiền; nguyên liệu hết hoặc sắp hết; mã giảm giá sắp hết hạn |
| Hoạt động mới | Đơn mới chờ thanh toán; đơn đã nhận cọc hoặc đã thanh toán |

Bấm một thông báo để mở đúng đơn hoặc đúng bộ lọc.

## Quy ước dùng chung

- **Drawer mở theo đường dẫn:** gửi link cho người khác sẽ mở đúng đơn, đúng sản phẩm. Nút Back đóng drawer.
- **Phân trang trên đường dẫn:** tải lại vẫn giữ trang đang xem.
- **Thay đổi chưa lưu:** đóng drawer sửa hoặc rời trang Cài đặt sẽ được hỏi lại.
- **Nút Dữ liệu mẫu:** có ở nhiều trang, xóa dữ liệu trên trình duyệt và quay về dữ liệu mẫu. Sẽ bỏ khi có BE.
- **Khung tải:** mỗi trang có skeleton đúng bố cục, chạy hết chiều rộng màn hình.

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md).

**Đã có test:**

- `common`: số đỏ menu Đơn hàng và Kho khớp dữ liệu, nhập kho thì số giảm; thông báo mở đúng chỗ, đánh dấu đã đọc; tìm kiếm `Ctrl K`, phím `/`, tìm không dấu đơn, khách, sản phẩm, nguyên liệu, mở gần đây, không có kết quả; thu gọn menu; menu điện thoại.
- `drawers`: mở drawer theo đường dẫn, Back đóng drawer, giữ trang khi mở và đóng, link sai báo không tìm thấy, nguyên liệu mở ở Kho.
- `chunk-reload`: lỗi tải code trang thì tự tải lại một lần, vẫn lỗi thì báo lỗi tiếng Việt và giữ menu.
- `layout-width`: nội dung và khung tải chạy hết chiều rộng, không tràn ngang.
