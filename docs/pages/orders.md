# Đơn hàng

**Đường dẫn:** `/orders`, mở đơn `?order=<id>`, tạo đơn `?order=new`

**Mục đích:** theo dõi đơn từ lúc đặt tới khi giao xong. Quy trình đầy đủ ở [Workflow](../workflow.md).

**Bắt đầu trống:** không còn đơn mẫu, bỏ nút Dữ liệu mẫu. Chưa có đơn thì trang ghi "Chưa có đơn hàng nào." kèm nút **Tạo đơn hàng đầu tiên**.

## Trạng thái

| Trạng thái | Nghĩa | Nút bước tiếp | Hủy được |
|---|---|---|---|
| Chờ thanh toán | Khách chưa trả cọc hoặc tiền | Xác nhận đã thanh toán | Có |
| Đã thanh toán | Đã nhận cọc hoặc đủ tiền | Bắt đầu làm | Có |
| Đang làm | Xưởng đang đổ và ủ hương | Đã làm xong | Có |
| Chờ giao | Đã làm xong | Giao cho vận chuyển (chọn đơn vị, nhập mã vận đơn) | Có |
| Đang giao | Bên vận chuyển đang giao | Khách đã nhận, Giao không thành | Không |
| Giao không thành | Giao lỗi, chờ quyết định | Giao lại, Hoàn về | Không |
| Đang hoàn về | Hàng đang về shop | Đã nhận lại hàng | Không |
| Đã hoàn về | Hàng đã về shop | Gửi lại đơn | Có |
| Hoàn tất | Khách đã nhận, đã thu đủ tiền | | Không |
| Đã hủy | Đơn đã hủy | | |

## Trang danh sách

