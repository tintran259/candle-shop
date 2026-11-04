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
- **Tab trạng thái:** có số đếm từng trạng thái, gồm cả 3 trạng thái giao hàng lỗi. Tab không đủ chỗ thì nằm trong nút **…**.
- **Bộ lọc:** tìm theo mã đơn, tên không dấu, số điện thoại; lọc tình trạng thanh toán (Chưa thanh toán, Đã cọc, Đã thanh toán đủ, Chờ hoàn tiền, Đã hoàn tiền); khoảng ngày đặt.
- **Sắp xếp:** Mới đặt nhất, Sắp tới hạn làm, Giá trị cao nhất.
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
- **Mặc định khi chọn nhiều:** sáp và màu chia đều cho số loại, ví dụ hũ 150ml đổ 120g sáp, chọn 2 loại thì mỗi loại 60g. Tổng sáp có thể khác mặc định, hệ thống chỉ hiện để đối chiếu, không chặn.
- **Giá:** phụ thu tính theo tỉ lệ. Sáp theo gram, làm tròn tới nghìn đồng, ví dụ Sáp dừa +25.000 ₫ chiếm 60g trong 160g thì cộng 9.000 ₫. Màu sáp theo ml tương tự. Mùi hương theo ml nếu admin điền, khi đó ô Tỉ lệ phối được ẩn, không điền thì theo tỉ lệ phối.
- **Phụ thu hương:** lượng hương tới mức chuẩn tính phụ thu mặc định, vượt thì tăng theo tỉ lệ ml. Ví dụ chuẩn 10% với hũ 120g sáp là 12 ml, phụ thu 10.000 ₫: điền 18 ml thành 15.000 ₫. Ô lượng hiện % từng loại.
- **Công thức:** lưu riêng cho nến đó trên đơn, hiện ở chi tiết đơn. Giữ và trừ Kho theo đúng công thức này, đổi Thủ công sau đó không ảnh hưởng.

**Công thức tiền:**

```
Tổng = Tạm tính − Giảm giá + Phí giao
Cọc  = Tổng × % cọc, làm tròn tới nghìn đồng
```

## Sửa đơn

Nút **Sửa đơn** trên thẻ tiến trình, mở cùng form với Tạo đơn (đường dẫn `?edit=<id>`). Không có ở đơn Hoàn tất và Đã hủy.

| Trạng thái | Sửa được |
|---|---|
| Chờ thanh toán, Đã thanh toán | Mọi thứ: khách, địa chỉ, sản phẩm, số lượng, nến tự phối, giao hàng, phí giao, ngày làm xong, mã giảm giá, ghi chú |
| Từ Đang làm trở đi | Khách, địa chỉ, giao hàng, phí giao, ngày làm xong, ghi chú. Sản phẩm khóa vì nguyên liệu đã trừ Kho; muốn đổi thì hủy đơn rồi tạo mới |

- **Tiền:** tạm tính, giảm giá, tổng tự tính lại. Đơn Chờ thanh toán: khoản đang chờ thu đổi theo tổng mới (cọc theo % lúc tạo đơn). Đơn đã thu tiền: các khoản đã thu giữ nguyên, phần còn phải thu đổi theo tổng mới.
- **Thu dư:** tổng mới thấp hơn số đã thu thì khối Thanh toán báo "Thu dư, cần hoàn" và có nút **Ghi nhận đã hoàn phần dư** (bắt buộc ảnh chứng từ).
- **Nguyên liệu:** đơn Đã thanh toán giữ theo sản phẩm mới; khi sửa, phần đơn này đang giữ được tính là còn dùng được cho chính nó.
- **Mã giảm giá:** đổi mã thì trả lượt mã cũ, tính lượt mã mới. Giữ mã cũ thì bỏ qua hạn dùng và số lượt.
- **Lịch sử:** ghi "Sửa đơn" kèm từng thay đổi. Không đổi gì thì không ghi.
- Số điện thoại mới chưa có hồ sơ thì tạo hồ sơ khách vãng lai như lúc tạo đơn.

