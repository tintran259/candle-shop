# Dashboard

**Đường dẫn:** `/`

**Mục đích:** xem nhanh việc cần xử lý và tình hình kinh doanh theo số thật trong BO.

## Chọn kỳ

Nút **7 ngày, 30 ngày, 90 ngày** ở đầu trang đổi cả thẻ chỉ số, biểu đồ, tỉ trọng và sản phẩm bán chạy. Mặc định 30 ngày. Kỳ nằm trên đường dẫn `?days=7|90`, tải lại vẫn giữ.

## Nội dung

| Khối | Hiển thị | Cách tính |
|---|---|---|
| Việc cần xử lý | Đơn trễ hạn, Giao lỗi cần xử lý, Chờ hoàn tiền, Nguyên liệu đang giữ | Tình trạng hiện tại, không theo kỳ. Bấm để mở đúng danh sách |
| Doanh thu | Tiền hàng của đơn đã chốt trong kỳ, không gồm phí vận chuyển, kèm số đã thu của đơn chưa hoàn tất (chưa tính) | Xem quy tắc bên dưới |
| Đơn hàng | Số đơn đặt trong kỳ | Không tính đơn đã hủy |
| Giá trị đơn TB | Tiền hàng trung bình của đơn **Hoàn tất** trong kỳ (theo ngày hoàn tất), kèm số đơn | Tiền hàng = tạm tính − giảm giá − tiền hoàn do khiếu nại, không gồm phí vận chuyển. Không tính đơn hủy, đơn đang xử lý, đơn gửi bù. Từ 1 triệu hiện dạng rút gọn, ví dụ 1,5 tr ₫ |
| Khách hàng mới | Số điện thoại có đơn đầu tiên trong kỳ | Không tính đơn đã hủy |
| Lãi gộp | Lãi của các **đơn đã chốt** trong kỳ, kèm số đơn, tỉ lệ lãi, phí vận chuyển shop chịu | Xem [Quy tắc lãi gộp](#quy-tắc-lãi-gộp) |
| Lịch xưởng | Số cây đã nhận mỗi ngày làm xong trong 7 ngày tới so với công suất | Không theo kỳ. Ngày vượt tô đỏ, xem [Cài đặt › Xưởng](./settings.md#công-suất-xưởng) |
| Biểu đồ Doanh thu | Cột theo ngày, rê chuột thấy số tiền và số đơn mới | Theo ngày chốt đơn. Ngày có hoàn tiền khiếu nại nhiều hơn doanh thu thì cột âm |
| Theo danh mục | Giá trị đơn theo từng danh mục ở trang [Danh mục](./categories.md), cộng nhóm Tự phối | Giá × số lượng từng dòng, không tính đơn đã hủy |
| Đơn hàng gần đây | 7 đơn mới nhất, bấm để mở | Không theo kỳ |
| Sản phẩm bán chạy | 4 sản phẩm bán nhiều nhất, nến tự phối gộp một dòng | Theo số lượng, không tính đơn đã hủy |

Đơn gửi bù khiếu nại không tính vào Đơn hàng, Giá trị đơn TB, Khách hàng mới, Theo danh mục, Sản phẩm bán chạy.

Mỗi thẻ chỉ số so với kỳ liền trước cùng độ dài. Kỳ trước không có số thì ghi "chưa có số để so sánh".

## Quy tắc doanh thu

Doanh thu chỉ ghi nhận khi **đơn đã chốt**, vào ngày chốt. Chỉ tính **tiền hàng**: **phí vận chuyển khách trả** (phí giao, phí gửi lại) là tiền thu để trả đơn vị vận chuyển, **không tính vào doanh thu**.

- **Đơn Hoàn tất:** tiền hàng đã thu, tính vào ngày hoàn tất (kể cả tiền cọc thu từ trước).
- **Đơn đã hủy:** tiền hàng shop giữ lại (vd tiền cọc khi lỗi do khách), tính vào ngày hủy. Đã trừ số hoàn, hoặc số đang chờ hoàn.
- **Đơn chưa xong** (đã thanh toán, đang làm, chờ giao, đang giao, giao không thành, đang hoàn về, **đã hoàn về Kho**): **chưa tính**, kể cả tiền cọc đã thu. Thẻ Doanh thu ghi riêng "Chưa tính … đã thu của N đơn chưa hoàn tất".
- Mỗi khoản thu chia: tiền hàng trước, rồi phí vận chuyển, phần dư là thu dư (sau khi sửa đơn bớt hàng). Hoàn thu dư không làm giảm doanh thu.
- Tiền hoàn khi hủy trừ vào thu dư, rồi phí vận chuyển, rồi tiền hàng.
- Hoàn tiền do khiếu nại sau khi Hoàn tất trừ vào doanh thu ngày hoàn.

Ví dụ:

| Đơn | Doanh thu |
|---|---|
| 300.000 ₫, cọc 150.000 ₫, khách hủy (lỗi do khách), shop giữ cọc | 150.000 ₫ |
| 300.000 ₫ + phí giao 30.000 ₫, khách nhận và trả đủ 330.000 ₫ | 300.000 ₫ |
| 300.000 ₫, cọc 150.000 ₫, giao 2 lượt không thành, khách hủy | 150.000 ₫ |
| 300.000 ₫, cọc 150.000 ₫, hàng đã hoàn về Kho, chưa xử lý tiếp | 0 ₫ (ghi ở "Chưa tính") |
| 300.000 ₫, cọc 150.000 ₫, shop hủy và hoàn đủ 150.000 ₫ | 0 ₫, lãi 0 ₫ |

## Quy tắc lãi gộp

Lãi gộp chỉ tính **đơn đã chốt**: đơn **Hoàn tất** và đơn **đã hủy**, vào ngày hoàn tất hoặc ngày hủy. Đơn đang xử lý chưa tính vì số còn thay đổi.

- **Đơn Hoàn tất:** tiền hàng − giá vốn nguyên liệu + (phí vận chuyển khách trả − **phí trả đơn vị vận chuyển**).
- **Đơn hủy:** tiền hàng giữ lại (vd tiền cọc) + phí vận chuyển khách đã trả − phí trả đơn vị vận chuyển − nguyên liệu đã mất. Nguyên liệu mất khi đã Bắt đầu làm mà không hoàn về Kho, không chuyển sang Sản phẩm hủy đơn.
- **Phí trả đơn vị vận chuyển** ghi ở mỗi lượt giao và lúc nhận hàng hoàn (phí hoàn hàng), xem [Đơn hàng › Vận chuyển](./orders.md#vận-chuyển). Miễn phí giao cho khách thì toàn bộ phí này là chi phí của shop.
- Đơn gửi bù giá 0 nên lãi âm (nguyên liệu, phí vận chuyển).
- Tỉ lệ lãi = lãi ÷ tiền hàng của các đơn đã chốt. Có phí vận chuyển shop chịu thì thẻ ghi "Đã trừ … phí vận chuyển shop chịu".

Đã chốt với chủ shop: **Doanh thu không trừ phí vận chuyển**; phí vận chuyển shop chịu trừ ở **Lãi gộp**, kể cả đơn hoàn tất.

Ví dụ đơn 300.000 ₫, cọc 150.000 ₫, mỗi lượt giao trả đơn vị vận chuyển 30.000 ₫, nến hoàn về còn tốt (chuyển sang Sản phẩm hủy đơn, không trừ nguyên liệu), nguyên liệu 100.000 ₫:

| Trường hợp | Doanh thu | Lãi gộp |
|---|---|---|
| Khách không nhận, mất cọc (1 lượt giao) | 150.000 ₫ | 150.000 − 30.000 = 120.000 ₫ |
| Khách không nhận, gửi lại thêm 2 lần rồi vẫn không nhận (3 lượt, phí gửi lại cộng vào còn phải thu nhưng không thu được) | 150.000 ₫ | 150.000 − 90.000 = 60.000 ₫ |
| Lỗi do shop, hoàn 150.000 ₫ cọc | 0 ₫ | −30.000 ₫ (shop chịu phí vận chuyển) |
| Hoàn tất, khách trả phí giao 30.000 ₫ | 300.000 ₫ | 300.000 − 100.000 + (30.000 − 30.000) = 200.000 ₫ |
| Hoàn tất, miễn phí giao (shop trả 30.000 ₫) | 300.000 ₫ | 300.000 − 100.000 − 30.000 = 170.000 ₫ |

Nến hỏng hoặc đã làm mà không hoàn Kho thì trừ thêm nguyên liệu: vd 2 lượt giao, khách hủy, mất 80.000 ₫ nguyên liệu → lãi 150.000 − 60.000 − 80.000 = 10.000 ₫. Nếu khách trả phí gửi lại và nhận hàng thì phần này bù đúng tiền trả đơn vị vận chuyển, không đổi lãi.

## Việc của BE

Hiện BO tự tính trên trình duyệt từ đơn đang lưu. Khi có BE cần API thống kê theo cùng quy tắc, nhận khoảng ngày và trả về các số trên.

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md).

**Đã có test:**

- `workshop-cost`: thẻ Lãi gộp, lịch xưởng 7 ngày báo ngày vượt; `logic/costs-capacity`: lãi gộp trên giá trị hàng.
- `dashboard`: doanh thu theo tiền thực nhận, không tính đơn hủy, việc cần xử lý, bán chạy có nến tự phối, đổi kỳ và giữ kỳ trên đường dẫn, link lọc đơn, không có đơn, điện thoại.
- `dashboard-ui`: bấm đơn gần đây mở đúng đơn, thẻ chỉ số so với kỳ trước, biểu đồ theo danh mục đổi theo trang Danh mục, thẻ Nguyên liệu đang giữ mở Kho.
- `dashboard-money`: bộ 8 đơn đủ trường hợp (hoàn tất có phí giao, cọc rồi thu nốt, miễn phí giao shop trả vận chuyển, hủy giữ cọc, hủy sau 2 lượt giao, hủy lỗi shop hoàn đủ, đang giao, khiếu nại hoàn tiền, đơn ngoài kỳ) so với số tính tay, trên hàm tính và trên thẻ Dashboard.
- `logic/money`: tách tiền hàng / phí vận chuyển / thu dư, lãi đơn hoàn tất và đơn hủy theo các ví dụ trên.
- `logic/dashboard`: doanh thu theo ngày hoàn tất, đơn chưa xong chưa tính (ghi riêng số đã thu), đơn hủy tính tiền giữ lại vào ngày hủy, so với kỳ trước, giá trị đơn trung bình, khách mới, theo danh mục, việc cần xử lý.
