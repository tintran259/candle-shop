# Đơn hàng

**Đường dẫn:** `/orders`, mở đơn `?order=<id>`, tạo đơn `?order=new`

**Mục đích:** theo dõi đơn từ lúc đặt tới khi giao xong. Quy trình đầy đủ ở [Workflow](../workflow.md).

## Trạng thái

| Trạng thái | Nghĩa | Nút bước tiếp | Hủy được |
|---|---|---|---|
| Chờ thanh toán | Khách chưa trả cọc hoặc tiền | Xác nhận đã thanh toán | Có |
| Đã thanh toán | Đã nhận cọc hoặc đủ tiền | Bắt đầu làm | Có |
| Đang làm | Xưởng đang đổ và ủ hương | Đã làm xong | Có |
| Chờ giao | Đã làm xong | Giao cho vận chuyển | Có |
| Đang giao | Bên vận chuyển đang giao | Khách đã nhận, Giao không thành | Không |
| Giao không thành | Giao lỗi, chờ quyết định | Giao lại, Hoàn về | Không |
| Đang hoàn về | Hàng đang về shop | Đã nhận lại hàng | Không |
| Đã hoàn về | Hàng đã về shop | Gửi lại đơn | Có |
| Hoàn tất | Khách đã nhận, đã thu đủ tiền | | Không |
| Đã hủy | Đơn đã hủy | | |

## Trang danh sách

- **Thẻ thống kê:** Chờ thanh toán, Cần làm (kèm số đơn trễ hạn), Chờ giao, Giao lỗi cần xử lý, Còn phải thu.
- **Tab trạng thái:** có số đếm từng trạng thái.
- **Bộ lọc:** tìm theo mã đơn, tên không dấu, số điện thoại; lọc tình trạng thanh toán; khoảng ngày đặt.
- **Sắp xếp:** mới đặt nhất, sắp tới hạn làm xong, tổng tiền cao nhất.
- **Bảng:** mã đơn, khách, sản phẩm, ngày làm xong kèm cảnh báo hạn, thanh toán, trạng thái, tổng tiền.

## Tạo đơn hàng

Drawer 2 cột trên màn rộng: form bên trái, tóm tắt dính bên phải.

| Khối | Trường | Quy tắc |
|---|---|---|
| Khách hàng | Hồ sơ có sẵn, tên, SĐT, email, kênh đặt, địa chỉ | SĐT trùng hồ sơ thì tự nhận ra khách. Khách bị chặn thì hỏi lại trước khi tạo |
| Sản phẩm | Nến có sẵn, Tự phối nến, số lượng | Sản phẩm đang ẩn vẫn chọn được, có nhãn "Đang ẩn". Thiếu nguyên liệu cho cả đơn thì chặn, tính trên số dùng được |
| Giao hàng | Phương thức, phí vận chuyển, ngày xưởng làm xong | Phí tự điền theo phương thức, sửa được cho đơn này. Mặc định xong sau 3 ngày |
| Thanh toán | Mã giảm giá, cọc hoặc trả đủ, kênh thanh toán, đã nhận tiền, mã giao dịch | % cọc lấy từ Cài đặt |
| Ghi chú | Ghi chú của khách, ghi chú nội bộ | |

**Popup Tự phối nến:** đi theo các bước đang bật ở Thủ công. Lựa chọn hết nguyên liệu bị khóa kèm lý do, phần đang giữ cho đơn khác không tính là còn. Tóm tắt bên phải hiện mô tả gửi xưởng, giá 1 hũ, nguyên liệu cần và số hũ Kho làm được. Tiêu đề và nút thêm luôn hiện, chỉ phần chọn cuộn.

- **Số lựa chọn mỗi bước:** chọn 1 hoặc nhiều mục, trong giới hạn Tối đa, theo cài đặt ở Thủ công. Chọn Không màu hoặc Không trang trí thì bỏ các mục khác.
- **Lượng cho 1 hũ:** mỗi nguyên liệu đã chọn (sáp, mùi hương, bấc, màu, trang trí, tuỳ chọn thêm) có ô nhập lượng theo đơn vị của nguyên liệu. Để trống thì theo mặc định, hiện mờ trong ô. Hũ và nắp luôn 1 cái nên không có ô này.
- **Mặc định khi nhiều loại sáp:** chia đều khối lượng nến, ví dụ hũ 150g chọn 2 loại thì mỗi loại 75g. Tổng sáp có thể khác mặc định, hệ thống chỉ hiện để đối chiếu, không chặn.
- **Giá:** phụ thu tính theo tỉ lệ. Sáp theo gram, làm tròn tới nghìn đồng, ví dụ Sáp dừa +25.000 ₫ chiếm 60g trong 160g thì cộng 9.000 ₫. Màu sáp theo ml tương tự. Mùi hương theo ml nếu admin điền, khi đó ô Tỉ lệ phối được ẩn, không điền thì theo tỉ lệ phối.
- **Phụ thu hương:** lượng hương tới mức chuẩn tính phụ thu mặc định, vượt thì tăng theo tỉ lệ ml. Ví dụ chuẩn 10% với hũ 120g sáp là 12 ml, phụ thu 10.000 ₫: điền 18 ml thành 15.000 ₫. Ô lượng hiện % từng loại.
- **Công thức:** lưu riêng cho nến đó trên đơn, hiện ở chi tiết đơn. Giữ và trừ Kho theo đúng công thức này, đổi Thủ công sau đó không ảnh hưởng.

**Công thức tiền:**

```
Tổng = Tạm tính − Giảm giá + Phí giao
Cọc  = Tổng × % cọc, làm tròn tới nghìn đồng
```

## Chi tiết đơn

| Khối | Nội dung | Thao tác |
|---|---|---|
| Tiến trình | Trạng thái, hạn, 6 bước kèm thời gian, lý do giao lỗi | Bước tiếp theo, Hủy đơn, các nút giao hàng lỗi |
| Sản phẩm | Các dòng, cấu hình tự phối, tạm tính, giảm giá, phí, tổng | |
| Lịch sử | Mọi sự kiện kèm người làm và thời gian | |
| Thanh toán | Tiến độ thu, đã thu, còn phải thu, các khoản, số phải hoàn, ảnh chứng từ | Ghi nhận đã hoàn tiền |
| Khách hàng | Liên hệ, phân loại khách, số lần giao lỗi, link hồ sơ, hình thức giao | Đổi ngày làm xong (trước khi làm xong) |
| Ghi chú | Ghi chú của khách, ghi chú nội bộ | Sửa ghi chú nội bộ |

## Hủy đơn

Luôn phải nhập lý do, hủy xong thì trả lại lượt mã giảm giá. Đơn Đang làm có nến thủ công hoặc đã trừ Kho phải trả lời đã làm hay chưa. Đơn đã thu tiền phải chọn lỗi do khách hay do shop để tính số tiền hoàn. Chi tiết ở [Workflow mục 4](../workflow.md#4-hủy-đơn) và [mục 5](../workflow.md#5-hoàn-tiền).

## Hoàn tất đơn

Bấm **Khách đã nhận** đồng nghĩa đã thu đủ. Đơn còn phần chưa thu thì hỏi xác nhận rồi tự ghi khoản thu.

## Giao hàng lỗi

Xem [Workflow mục 6](../workflow.md#6-giao-hàng-lỗi).

## Chưa có

Đơn từ web.