## Chi tiết đơn

| Khối | Nội dung | Thao tác |
|---|---|---|
| Tiến trình | Trạng thái, hạn, 6 bước kèm thời gian, lý do giao lỗi | Bước tiếp theo, Hủy đơn, các nút giao hàng lỗi |
| Sản phẩm | Các dòng, cấu hình tự phối, công thức 1 hũ, tạm tính, giảm giá, phí, tổng, giá vốn nguyên liệu và lãi gộp | |
| Khiếu nại | Nội dung, ảnh khách gửi, cách xử lý, link đơn gửi bù | Nút Khiếu nại trên thẻ tiến trình (đơn Hoàn tất) |
| Lịch sử | Mọi sự kiện kèm người làm và thời gian | |
| Thanh toán | Tiến độ thu, đã thu, còn phải thu, các khoản, số phải hoàn, ảnh chứng từ | Ghi nhận đã hoàn tiền |
| Khách hàng | Liên hệ, phân loại khách, số lần giao lỗi, link hồ sơ, hình thức giao | Đổi ngày làm xong (trước khi làm xong) |
| Ghi chú | Ghi chú của khách, ghi chú nội bộ | Sửa ghi chú nội bộ |

**Giá vốn và lãi gộp:** giá vốn = nguyên liệu theo công thức × giá nhập ([Kho › Giá nhập](./inventory.md#giá-nhập)). Trước khi Bắt đầu làm là **ước tính** theo giá hiện tại; bấm Bắt đầu làm thì **chốt** theo giá nhập lúc trừ Kho. Lãi gộp = tạm tính − giảm giá − tiền hoàn do khiếu nại − giá vốn, không tính phí giao. Nguyên liệu chưa có giá nhập thì báo thiếu.

**Ngày làm xong:** lịch tô vạch theo số cây xưởng đã nhận mỗi ngày (xanh còn chỗ, cam gần đầy, đỏ vượt). Đổi sang ngày vượt công suất vẫn đổi được, có thông báo cảnh báo. Xem [Cài đặt › Xưởng](./settings.md).

## Hủy đơn

Luôn phải nhập lý do, hủy xong thì trả lại lượt mã giảm giá. Đơn Đang làm có nến thủ công hoặc đã trừ Kho phải trả lời đã làm hay chưa. Đơn đã thu tiền phải chọn lỗi do khách hay do shop để tính số tiền hoàn. Chi tiết ở [Workflow mục 4](../workflow.md#4-hủy-đơn) và [mục 5](../workflow.md#5-hoàn-tiền).

## Hoàn tất đơn

Bấm **Khách đã nhận** đồng nghĩa đã thu đủ. Đơn còn phần chưa thu thì hỏi xác nhận rồi tự ghi khoản thu.

## Giao hàng lỗi

Xem [Workflow mục 6](../workflow.md#6-giao-hàng-lỗi).

## Khiếu nại sau khi giao

Xem [Workflow mục 7](../workflow.md#7-khiếu-nại-sau-khi-giao).

## Việc của BE

**Trạng thái mới:** `producing`, `ready`, `delivery_failed`, `returning`, `returned`. BE hiện chỉ có PENDING, PAID, SHIPPING, COMPLETED, CANCELLED.

**Trường mới trên đơn:**

| Trường | Ý nghĩa |
|---|---|
| `cancelOutcome` | `returned`: chưa làm, hoàn Kho. `stocked`: đã làm, vào Sản phẩm hủy đơn. `consumed`: đã làm, đơn toàn nến có sẵn |
| `cancelFault` | `customer` hoặc `shop` |
| `refundDue` | Số phải hoàn lúc hủy |
| `refund` | `amount`, `images`, `note`, `at`, `by` |
| `deliveryAttempts`, `deliveryIssue` | Số lần giao không thành của lượt hiện tại, lý do gần nhất. Gửi lại đơn thì đếm lại |
| `returnCondition`, `returnNote` | `good` hoặc `damaged`, ghi chú khi nhận lại |
| `resendFee` | Tổng phí gửi lại đã cộng vào `shippingFee` và `total` |
| `items[].recipe` | Công thức 1 hũ của nến tự phối lúc tạo đơn |
| `materialCost` | Giá vốn nguyên liệu chốt lúc Bắt đầu làm |
| `complaints[]` | `reason`, `images`, `resolution` (`resend`, `refund`, `none`), `refundAmount`, `replacementId`, `replacementCode`, `at`, `by` |
| `replacementFor` | `{ id, code }` của đơn gốc, có ở đơn gửi bù |
| `payments[].kind = "refund"` | Khoản hoàn một phần (thu dư, khiếu nại): số âm, kèm `images`, `note` |

**Quy tắc phía server:**

- Hủy đơn trả lại lượt mã giảm giá trong cùng transaction.
- `PATCH /api/orders/:id`: sửa theo đúng quy tắc mục Sửa đơn (khóa sản phẩm từ Đang làm), tính lại tiền, đổi lượt mã, ghi lịch sử.
- `POST /api/orders/:id/complaints`: gửi bù thì tạo đơn 0 ₫ trong cùng transaction.
- Bấm Khách đã nhận thì ghi khoản thu phần còn lại.
- Ảnh chứng từ hoàn tiền upload như ảnh khác, không lưu `data:` URL.
- Tính số giữ và trừ Kho theo [inventory.md](../inventory.md#7-số-lượng-tối-đa--trừ-kho-theo-đơn).

## Chưa có

Đơn từ web.

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md).

**Đã có test:**

- `order-changes`: sửa đơn Đã thanh toán bớt hàng rồi ghi nhận hoàn phần dư, sửa đơn đã Bắt đầu làm (khóa sản phẩm), không đổi gì thì không ghi lịch sử, đơn Hoàn tất không có nút Sửa đơn, khiếu nại gửi bù (đơn 0 ₫, link hai chiều, nhãn trên bảng), khiếu nại hoàn một phần (bắt buộc chứng từ).
- `workshop-cost`: ngày làm xong gợi ý theo công suất, cảnh báo vượt và nút dùng ngày còn chỗ, đổi ngày sang ngày đầy, giá vốn ước tính rồi chốt khi Bắt đầu làm.
- `logic/order-changes`: quy tắc sửa đơn, tính lại tiền, thu dư, mã giảm giá, đơn gửi bù, ghi khiếu nại, khoản hoàn một phần.
- `orders-create`: tạo đơn cho khách có sẵn, khách mới, khách bị chặn; mã giảm giá; cọc; đã nhận tiền; mã đơn theo ngày; lịch sử.
- `orders-custom-candle`, `orders-custom-modal`, `orders-amounts`: popup Tự phối nến, khóa lựa chọn hết nguyên liệu, số hũ Kho làm được, chọn nhiều sáp, lượng từng nguyên liệu, công thức trên đơn.
- `orders-cancel`: Bắt đầu làm trừ Kho, hủy đơn đang làm hỏi đã làm chưa, hoàn Kho, Kho thiếu thì chặn.
- `orders-decisions`: công thức, giữ nguyên liệu, thu đủ khi hoàn tất, trả lượt mã, hoàn tiền kèm ảnh, giao hàng lỗi, gửi lại đơn.
- `orders-list`: thẻ thống kê, lọc thanh toán, khoảng ngày, tìm số điện thoại, sắp xếp giá trị, tab dồn vào nút …, đổi ngày làm xong, ghi chú nội bộ, đơn đã làm xong không đổi ngày, sản phẩm đang ẩn có nhãn khi tạo đơn.
- `logic/orders`: tình trạng thanh toán, số tiền hoàn theo lỗi khách / lỗi shop, thứ tự trạng thái, hủy được khi nào, nhãn hạn làm xong, bộ lọc và sắp xếp.
- `logic/discounts`: áp mã khi tạo đơn, tổng tiền và tiền cọc.
