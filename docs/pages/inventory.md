# Kho nguyên liệu

**Đường dẫn:** `/inventory`, mở nguyên liệu `?material=<id>`, thêm mới `?material=new`, lọc `?status=out|low|ok|untracked|unused`

**Mục đích:** nơi duy nhất giữ số tồn nguyên liệu. Đặc tả kỹ thuật ở [inventory.md](../inventory.md).

## Nguyên liệu

| Trường | Ghi chú |
|---|---|
| Tên, mã nội bộ | |
| Loại | Hũ, sáp, tinh dầu, bấc, màu, trang trí, đóng gói, khác |
| Đơn vị | Cái, Gram, Mililít |
| Theo dõi tồn | Tắt thì luôn coi là còn hàng, vd "Không mùi" |
| Số tồn | Chỉ đổi qua phiếu kho |
| Ngưỡng sắp hết | Mặc định 500g, 500ml, 10 cái |
| Giá nhập | Giá bình quân mỗi đơn vị (1 g, 1 ml, 1 cái), xem mục Giá nhập |

## Drawer nguyên liệu

Mỗi việc chỉ có một chỗ làm, để không nhầm giữa "sửa thông tin" và "nhập hàng vào kho".

| Phần | Nguyên liệu đã có | Thêm nguyên liệu mới |
|---|---|---|
| **Thẻ tồn kho** (trên cùng) | Số tồn, ngưỡng, giá nhập bình quân, nút **Sửa giá**. Khối **Ghi phiếu kho**: Nhập thêm, Sản xuất (chỉ thành phẩm), Xuất kho, Kiểm kê, nút **Ghi nhận** | Không có |
| **Nguồn** (trong Thông tin) | **Nguyên liệu** (mua về) hoặc **Sản xuất**, đổi được | Như bên trái |
| **Sản xuất từ** (khi chọn Sản xuất) | Công thức cho 1 đơn vị | Như bên trái |
| **Thông tin** | Tên, mã, loại, đơn vị, màu | Như bên trái |
| **Cài đặt tồn kho** / **Tồn kho** | Theo dõi tồn, ngưỡng sắp hết. Không có ô số tồn hay ô giá | Theo dõi tồn, **Tồn ban đầu** và **Tổng tiền đã trả** nằm cạnh nhau (luôn hiện), ngưỡng sắp hết |
| Nút cuối drawer | **Lưu thông tin**: chỉ lưu thông tin và cài đặt, không đổi số tồn, không đổi giá | **Thêm vào kho** |

- Nguyên liệu **không theo dõi tồn** không có phiếu nhập, nên ô **Giá nhập** ("Mua … giá …") nằm ngay trong phần cài đặt.
- **Phiếu gõ dở:** đã nhập số lượng trong thẻ tồn kho mà chưa bấm Ghi nhận thì **Lưu thông tin** bị chặn kèm nhắc. Đóng drawer thì hỏi "Bỏ phiếu kho chưa ghi nhận?".

Hũ và nắp: mỗi dung tích là một nguyên liệu riêng. Màu nhuộm tính theo ml. Sáp pha trộn không còn dùng ở Thủ công, nguyên liệu vẫn còn trong Kho để admin tự quyết định.

## Trang danh sách

- **Thẻ thống kê:** Nguyên liệu (kèm giá trị tồn kho), Sắp hết, Hết hàng, Chưa dùng.
- **Khối Cần nhập thêm:** nguyên liệu hết hoặc sắp hết, kèm bước đang dùng.
- **Bộ lọc:** trạng thái, tìm theo tên hoặc mã không dấu, loại.
- **Sắp xếp:** cần nhập trước, tên A–Z, mới cập nhật.
- **Bảng:** tồn kho kèm thanh mức, ngưỡng, nơi dùng trên web, cập nhật, nút **+** nhập nhanh.
- **Phiếu kho gần đây:** 8 phiếu mới nhất.

## Phiếu kho

