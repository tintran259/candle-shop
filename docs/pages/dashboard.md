# Dashboard

**Đường dẫn:** `/`

**Mục đích:** xem nhanh việc cần xử lý và tình hình kinh doanh theo số thật trong BO.

## Chọn kỳ

Nút **7 ngày, 30 ngày, 90 ngày** ở đầu trang đổi cả thẻ chỉ số, biểu đồ, tỉ trọng và sản phẩm bán chạy. Mặc định 30 ngày. Kỳ nằm trên đường dẫn `?days=7|90`, tải lại vẫn giữ.

## Nội dung

| Khối | Hiển thị | Cách tính |
|---|---|---|
| Việc cần xử lý | Đơn trễ hạn, Giao lỗi cần xử lý, Chờ hoàn tiền, Nguyên liệu đang giữ | Tình trạng hiện tại, không theo kỳ. Bấm để mở đúng danh sách |
| Doanh thu | Tổng tiền thực nhận trong kỳ | Xem quy tắc bên dưới |
| Đơn hàng | Số đơn đặt trong kỳ | Không tính đơn đã hủy |
| Giá trị đơn TB | Tổng giá trị đơn ÷ số đơn | Không tính đơn đã hủy. Từ 1 triệu hiện dạng rút gọn, ví dụ 1,5 tr ₫ |
| Khách hàng mới | Số điện thoại có đơn đầu tiên trong kỳ | Không tính đơn đã hủy |
| Lãi gộp | Giá trị hàng − giá vốn nguyên liệu, kèm tỉ lệ lãi | Theo đơn đặt trong kỳ, không tính đơn đã hủy. Giá trị hàng = tạm tính − giảm giá − tiền hoàn do khiếu nại, không tính phí giao. Đơn gửi bù có giá trị 0 nên lãi âm |
| Lịch xưởng | Số cây đã nhận mỗi ngày làm xong trong 7 ngày tới so với công suất | Không theo kỳ. Ngày vượt tô đỏ, xem [Cài đặt › Xưởng](./settings.md#công-suất-xưởng) |
| Biểu đồ Doanh thu | Cột theo ngày, rê chuột thấy số tiền và số đơn mới | Ngày hoàn tiền nhiều hơn thu thì cột âm |
| Theo danh mục | Giá trị đơn theo từng danh mục ở trang [Danh mục](./categories.md), cộng nhóm Tự phối | Giá × số lượng từng dòng, không tính đơn đã hủy |
| Đơn hàng gần đây | 7 đơn mới nhất, bấm để mở | Không theo kỳ |
| Sản phẩm bán chạy | 4 sản phẩm bán nhiều nhất, nến tự phối gộp một dòng | Theo số lượng, không tính đơn đã hủy |

Đơn gửi bù khiếu nại không tính vào Đơn hàng, Giá trị đơn TB, Khách hàng mới, Theo danh mục, Sản phẩm bán chạy.

Mỗi thẻ chỉ số so với kỳ liền trước cùng độ dài. Kỳ trước không có số thì ghi "chưa có số để so sánh".

## Quy tắc doanh thu

Doanh thu tính theo tiền thực nhận, vào ngày phát sinh khoản tiền.

- Tính mọi khoản đã thu của đơn chưa hủy, gồm tiền cọc.
- Đơn đã hủy chỉ tính phần shop giữ lại, tức tiền đã thu trừ tiền đã hoàn. Ví dụ tiền cọc giữ lại khi lỗi do khách.
- Đơn đang chờ hoàn tiền trừ trước số phải hoàn, để không ghi nhận khoản sắp trả lại.

Vì tính theo tiền, Doanh thu có thể khác Tổng giá trị đơn: đơn cọc mới tính phần cọc cho tới khi thu đủ.

## Việc của BE

Hiện BO tự tính trên trình duyệt từ đơn đang lưu. Khi có BE cần API thống kê theo cùng quy tắc, nhận khoảng ngày và trả về các số trên.

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md).

**Đã có test:**

- `workshop-cost`: thẻ Lãi gộp, lịch xưởng 7 ngày báo ngày vượt; `logic/costs-capacity`: lãi gộp trên giá trị hàng.
- `dashboard`: doanh thu theo tiền thực nhận, không tính đơn hủy, việc cần xử lý, bán chạy có nến tự phối, đổi kỳ và giữ kỳ trên đường dẫn, link lọc đơn, không có đơn, điện thoại.
- `dashboard-ui`: bấm đơn gần đây mở đúng đơn, thẻ chỉ số so với kỳ trước, biểu đồ theo danh mục đổi theo trang Danh mục, thẻ Nguyên liệu đang giữ mở Kho.
- `logic/dashboard`: doanh thu theo ngày thu tiền, đơn hủy và cột âm ngày hoàn tiền, so với kỳ trước, giá trị đơn trung bình, khách mới, theo danh mục, việc cần xử lý.
