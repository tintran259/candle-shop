# Dashboard

**Đường dẫn:** `/`

**Mục đích:** xem nhanh tình hình kinh doanh 30 ngày qua.

## Nội dung

| Khối | Hiển thị | Nguồn số liệu |
|---|---|---|
| Thẻ chỉ số | Doanh thu, Đơn hàng, Giá trị đơn trung bình, Khách hàng mới, kèm mức tăng giảm | **Số mẫu cố định** |
| Doanh thu | Biểu đồ theo ngày | **Số mẫu cố định** |
| Theo loại hương | Tỉ trọng doanh số | **Số mẫu cố định** |
| Đơn hàng gần đây | Các đơn mới nhất, bấm để mở | Dữ liệu đơn thật trong BO |
| Sản phẩm bán chạy | Xếp hạng sản phẩm | **Số mẫu cố định** |

## Chưa có

Các con số mẫu chưa thay đổi theo đơn hàng thật. Khi có BE cần API thống kê.

**Cần duyệt:** khi có API, doanh thu nên tính theo tiền thực nhận hay theo đơn Hoàn tất? Đề xuất: tính theo tiền thực nhận, bỏ đơn đã hủy.