| Loại | Ai tạo | Kết quả |
|---|---|---|
| Nhập thêm | Admin | Cộng tồn. Bắt buộc ghi tiền lô, xem mục Giá nhập |
| Sản xuất | Admin, khi thêm thành phẩm hoặc tab Sản xuất | Cộng thành phẩm, trừ từng nguyên liệu theo công thức, chung một mã mẻ. Xem mục Sản xuất |
| Xuất / hao hụt | Admin | Trừ tồn, không cho xuất quá số đang có |
| Kiểm kê | Admin | Đặt lại theo số đếm thực tế |
| Theo đơn hàng | Tự động khi Bắt đầu làm | Trừ nguyên liệu của nến tự phối và nến có sẵn có công thức |
| Nhập thêm "Hoàn kho do hủy đơn" | Tự động khi hủy đơn Đang làm, chọn Chưa làm | Hoàn đúng lượng đã trừ, cả nến có sẵn |
| Nhập thêm "Tồn ban đầu" | Tự động khi tạo nguyên liệu có tồn | Ghi nhận số đầu kỳ, kèm tiền mua nếu tạo ở Kho |
| Sửa giá nhập | Admin, nút Sửa giá trên thẻ tồn kho | Đổi giá bình quân, không đổi số tồn. Lịch sử ghi giá mới và giá trước đó |

Không sửa, không xóa phiếu. Ghi sai thì ghi phiếu ngược lại.

## Giá nhập

- Mỗi nguyên liệu có **giá nhập bình quân** mỗi đơn vị (1 g, 1 ml, 1 cái), giữ 2 chữ số lẻ, ví dụ 59,8 ₫/g.
- **Giá đến từ tiền thật đã trả.** Phiếu **Nhập thêm** (trong thẻ tồn kho hoặc nút Phiếu kho) **bắt buộc** ghi **Tổng tiền lô**, hoặc tick **Không mất tiền** cho hàng tặng, mẫu thử. Thiếu cả hai thì không ghi được phiếu và báo đỏ ngay ô tiền.
- Hệ thống chia tổng tiền cho lượng nhập ra giá lô, rồi tính lại giá bình quân: (tồn × giá cũ + lượng nhập × giá lô) ÷ tổng. Hết tồn hoặc chưa có giá thì lấy giá lô. Hàng không mất tiền tính giá lô 0 ₫, nên kéo giá bình quân xuống.
- Phần còn lại trong kho luôn mang giá bình quân hiện tại, đã gộp mọi lần nhập trước. Xuất kho, trừ theo đơn, kiểm kê chỉ đổi số lượng, không đổi giá. Ví dụ:

  | Bước | Tồn | Giá bình quân |
  |---|---|---|
  | Tạo nguyên liệu: 5 kg, đã trả 300.000 ₫ | 5 kg | 60 ₫/g |
  | Nhập thêm 5 kg giá 400.000 ₫ | 10 kg | (300.000 + 400.000) ÷ 10.000 g = 70 ₫/g |
  | Làm nến hết 9 kg | 1 kg | 70 ₫/g, 1 kg còn lại đáng 70.000 ₫ |
  | Nhập thêm 5 kg giá 400.000 ₫ | 6 kg | (70.000 + 400.000) ÷ 6.000 g = 78,33 ₫/g |

- Trước khi bấm Ghi nhận, dòng xem trước hiện số tồn sau phiếu, giá lô và giá bình quân cũ → mới, vd "Sau phiếu: 10.000 g · giá lô 120 ₫/g · bình quân 90 ₫ → 93 ₫/g".
- **Thêm nguyên liệu** luôn có ô **Tổng tiền đã trả** cạnh ô Tồn ban đầu, vì lần nhập đầu đã biết giá. Có tồn thì bắt buộc (hoặc Không mất tiền). Hệ thống ra giá nhập ban đầu, vd 5.000 g giá 300.000 ₫ = 60 ₫/g, và ghi tiền vào phiếu "Tồn ban đầu". Chưa có hàng thì để trống, giá có từ phiếu Nhập thêm đầu tiên. Ghi tiền mà tồn 0 thì báo "Nhập tồn ban đầu để chia ra giá mỗi đơn vị". Lỗi chỉ báo khi bấm Thêm vào kho, không báo lúc đang gõ.
- **Sửa giá** chỉ dùng khi giá đang sai (nhập nhầm tiền lô) hoặc chưa có giá. Ghi theo lần mua: "Mua **5** **kg** giá **300.000 ₫**", hệ thống tự ra **60 ₫/g**. Mua theo kg hoặc g (sáp), lít hoặc ml (tinh dầu, màu), cái (hũ, bấc…). Giá đang có hiện lại theo 1 kg, 1 lít hoặc 1 cái. Mỗi lần sửa ghi một dòng "Sửa giá nhập" trong lịch sử.
- Lịch sử kho hiện tiền lô và giá lô của từng phiếu nhập, "Không mất tiền" với hàng tặng.
- Nguyên liệu tạo nhanh từ trang Thủ công (kèm tồn ban đầu) chưa có giá. Thẻ tồn kho hiện "Chưa có giá nhập" kèm nút **Đặt giá**.
- **Giá trị tồn kho** = tồn × giá nhập của các nguyên liệu có theo dõi tồn và có giá.
- Giá nhập dùng tính giá vốn ở chi tiết đơn, form Sản phẩm trưng bày, popup Tự phối nến và thẻ Lãi gộp trên Dashboard.
- Dữ liệu cũ chưa có giá nhập được điền giá mẫu theo mã nguyên liệu. Giá mẫu chỉ để tham khảo, cần sửa theo giá thật của xưởng.

