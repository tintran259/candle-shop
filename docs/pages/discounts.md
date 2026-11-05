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
- **Ai dùng được:** mọi khách, hoặc **khách được chọn** (mã riêng). Chọn một hay nhiều khách từ trang Khách hàng, tìm theo tên hoặc số điện thoại. Lúc tạo đơn đối chiếu theo số điện thoại của đơn với hồ sơ khách: khách khác nhập mã bị từ chối.
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
- **Bảng:** mã có nút sao chép, ưu đãi (mã riêng ghi "riêng N khách"), thời gian, lượt dùng, bật/tắt.

## Drawer tạo, sửa

Phiếu xem trước cập nhật theo form, sau đó là các khối Mã & mô tả, Ưu đãi, Điều kiện, Thời gian & giới hạn. Mã viết hoa không dấu, 4–20 ký tự, có nút tạo ngẫu nhiên. Mã đã có lượt dùng thì nên tạm dừng thay vì xóa. Có danh sách các đơn đã dùng mã.

## Lúc tạo đơn

Báo lỗi ngay tại ô mã: không có mã, tạm dừng, hết hạn, hết lượt, chưa tới ngày, mã riêng của khách khác (hoặc chưa nhập đúng số điện thoại khách), chưa đủ đơn tối thiểu, không phải khách mới, hết lượt của khách, không đúng phạm vi.

Khách có mã riêng đang chạy thì dưới ô mã hiện "Khách có mã riêng: …", bấm vào mã để áp.

## Mã riêng cho khách

- **Tạo từ hồ sơ khách:** khối **Mã giảm giá riêng** có nút **Tạo mã riêng cho khách**, mở drawer tạo mã với khách đó chọn sẵn (`/discounts?edit=new&customer=<id>`).
- **Tạo từ trang Mã giảm giá:** Điều kiện › Ai dùng được › Khách được chọn.
- Hồ sơ khách liệt kê các mã riêng kèm trạng thái, bấm để sửa.
- **Việc của BE:** lưu `customerIds` trên mã; `POST /api/discounts/validate` phải kiểm tra khách đang đặt (tài khoản hoặc số điện thoại) có trong danh sách. Web chưa nối.

## Lượt dùng

Tạo đơn tăng 1 lượt, hủy đơn trả lại 1 lượt. Mã đã trả lượt có thể dùng tiếp nếu còn hạn.

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md).

**Đã có test:**

- `discounts`: số đếm theo trạng thái, sắp hết hạn, lọc, tìm mã và mô tả, sắp xếp, tạo mã (chuẩn hóa, mã ngắn, mã trùng, tạo ngẫu nhiên), mã giảm số tiền cho nến tự phối có giới hạn lượt, tạm dừng và bật lại, sửa qua đường dẫn, hỏi khi đóng chưa lưu, xóa; áp mã vào đơn hiện mức giảm thật (không lấy mô tả cũ); mã riêng tạo từ hồ sơ khách, hiện ở hồ sơ và trên bảng, khách đó có gợi ý mã khi tạo đơn, đổi sang số khách khác thì bị từ chối.
- `logic/discounts`: trạng thái tự tính và thứ tự ưu tiên, nhắc hạn, định dạng mã, mọi lý do mã không dùng được, đơn tối thiểu, giảm % có mức tối đa, giảm số tiền không vượt giá trị dòng, phạm vi, miễn phí giao, khách lần đầu, giới hạn mỗi khách, mã riêng cho khách được chọn.
- Lượt dùng tăng khi tạo đơn và trả lại khi hủy ở `orders-create`, `orders-decisions`.
