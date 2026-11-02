# Mã giảm giá

**Đường dẫn:** `/discounts`, sửa `?edit=<id>`, tạo `?edit=new`

**Mục đích:** tạo và theo dõi mã khách dùng khi đặt hàng.

## Loại mã

| Loại | Cách tính |
|---|---|
| Giảm theo % | Tính trên các dòng trong phạm vi, làm tròn tới nghìn đồng, có thể đặt mức giảm tối đa |
| Giảm số tiền | Trừ thẳng, không vượt giá trị dòng trong phạm vi |
| Miễn phí giao hàng | Giảm đúng phí giao của đơn; đơn đang miễn phí giao thì mã không dùng được |

## Điều kiện

- **Phạm vi:** mọi sản phẩm, chỉ nến có sẵn, chỉ nến tự phối.
- **Đơn tối thiểu**, **chỉ khách đặt lần đầu**.
- **Thời gian:** ngày bắt đầu, ngày kết thúc (bỏ trống là không hết hạn).
- **Giới hạn:** tổng lượt dùng, số lượt mỗi khách.

## Trạng thái

Tự tính, thứ tự ưu tiên từ trên xuống:

| Trạng thái | Khi nào |
|---|---|
| Tạm dừng | Admin tắt |
| Hết hạn | Quá ngày kết thúc |
| Hết lượt | Đạt giới hạn lượt dùng |
| Lên lịch | Chưa tới ngày bắt đầu |
| Đang chạy | Còn lại |

## Trang danh sách

- **Thẻ thống kê:** Đang chạy (kèm số mã sắp hết hạn), Lên lịch, Tổng lượt dùng, Đã giảm cho khách.
- **Bộ lọc:** trạng thái, tìm mã hoặc mô tả.
- **Sắp xếp:** mới tạo, dùng nhiều nhất, sắp hết hạn.
- **Bảng:** mã có nút sao chép, ưu đãi, thời gian, lượt dùng, bật/tắt.

## Drawer tạo, sửa

Phiếu xem trước cập nhật theo form, sau đó là các khối Mã & mô tả, Ưu đãi, Điều kiện, Thời gian & giới hạn. Mã viết hoa không dấu, 4–20 ký tự, có nút tạo ngẫu nhiên. Mã đã có lượt dùng thì nên tạm dừng thay vì xóa. Có danh sách các đơn đã dùng mã.

## Lúc tạo đơn

Báo lỗi ngay tại ô mã: không có mã, tạm dừng, hết hạn, hết lượt, chưa tới ngày, chưa đủ đơn tối thiểu, không phải khách mới, hết lượt của khách, không đúng phạm vi.

## Lượt dùng

Tạo đơn tăng 1 lượt, hủy đơn trả lại 1 lượt. Mã đã trả lượt có thể dùng tiếp nếu còn hạn.