## Sản xuất

Thành phẩm xưởng tự làm từ nguyên liệu khác trong Kho, vd hũ gốm làm từ thạch cao và màu pha thạch cao.

- **Nguồn:** drawer nguyên liệu có lựa chọn **Nguyên liệu** (mua về) hoặc **Sản xuất**. Chọn Sản xuất thì hiện phần **Sản xuất từ**: nguyên liệu và lượng cho 1 đơn vị, vd Hũ gốm 150ml = 350 g thạch cao + 2 ml màu. Ô chọn hiện số đang có của từng nguyên liệu. Không chọn được chính nó, hoặc thứ đang được làm từ nó.
- **Thêm thành phẩm mới:** thay cho Tồn ban đầu và Tổng tiền đã trả là **Số lượng sản xuất** (cũng là tồn ban đầu) và **Giá**. Hệ thống nhân định mức ra lượng cần, vd làm 20 hũ thì hiện "Thạch cao: trừ 7.000 g · còn 12.000".
- **Bấm Thêm vào kho:** trừ từng nguyên liệu, mỗi nguyên liệu một phiếu Sản xuất "Làm Hũ gốm 150ml · 20 cái". Cộng thành phẩm bằng phiếu Sản xuất "Mẻ đầu tiên". Các phiếu chung một mã mẻ `SX-…`. Để số lượng 0 thì chỉ lưu công thức, làm sau.
- **Mẻ sau:** thẻ tồn kho của thành phẩm có tab **Sản xuất**, dùng công thức đã lưu, có xem trước lượng trừ và giá bình quân mới.
- **Giá:**
  - **Theo giá nguyên liệu** (mặc định) = tổng lượng × giá nhập bình quân của từng nguyên liệu. Vd 7.000 g × 40 ₫ + 40 ml × 200 ₫ = 288.000 ₫, tức 14.400 ₫/hũ.
  - **Tự nhập** tổng chi phí cả mẻ khi có thêm điện nung, tiền công.
  - Tổng chia cho số lượng ra giá mỗi đơn vị, rồi gộp vào giá bình quân của thành phẩm như một lô nhập.
- **Chặn khi:** thiếu nguyên liệu, nguyên liệu chưa có giá (lúc chọn Theo giá nguyên liệu), Tự nhập mà chưa ghi tiền, nguyên liệu trong công thức đã bị xóa.
- Thành phẩm sản xuất luôn theo dõi tồn. Vẫn Nhập thêm được nếu có lúc mua ngoài, giá bình quân gộp chung. Đổi lại thành Nguyên liệu thì bỏ công thức, số tồn giữ nguyên.
- Bảng kho ghi "Tự sản xuất" dưới tên. Xóa một nguyên liệu đang dùng để sản xuất thì cảnh báo tên thành phẩm.
- **Đã dùng bao nhiêu thạch cao để làm hũ:** xem các phiếu Sản xuất (số âm) trong lịch sử kho của thạch cao, mỗi phiếu ghi làm thành phẩm nào, bao nhiêu cái, mã mẻ.

## Lượng tiêu hao mỗi hũ

| Nguyên liệu | Công thức |
|---|---|
| Hũ, nắp, phụ kiện | 1 cái |
| Sáp, màu, trang trí theo khối lượng | Lượng sáp × hệ số của bước. Màu nhuộm tính theo ml, mặc định 1 ml cho 100 g sáp |
| Tinh dầu | Lượng sáp × độ đậm × tỉ lệ phối, mặc định độ đậm 8% |

Làm tròn lên. Nhiều dòng dùng chung nguyên liệu thì cộng lại. Chọn nhiều loại sáp hoặc màu thì chia đều cho số loại.

