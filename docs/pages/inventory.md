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

Hũ và nắp: mỗi dung tích là một nguyên liệu riêng. Màu nhuộm tính theo ml. Sáp pha trộn không còn dùng ở Thủ công, nguyên liệu vẫn còn trong Kho để admin tự quyết định.

## Trang danh sách

- **Thẻ thống kê:** Nguyên liệu, Sắp hết, Hết hàng, Chưa dùng.
- **Khối Cần nhập thêm:** nguyên liệu hết hoặc sắp hết, kèm bước đang dùng.
- **Bộ lọc:** trạng thái, tìm theo tên hoặc mã không dấu, loại.
- **Sắp xếp:** cần nhập trước, tên A–Z, mới cập nhật.
- **Bảng:** tồn kho kèm thanh mức, ngưỡng, nơi dùng trên web, cập nhật, nút **+** nhập nhanh.
- **Phiếu kho gần đây:** 8 phiếu mới nhất.

## Phiếu kho

| Loại | Ai tạo | Kết quả |
|---|---|---|
| Nhập thêm | Admin | Cộng tồn |
| Xuất / hao hụt | Admin | Trừ tồn, không cho xuất quá số đang có |
| Kiểm kê | Admin | Đặt lại theo số đếm thực tế |
| Theo đơn hàng | Tự động khi Bắt đầu làm | Trừ nguyên liệu của nến tự phối và nến có sẵn có công thức |
| Nhập thêm "Hoàn kho do hủy đơn" | Tự động khi hủy đơn Đang làm, chọn Chưa làm | Hoàn đúng lượng đã trừ, cả nến có sẵn |
| Nhập thêm "Tồn ban đầu" | Tự động khi tạo nguyên liệu có tồn | Ghi nhận số đầu kỳ |

Không sửa, không xóa phiếu. Ghi sai thì ghi phiếu ngược lại.

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
