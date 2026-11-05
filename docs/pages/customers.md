# Khách hàng

**Đường dẫn:** `/customers`, mở hồ sơ `?customer=<id>`

**Mục đích:** xem khách có tài khoản và khách đặt không đăng nhập, gộp theo số điện thoại.

## Phân loại tự động

Không tính đơn đã hủy.

| Nhóm | Điều kiện |
|---|---|
| VIP | Đã chi từ 3 triệu hoặc từ 4 đơn |
| Lâu chưa mua | Hơn 60 ngày chưa mua |
| Khách quen | Từ 2 đơn |
| Khách mới | 1 đơn |
| Chưa mua | Chưa có đơn thành công |

"Đã chi" là tiền thực nhận, gồm tiền cọc.

## Trang danh sách

- **Thẻ thống kê:** Khách hàng (kèm số mới 30 ngày), Tỷ lệ quay lại, Chi tiêu trung bình mỗi khách, Lâu chưa mua.
- **Bộ lọc:** nhóm khách, đã chặn, tìm theo tên, email hoặc số điện thoại, loại tài khoản, nhãn.
- **Sắp xếp:** mua gần đây, chi nhiều nhất, nhiều đơn nhất, mới tham gia.
- **Xuất Excel:** danh sách đang lọc ra file `khach-hang-YYYY-MM-DD.xlsx`; số đơn, đã chi và ngày là số thật trong Excel.

## Hồ sơ khách

| Khối | Nội dung | Thao tác |
|---|---|---|
| Tổng quan | Tên, nhóm, nhãn, đã chi, số đơn, trung bình, đơn gần nhất | Gọi, Zalo, Email |
| Đơn hàng | Các đơn, gồm đơn đã hủy | Tạo đơn cho khách này, mở đơn |
| Hay mua | Sản phẩm mua nhiều nhất | |
| Liên hệ | SĐT, email, địa chỉ đã giao | Sao chép |
| Nhãn & ghi chú | Chỉ nhân viên thấy | Sửa |
| Tài khoản | Có tài khoản, đăng ký nhận tin | Chặn khách |

## Chặn khách

Phải ghi lý do. Khách bị chặn có cảnh báo trên hồ sơ và đơn hàng. Tạo đơn cho khách này vẫn được nhưng phải xác nhận.

## Liên kết trang khác

- **Tạo đơn:** số điện thoại mới tự tạo hồ sơ khách vãng lai.
- **Mã giảm giá:** điều kiện khách lần đầu và giới hạn mỗi khách dựa trên đơn của số điện thoại. Hồ sơ có khối **Mã giảm giá riêng**: các mã chỉ khách này dùng được, nút **Tạo mã riêng cho khách**. Xem [Mã giảm giá › Mã riêng cho khách](./discounts.md#mã-riêng-cho-khách).

## Giao lỗi

Số lần giao không thành của khách hiện ở thẻ Số đơn trên hồ sơ, ở khối Khách hàng trong đơn và lúc tạo đơn cho số điện thoại này.

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md).

**Đã có test:**

- `customers`: mở hồ sơ, ghi chú, chặn và bỏ chặn, mở đơn từ hồ sơ và ngược lại, link sai, tìm kiếm.
- `customers-list`: thẻ thống kê, số đếm theo nhóm, tìm tên không dấu và số điện thoại, sắp xếp, khách vãng lai, xuất Excel, thêm nhãn rồi lọc theo nhãn, hay mua, điện thoại.
- `logic/customers`: phân loại VIP / Khách quen / Khách mới / Lâu chưa mua / Chưa mua theo ngưỡng, đã chi theo tiền thực nhận, số lần giao lỗi, hay mua, bộ lọc và 4 cách sắp xếp.