Đây là lượng mặc định. Admin điền lượng khác ở popup Tự phối nến thì trừ theo số đã điền. Nến có sẵn trừ theo công thức của sản phẩm.

## Giữ nguyên liệu

Đơn Đã thanh toán giữ nguyên liệu cho tới khi Bắt đầu làm hoặc hủy. Số tồn không đổi, cột Tồn kho hiện thêm "Đang giữ … · Dùng được …". Tạo đơn mới chỉ dùng được phần còn lại. Mức Hết hàng, Sắp hết và trang Thủ công vẫn tính theo tồn thực tế.

## Liên kết trang khác

- **Thủ công:** hết nguyên liệu thì lựa chọn bị khóa.
- **Tạo đơn:** kiểm tra đủ nguyên liệu cho cả đơn, tính trên số dùng được.
- **Đơn hàng:** giữ khi nhận cọc hoặc đủ tiền, trừ khi Bắt đầu làm, thiếu thì chặn.
- **Sản phẩm trưng bày:** công thức từng sản phẩm trỏ tới nguyên liệu trong Kho.

## Chưa có

- Hệ số hao hụt khi đổ.

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md).

**Đã có test:**

- `production`: thêm thành phẩm Sản xuất (công thức nhiều nguyên liệu, mẻ đầu trừ từng nguyên liệu, giá theo nguyên liệu, phiếu chung mã mẻ, bảng ghi Tự sản xuất, lịch sử nguyên liệu), thiếu nguyên liệu bị chặn, Tự nhập giá bắt buộc tổng chi phí, mẻ sau ở tab Sản xuất gộp giá bình quân, chuyển nguyên liệu mua về sang Sản xuất và ngược lại, công thức không chọn được chính nó, cảnh báo khi xóa nguyên liệu đang dùng để sản xuất.
- `logic/production`: định mức × số lượng, tiền nguyên liệu tiêu tốn, thiếu nguyên liệu, thiếu giá, Tự nhập, nguyên liệu đã xóa, chặn công thức vòng.
- `workshop-cost`: Sửa giá theo lần mua (kg, g) tự chia ra giá mỗi gram, tổng tiền lô ở phiếu Nhập thêm và Phiếu kho tự ra giá lô và tính lại bình quân, lịch sử ghi tiền lô, giá trị tồn kho.
- `logic/costs-capacity`: chia tổng tiền ra giá mỗi đơn vị, quy đổi kg/lít, điền lại theo 1 kg, tiền lô bắt buộc hoặc Không mất tiền, xem trước giá lô và bình quân, giá nhập bình quân, tiền nguyên liệu và nguyên liệu chưa có giá.
- `inventory`: thêm nguyên liệu (chặn khi có tồn ban đầu mà chưa ghi tiền mua, tự ra giá mỗi gam, hàng không mất tiền, tồn 0 chưa có giá), đơn vị, ngưỡng mặc định, nhập (chặn thiếu tiền lô, giá từ lô đầu tiên), xuất (chặn quá tồn), kiểm kê, nhập nhanh từ bảng (chặn thiếu tiền lô, bình quân tính cả hàng tặng), tìm không dấu, lọc, sửa mã nội bộ không đụng giá.
- `inventory-ui`: lọc Hết hàng và Chưa dùng từ đường dẫn, sắp xếp tên, nhập thêm và Phiếu kho gần đây, lựa chọn đang dùng nguyên liệu, hũ theo từng cỡ ở Thủ công, nguyên liệu không theo dõi tồn (sửa giá trong form, không có phiếu), Nhập thêm thiếu tiền lô bị chặn và Không mất tiền, ô Tổng tiền đã trả luôn hiện khi thêm nguyên liệu (có tồn thì bắt buộc, chưa bấm lưu thì chưa báo đỏ, tự ra giá mỗi gam), tồn 0 mà ghi tiền thì báo và hết báo khi ghi số tồn, để trống thì tạo chưa có giá, form nguyên liệu đã có không có ô giá kiểu mua hàng và Sửa giá ghi lịch sử, Lưu thông tin sau khi nhập kho giữ giá bình quân mới, phiếu gõ dở chặn lưu và hỏi khi đóng.
- `logic/inventory`: mức tồn, phiếu kho, bộ lọc gồm Không theo dõi và Chưa dùng, 3 cách sắp xếp.
- Giữ nguyên liệu (Đang giữ, Dùng được) ở `orders-decisions` và `logic/products`.