- **Thẻ thống kê:** Chờ thanh toán, Cần làm (kèm số đơn trễ hạn), Chờ giao, Giao lỗi cần xử lý, Còn phải thu.
- **Tab trạng thái:** có số đếm từng trạng thái, gồm cả 3 trạng thái giao hàng lỗi. Tab không đủ chỗ thì nằm trong nút **…**.
- **Bộ lọc:** tìm theo mã đơn, mã vận đơn, tên không dấu, số điện thoại; lọc tình trạng thanh toán (Chưa thanh toán, Đã cọc, Đã thanh toán đủ, Chờ hoàn tiền, Đã hoàn tiền); khoảng ngày đặt.
- **Sắp xếp:** Mới đặt nhất, Sắp tới hạn làm, Giá trị cao nhất.
- **Bảng:** mã đơn, khách, sản phẩm, ngày làm xong kèm cảnh báo hạn, thanh toán, trạng thái (kèm đơn vị vận chuyển và mã vận đơn), tổng tiền.
- **Chọn nhiều đơn** bằng ô đầu dòng: hiện thanh "Đã chọn N đơn" với nút **In N đơn** (phiếu đơn hoặc nhãn giao hàng), **Xuất Excel** và **Bỏ chọn**. Bấm ô chọn không mở đơn. Đổi tab hoặc bộ lọc thì bỏ chọn.
- **Xuất Excel** ở đầu trang: xuất danh sách đang lọc, xem [Xuất Excel](#xuất-excel).

## Tạo đơn hàng

Drawer 2 cột trên màn rộng: form bên trái, tóm tắt dính bên phải.

| Khối | Trường | Quy tắc |
|---|---|---|
| Khách hàng | Hồ sơ có sẵn, tên, SĐT, email, kênh đặt, địa chỉ | SĐT trùng hồ sơ thì tự nhận ra khách. Khách bị chặn thì hỏi lại trước khi tạo |
| Sản phẩm | Nến có sẵn, Tự phối nến, số lượng | Sản phẩm đang ẩn vẫn chọn được, có nhãn "Đang ẩn". Thiếu nguyên liệu cho cả đơn thì chặn, tính trên số dùng được |
| Giao hàng | Phương thức, phí vận chuyển (khách trả), đơn vị vận chuyển, ngày xưởng làm xong | Phí tự điền theo phương thức, sửa được cho đơn này. Đơn vị vận chuyển chọn từ [Cài đặt](./settings.md#đơn-vị-vận-chuyển), lúc giao chọn sẵn đơn vị này. Mặc định xong sau 3 ngày |
| Thanh toán | Mã giảm giá, cọc hoặc trả đủ, kênh thanh toán, đã nhận tiền, mã giao dịch | % cọc lấy từ Cài đặt. Áp mã thì dưới ô hiện số tiền giảm và luật thật của mã (vd "TET2027 −80%, tối đa 300.000 ₫, chỉ nến có sẵn"), không lấy mô tả tự gõ |
| Ghi chú | Ghi chú của khách, ghi chú nội bộ | |

**Popup Tự phối nến:** đi theo các bước đang bật ở Thủ công. Lựa chọn hết nguyên liệu bị khóa kèm lý do, phần đang giữ cho đơn khác không tính là còn. Tóm tắt bên phải hiện mô tả gửi xưởng, giá 1 hũ, nguyên liệu cần và số hũ Kho làm được. Tiêu đề và nút thêm luôn hiện, chỉ phần chọn cuộn.

- **Số lựa chọn mỗi bước:** chọn 1 hoặc nhiều mục, trong giới hạn Tối đa, theo cài đặt ở Thủ công. Chọn Không màu hoặc Không trang trí thì bỏ các mục khác.
- **Lượng cho 1 hũ:** mỗi nguyên liệu đã chọn (sáp, mùi hương, bấc, màu, trang trí, tuỳ chọn thêm) có ô nhập lượng theo đơn vị của nguyên liệu. Để trống thì theo mặc định, hiện mờ trong ô. Hũ và nắp luôn 1 cái nên không có ô này.
- **Mặc định khi chọn nhiều:** sáp và màu chia đều cho số loại, ví dụ hũ 150ml đổ 120g sáp, chọn 2 loại thì mỗi loại 60g. Tổng sáp có thể khác mặc định, hệ thống chỉ hiện để đối chiếu, không chặn.
- **Giá sáp, màu, mùi hương theo lượng:** lượng dùng cho 1 hũ × giá bán mỗi 100 g / mỗi ml ở Thủ công, làm tròn tới 100 ₫. Ví dụ sáp đậu nành 2.000 ₫/100 g, hũ 150ml đổ 120 g → 2.400 ₫; chọn 2 loại sáp thì mỗi loại 60 g, cộng hai dòng. Xem [Thủ công](./craft.md#giá-theo-lượng-sáp-màu-mùi-hương).
- **Phối nhiều mùi:** chỉnh bằng ô **Lượng cho 1 hũ** (ml), ô hiện % từng mùi; không còn ô Tỉ lệ phối riêng. Để trống thì chia đều lượng hương của hũ (lượng sáp × tỉ lệ độ đậm). Tinh dầu không theo dõi kho thì không có ô lượng, khi đó mới hiện ô Tỉ lệ phối.
- **Công thức:** lưu riêng cho nến đó trên đơn, hiện ở chi tiết đơn. Giữ và trừ Kho theo đúng công thức này, đổi Thủ công sau đó không ảnh hưởng.

**Công thức tiền:**

```
Tổng = Tạm tính − Giảm giá + Phí giao
Cọc  = (Tạm tính − Giảm giá) × % cọc, không gồm phí vận chuyển; làm tròn tới nghìn đồng, ít nhất 1.000 ₫
       Vd 300.000 ₫ hàng + 30.000 ₫ phí giao, cọc 50% = 150.000 ₫; phí giao thu cùng phần còn lại khi giao
```

**Đơn lỗ:** tiền hàng sau giảm giá (Tạm tính − Giảm giá, không tính phí giao, giống lãi gộp) so với giá vốn nguyên liệu các dòng theo giá nhập hiện tại. Thấp hơn vốn thì khung tổng tiền báo đỏ **Đơn lỗ X ₫**; lãi dưới mức tối thiểu ở Cài đặt thì báo cam **Lãi chỉ Y%**. Chỉ cảnh báo, vẫn tạo / lưu được đơn.


### Đơn nháp

Form tạo đơn tự lưu nháp mỗi khi nhập (khách, sản phẩm, nến tự phối, giao hàng, thanh toán, ghi chú), để admin đóng ra làm việc khác rồi quay lại làm tiếp.

- **Đóng form** (nút **Lưu nháp**, dấu ×, phím Esc, bấm ra ngoài) không hỏi nữa, giữ nguyên nháp và báo "Đã lưu nháp đơn". Nút ở trang Đơn hàng đổi thành **Tiếp tục đơn nháp**.
- **Mở lại:** form điền lại đủ, có dòng "Đang tiếp tục đơn nháp lưu lúc …" kèm nút **Bắt đầu đơn mới** (xóa nháp, form trống). Nến có sẵn lấy lại tên, ảnh, giá hiện tại; nến tự phối giữ cấu hình và giá lúc chọn. Ngày làm xong đã qua thì lấy ngày gợi ý mới.
- **Bỏ đơn** (chân form): hỏi lại rồi xóa nháp.
- **Tạo đơn xong** thì xóa nháp.
- **Mở từ hồ sơ khách** ("Tạo đơn cho khách này") khi đang có nháp: form điền khách đó, báo "Đang có đơn nháp của …" kèm nút **Mở đơn nháp**. Nhập đơn mới sẽ thay nháp cũ.
- Một nháp cho cả BO, lưu trên trình duyệt đang dùng (chưa có BE). Nháp không giữ nguyên liệu và không tính lượt mã giảm giá; kiểm tra Kho và mã chạy lại lúc tạo đơn.
- Sửa đơn có sẵn không lưu nháp, đóng khi có thay đổi vẫn hỏi "Bỏ các thay đổi?".

## Sửa đơn

Nút **Sửa đơn** trên thẻ tiến trình, mở cùng form với Tạo đơn (đường dẫn `?edit=<id>`). Không có ở đơn Hoàn tất và Đã hủy.

| Trạng thái | Sửa được |
|---|---|
| Chờ thanh toán, Đã thanh toán | Mọi thứ: khách, địa chỉ, sản phẩm, số lượng, nến tự phối, giao hàng, phí giao, ngày làm xong, mã giảm giá, ghi chú |
| Từ Đang làm trở đi | Khách, địa chỉ, giao hàng, phí giao, ngày làm xong, ghi chú. Sản phẩm khóa vì nguyên liệu đã trừ Kho; muốn đổi thì hủy đơn rồi tạo mới |

- **Tiền:** tạm tính, giảm giá, tổng tự tính lại. Đơn Chờ thanh toán: khoản đang chờ thu đổi theo tổng mới (cọc theo % lúc tạo đơn, trên tiền hàng). Đơn đã thu tiền: các khoản đã thu giữ nguyên, phần còn phải thu đổi theo tổng mới.
- **Thu dư:** tổng mới thấp hơn số đã thu thì khối Thanh toán báo "Thu dư, cần hoàn" và có nút **Ghi nhận đã hoàn phần dư** (bắt buộc ảnh chứng từ).
- **Nguyên liệu:** đơn Đã thanh toán giữ theo sản phẩm mới; khi sửa, phần đơn này đang giữ được tính là còn dùng được cho chính nó.
- **Mã giảm giá:** đổi mã thì trả lượt mã cũ, tính lượt mã mới. Giữ mã cũ thì bỏ qua hạn dùng và số lượt.
- **Lịch sử:** ghi "Sửa đơn" kèm từng thay đổi. Không đổi gì thì không ghi.
- Số điện thoại mới chưa có hồ sơ thì tạo hồ sơ khách vãng lai như lúc tạo đơn.

## Chi tiết đơn

| Khối | Nội dung | Thao tác |
|---|---|---|
| Đầu drawer | Mã đơn, tên khách | Nút **In**: In phiếu đơn, In nhãn giao hàng |
| Tiến trình | Trạng thái, hạn, 6 bước kèm thời gian, lý do giao lỗi | Bước tiếp theo, Hủy đơn, các nút giao hàng lỗi |
| Sản phẩm | Các dòng, cấu hình tự phối, công thức 1 hũ, tạm tính, giảm giá, phí, tổng, giá vốn nguyên liệu và lãi gộp | |
| Khiếu nại | Nội dung, ảnh khách gửi, cách xử lý, link đơn gửi bù | Nút Khiếu nại trên thẻ tiến trình (đơn Hoàn tất) |
| Lịch sử | Mọi sự kiện kèm người làm và thời gian | |
| Thanh toán | Tiến độ thu, đã thu, còn phải thu, các khoản, số phải hoàn, ảnh chứng từ | Ghi nhận đã hoàn tiền |
| Khách hàng | Liên hệ, phân loại khách, số lần giao lỗi, link hồ sơ, hình thức giao, đơn vị vận chuyển, mã vận đơn | Đổi ngày làm xong (trước khi làm xong), sao chép mã vận đơn, Tra cứu, Sửa vận chuyển |
| Ghi chú | Ghi chú của khách, ghi chú nội bộ | Sửa ghi chú nội bộ |

**Giá vốn và lãi gộp:** giá vốn = nguyên liệu theo công thức × giá nhập ([Kho › Giá nhập](./inventory.md#giá-nhập)). Trước khi Bắt đầu làm là **ước tính** theo giá hiện tại; bấm Bắt đầu làm thì **chốt** theo giá nhập lúc trừ Kho. Lãi gộp = tạm tính − giảm giá − tiền hoàn do khiếu nại − giá vốn + (phí giao khách trả − phí trả đơn vị vận chuyển); chưa giao thì chưa tính phần vận chuyển. Đơn hủy hiện tiền hàng giữ lại, nguyên liệu đã mất, phí trả đơn vị vận chuyển và **Lãi sau khi hủy**. Cách tính chung ở [Dashboard › Quy tắc lãi gộp](./dashboard.md#quy-tắc-lãi-gộp). Nguyên liệu chưa có giá nhập thì báo thiếu.

**Ngày làm xong:** lịch tô vạch theo số cây xưởng đã nhận mỗi ngày (xanh còn chỗ, cam gần đầy, đỏ vượt). Đổi sang ngày vượt công suất vẫn đổi được, có thông báo cảnh báo. Xem [Cài đặt › Xưởng](./settings.md).

## Vận chuyển

### Giao cho vận chuyển

Đơn Chờ giao bấm **Giao cho vận chuyển** thì mở popup:

- **Thu hộ (COD):** số khách còn phải trả, để nhập đúng khi tạo đơn trên app đơn vị vận chuyển. Đã trả đủ thì ghi "Không thu hộ".
- **Đơn vị vận chuyển:** đơn đã chọn đơn vị lúc tạo thì popup chỉ hiện tên đơn vị, không chọn lại (muốn đổi thì Sửa đơn trước khi giao). Đơn cũ chưa chọn đơn vị, hoặc đơn vị đã tắt ở Cài đặt, thì chọn trong popup. Sửa vận chuyển và Gửi lại đơn vẫn chọn được.
- **Phí trả đơn vị vận chuyển:** số shop trả bên vận chuyển cho lượt này, mặc định bằng phí giao khách trả, sửa được. Là chi phí, trừ vào lãi; phí vận chuyển khách trả không tính vào doanh thu. Nhập khác phí khách trả thì popup báo **"Shop chịu thêm …"** (phần chênh trừ vào lãi, không thu thêm của khách) hoặc **"Shop dư …"**. So trên tổng cả đơn: phí khách trả (gồm phí gửi lại) với phí đã trả mọi lượt.
- **Đơn vị vận chuyển:** các đơn vị đang dùng ở [Cài đặt › Đơn vị vận chuyển](./settings.md#đơn-vị-vận-chuyển).
- **Mã vận đơn:** bắt buộc nếu đơn vị đó bắt buộc mã (Shop tự giao thì không). Tự bỏ khoảng trắng, viết hoa. Mã đã dùng cho đơn khác chưa hủy thì báo "Mã này đã dùng cho đơn …".

Lưu xong đơn sang Đang giao, lịch sử ghi "Giao Hàng Nhanh · mã vận đơn …". Đơn lưu tên đơn vị và link tra cứu lúc giao, đổi Cài đặt sau đó không ảnh hưởng.

- **Sửa vận chuyển** (khối Khách hàng) khi đơn Đang giao, Giao không thành, Đang hoàn về: đổi đơn vị hoặc mã, lịch sử ghi mã cũ → mã mới.
- **Giao lại** (Giao không thành, hàng còn ở đơn vị vận chuyển) giữ đơn vị và mã vận đơn cũ.
- **Đã nhận lại hàng** có ô **Phí hoàn hàng** trả đơn vị vận chuyển (mặc định 0), cộng vào chi phí vận chuyển của đơn.
- **Gửi lại đơn** (hàng đã hoàn về shop) là lượt giao mới: popup Gửi lại đơn có phí gửi lại khách trả, phí trả đơn vị vận chuyển (mặc định bằng phí gửi lại), số thu hộ mới, dòng "Lần giao trước: …", chọn lại đơn vị (mặc định đơn vị lần trước) và nhập mã vận đơn mới. Mã của lần trước bị chặn. Lưu xong đơn sang thẳng Đang giao.
- **Tra cứu** mở trang tra cứu của đơn vị nếu Cài đặt có link.

### In đơn và nhãn giao hàng

Nút **In** ở đầu chi tiết đơn, hoặc chọn nhiều đơn trên danh sách rồi bấm **In N đơn**. Trình duyệt mở hộp thoại in, mỗi đơn một trang.

| Loại | Khổ giấy | Nội dung |
|---|---|---|
| Phiếu đơn | A5 | Người gửi, mã đơn, ngày đặt, khách, địa chỉ, hình thức giao, đơn vị và mã vận đơn, các sản phẩm (kèm chi tiết nến tự phối), tạm tính, giảm giá, phí giao, tổng, đã thanh toán, còn phải thu, ghi chú của khách |
| Nhãn giao hàng | 100 × 150 mm (máy in nhiệt) | Tên shop, đơn vị và mã vận đơn, mã đơn, người gửi, người nhận (tên, SĐT, địa chỉ chữ to), nội dung hàng, ghi chú, số tiền thu hộ, "Hàng dễ vỡ" |

- Ghi chú nội bộ không in.
- Người gửi lấy ở [Cài đặt › Người gửi](./settings.md). In nhãn khi chưa có SĐT hoặc địa chỉ người gửi thì nhắc, vẫn in.
- Nhãn chưa có mã vạch. Đơn vị vận chuyển thường in nhãn riêng có mã vạch của họ; nhãn này dùng khi shop tự giao hoặc dán thêm.

### Xuất Excel

Nút **Xuất Excel** xuất danh sách đang lọc (hoặc các đơn đang chọn) ra file `don-hang-YYYY-MM-DD.xlsx`, gồm 2 trang:

- **Đơn hàng**, mỗi đơn một dòng: mã đơn, ngày đặt, trạng thái, khách, SĐT, địa chỉ, sản phẩm, số sản phẩm, tạm tính, giảm giá, mã giảm giá, phí giao, tổng, đã thu, còn phải thu (đơn hủy ghi 0), thanh toán, hình thức thu, ngày làm xong, phương thức giao, đơn vị vận chuyển, mã vận đơn, ghi chú của khách, ghi chú nội bộ.
- **Sản phẩm**, mỗi sản phẩm một dòng: mã đơn, ngày đặt, trạng thái, tên, nến có sẵn hay tự phối, chi tiết tự phối, số lượng, đơn giá, thành tiền.

Tiền và ngày là số thật trong Excel (cộng, lọc, sắp xếp được), dòng tiêu đề cố định và có sẵn bộ lọc.

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
| `carrier` | `{ id, name }` đơn vị vận chuyển chọn lúc tạo đơn. Sửa đơn đổi được khi chưa giao cho vận chuyển |
| `shippingCost` | Tổng phí shop đã trả đơn vị vận chuyển (mọi lượt giao, phí hoàn hàng). Chưa giao thì không có |
| `shipment` | Lượt giao hiện tại: `carrierId`, `carrier` (tên), `trackingCode`, `trackingUrl`, `cost` (phí trả đơn vị vận chuyển lượt này), `at`. Gửi lại đơn thì thay bằng lượt mới, lịch sử giữ mã cũ. Mã vận đơn không trùng giữa các đơn chưa hủy |
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
- `orders-create`: tạo đơn cho khách có sẵn, khách mới, khách bị chặn; mã giảm giá; cọc; đã nhận tiền; mã đơn theo ngày; lịch sử; đóng khi đang nhập thì lưu nháp.
- `order-draft`: đóng giữ nháp, nút Tiếp tục đơn nháp, tải lại trang vẫn còn, giá sản phẩm lấy lại giá hiện tại; Bắt đầu đơn mới; Bỏ đơn; tạo đơn xong xóa nháp; mở từ hồ sơ khách khi đang có nháp.
- `orders-custom-candle`, `orders-custom-modal`, `orders-amounts`: popup Tự phối nến, khóa lựa chọn hết nguyên liệu, số hũ Kho làm được, chọn nhiều sáp, lượng từng nguyên liệu, công thức trên đơn.
- `orders-cancel`: Bắt đầu làm trừ Kho, hủy đơn đang làm hỏi đã làm chưa, hoàn Kho, Kho thiếu thì chặn.
- `orders-decisions`: công thức, giữ nguyên liệu, thu đủ khi hoàn tất, trả lượt mã, hoàn tiền kèm ảnh, giao hàng lỗi, gửi lại đơn (nhập mã vận đơn mới, sang thẳng Đang giao).
- `shipping`: giao cho vận chuyển (báo thu hộ, bắt buộc mã, chặn mã trùng, lưu link tra cứu), mã trên bảng và tìm theo mã, sửa vận chuyển sang Shop tự giao, khách không nhận hàng hoàn về rồi gửi lại đổi sang đơn vị khác (chặn mã cũ, thu hộ cộng phí gửi lại), in nhãn và phiếu đơn, nhắc thiếu người gửi, chọn nhiều đơn in hàng loạt, xuất Excel theo tab, thêm đơn vị vận chuyển có link tra cứu, chọn đơn vị lúc tạo đơn rồi lúc giao chỉ hiện tên (không chọn lại) và báo shop chịu thêm khi phí trả đơn vị cao hơn phí khách trả.
- `logic/shipping`: link tra cứu, chuẩn hóa mã, mã trùng, tiền thu hộ, tìm theo mã vận đơn, nội dung file Excel đơn hàng.
- `orders-list`: thẻ thống kê, lọc thanh toán, khoảng ngày, tìm số điện thoại, sắp xếp giá trị, tab dồn vào nút …, đổi ngày làm xong, ghi chú nội bộ, đơn đã làm xong không đổi ngày, sản phẩm đang ẩn có nhãn khi tạo đơn.
- `logic/orders`: tình trạng thanh toán, số tiền hoàn theo lỗi khách / lỗi shop, thứ tự trạng thái, hủy được khi nào, nhãn hạn làm xong, bộ lọc và sắp xếp.
- `logic/discounts`: áp mã khi tạo đơn, tổng tiền và tiền cọc.
- `price-guards`: thêm sản phẩm bán thấp hơn vốn vào đơn thì báo Đơn lỗ.
- `logic/price-guards`: tiền hàng sau giảm giá không tính phí giao, thấp hơn vốn / lãi thấp; cọc ít nhất 1.000 ₫, không quá tổng, đơn 0 ₫ hoặc 0% thì không cọc.
- `logic/money`: cọc tính trên tiền hàng không gồm phí giao, tiền giữ lại khi khách hủy sau khi đã gửi lại.
