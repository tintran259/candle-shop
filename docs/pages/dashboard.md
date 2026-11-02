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

**Quy tắc đã chốt cho API:** doanh thu tính theo tiền thực nhận.

- Tính mọi khoản đã thu của đơn chưa hủy.
- Đơn đã hủy chỉ tính phần shop giữ lại, tức tiền đã thu trừ tiền đã hoàn. Ví dụ tiền cọc giữ lại khi lỗi do khách.
- Đơn đang chờ hoàn tiền tính theo số phải hoàn, để không ghi nhận khoản sắp trả lại.
