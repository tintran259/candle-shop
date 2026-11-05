# Phiếu kho

**Đường dẫn:** `/inventory/movements`

**Mục đích:** xem và lọc mọi phiếu kho của xưởng: nhập thêm, xuất / hao hụt, kiểm kê, sản xuất, trừ theo đơn, sửa giá nhập. Số tồn từng nguyên liệu vẫn ở [Kho nguyên liệu](./inventory.md).

## Vị trí

- Sidebar: mục **Phiếu kho** nằm ngay dưới **Kho nguyên liệu**, thụt vào như mục con. Mở trang này thì chỉ Phiếu kho sáng.
- Trang Kho nguyên liệu không còn khối Phiếu kho gần đây. Lịch sử của một nguyên liệu vẫn có trong drawer nguyên liệu.

## Bố cục

- **Đầu trang:** tiêu đề, link về Kho nguyên liệu, nút **Ghi phiếu kho** (cùng popup với nút Phiếu kho ở trang Kho).
- **Thẻ thống kê** theo bộ lọc đang chọn:

| Thẻ | Cách tính |
|---|---|
| Số phiếu | Số phiếu khớp bộ lọc (ghi kèm tổng số phiếu khi đang lọc) |
| Tiền nhập | Tổng tiền lô các phiếu **Nhập thêm** |
| Phiếu cộng tồn | Phiếu có lượng dương: nhập thêm, thành phẩm sản xuất, kiểm kê tăng |
| Phiếu trừ tồn | Phiếu có lượng âm: xuất, theo đơn, nguyên liệu dùng sản xuất, kiểm kê giảm |

- **Bộ lọc** (nằm trên URL, gửi link được, đổi bộ lọc thì về trang 1):
  - Tìm: tên nguyên liệu (không dấu), ghi chú, mã đơn, mã mẻ `SX-…`.
  - Loại phiếu.
  - Nguyên liệu.
  - Khoảng ngày (tính cả hai đầu).
  - **Xóa bộ lọc** khi đang lọc.
- **Danh sách:** mới nhất trước, có phân trang 10 / 20 / 50. Mỗi phiếu ghi loại, nguyên liệu (bấm mở drawer ở Kho), thời gian, người ghi, mã đơn, mã mẻ (bấm để lọc các phiếu cùng mẻ), ghi chú, tiền lô / chi phí mẻ, lượng thay đổi và số còn.

## Chưa có

- Xuất file (CSV, Excel).
- Lưu tối đa 500 phiếu trên trình duyệt; khi có BE thì lấy theo trang từ `GET /api/admin/inventory/movements` (xem [inventory.md](../inventory.md)).

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md).

**Đã có test:** `stock-movements`: lọc theo loại, nguyên liệu, khoảng ngày, tìm mã đơn / mã mẻ / tên không dấu; tiền nhập và đếm phiếu cộng / trừ tồn; sidebar Phiếu kho nằm dưới Kho nguyên liệu và sáng đúng mục; trang Kho không còn khối Phiếu kho gần đây; lọc trên URL, không khớp thì báo; nút Ghi phiếu kho.
