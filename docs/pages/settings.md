# Cài đặt

**Đường dẫn:** `/settings`

**Mục đích:** để admin tự đổi các con số về tiền cọc, giao hàng, phí vận chuyển, người gửi và đơn vị vận chuyển.

## Các mục cài đặt

| Mục | Khoảng cho phép | Mặc định | Dùng ở đâu | Tình trạng |
|---|---|---|---|---|
| Mức cọc | 1–99% | 50% | Tạo đơn, chi tiết đơn. Tính trên tiền hàng (sau giảm giá), không gồm phí vận chuyển | Đang dùng |
| Số cây làm được mỗi ngày | 0–1.000 cây, 0 = không giới hạn | 20 | Gợi ý ngày làm xong, cảnh báo ngày quá tải, lịch xưởng trên Dashboard | Đang dùng |
| Số ngày làm tối thiểu | 0–30 ngày | 3 | Ngày làm xong gợi ý sớm nhất = hôm nay + số này | Đang dùng |
| Lãi tối thiểu | 0–95% | 50% | Thủ công: cỡ, lựa chọn lãi dưới mức có cảnh báo cam và giá gợi ý (thấp hơn giá vốn luôn báo đỏ) | Đang dùng |
| Hệ số gợi ý giá | ×1–×20 | ×2,5 | Thủ công: giá gợi ý = giá vốn × hệ số, không thấp hơn mức lãi tối thiểu | Đang dùng |
| Số lần giao tối đa | 1–10 lần | 3 | Giao hàng lỗi: hết số lần thì đơn tự hoàn về | Đang dùng |
| Phí gửi lại đơn | Từ 0 ₫ | 30.000 ₫, số tạm | Gửi lại đơn: phí mặc định, sửa được | Đang dùng |
| Phương thức giao | Tên, phí, số ngày, bật/tắt | Tiêu chuẩn miễn phí 3 ngày; Nhanh 50.000 ₫ 1 ngày | Tạo đơn, chi tiết đơn. Phí phương thức đang bật đầu tiên dùng để kiểm tra giá sản phẩm khi khách bỏ cọc | Đang dùng |
| Người gửi | Tên shop (bắt buộc), SĐT, địa chỉ lấy hàng | 2510 Candle, SĐT và địa chỉ trống | Nhãn giao hàng, phiếu đơn | Đang dùng |
| Đơn vị vận chuyển | Tên, link tra cứu, bắt buộc mã, bật/tắt | GHN, GHTK, Viettel Post, J&T Express, Shop tự giao | Tạo đơn (chọn đơn vị), Giao cho vận chuyển, Tra cứu | Đang dùng |

Tự đặt tên được, nên có thể tạo "Nội thành", "Ngoại tỉnh" để tính phí theo khu vực.

## Bố cục

- **Đầu trang:** dòng "Có thay đổi chưa lưu", nút Mặc định, nút Lưu cài đặt.
- **Bên trái:** các khối Đặt cọc, Xưởng, Giá bán, Giao hàng, Phí vận chuyển, Người gửi, Đơn vị vận chuyển, Sao lưu dữ liệu, Xóa toàn bộ dữ liệu.
- **Bên phải:** Xem trước tiền trên đơn mẫu 1.000.000 ₫, cập nhật theo số đang nhập.

## Quy tắc

- Phải có ít nhất một phương thức đang dùng, tên không trùng nhau.
- **Đổi cài đặt chỉ áp dụng đơn mới.** Đơn lưu lại % cọc, tên phương thức, số ngày và phí lúc tạo.
- **Số lần giao tối đa và Phí gửi lại đơn** lấy giá trị hiện tại lúc xử lý, không lưu trên đơn.
- Đơn tạo trước khi có Cài đặt hiển thị theo giá trị cũ: cọc 50%, Tiêu chuẩn 3 ngày, Nhanh 1 ngày.
- **Mặc định** chỉ điền lại số, phải bấm Lưu mới có hiệu lực.
- Rời trang khi chưa lưu sẽ được hỏi lại.

## Công suất xưởng

- Tính theo **số cây** (cộng số lượng các dòng) của đơn Chờ thanh toán, Đã thanh toán, Đang làm, theo **ngày làm xong**.
- **Tạo đơn, sửa đơn, gửi bù:** ngày mặc định là ngày sớm nhất từ hôm nay + số ngày tối thiểu còn đủ chỗ. Dưới ô ngày ghi số cây đã nhận; vượt thì báo và có nút dùng ngày còn chỗ. Đơn lớn hơn công suất một ngày thì gợi ý ngày còn trống hẳn.
- **Đổi ngày làm xong ở chi tiết đơn:** sang ngày vượt vẫn đổi, có thông báo cảnh báo.
- **Chỉ cảnh báo, không chặn** nhận đơn.

## Phí vận chuyển khi tạo đơn

Chọn phương thức thì ô Phí vận chuyển tự điền. Admin sửa được cho riêng đơn đó, đơn lưu số cuối cùng.

## Đơn vị vận chuyển

- Mỗi đơn vị: công tắc Dùng, tên, **link tra cứu**, công tắc **Bắt buộc mã**.
- Link tra cứu có `{code}` ở chỗ mã vận đơn, vd `https://donhang.ghn.vn/?order_code={code}`. Để trống thì đơn chỉ sao chép được mã. Link không bắt đầu bằng http hoặc thiếu `{code}` thì không lưu được.
- Link mặc định của GHN và GHTK chỉ là gợi ý, nên mở thử một mã thật để kiểm tra; Viettel Post và J&T để trống.
- Tắt Bắt buộc mã cho đơn vị không có mã (Shop tự giao, xe ôm, Grab).
- Phải có ít nhất một đơn vị đang dùng, tên không trùng. Đơn đã giao giữ tên và link lúc giao.

## Sao lưu dữ liệu

Dữ liệu nằm trên máy chủ (BE). Khối **Sao lưu dữ liệu** cuối trang để cất thêm một bản riêng:

- **Sao lưu (tải file):** tải lại mọi dữ liệu từ BE rồi tải về `2510-bo-sao-luu-YYYY-MM-DD-HHmm.json` gồm toàn bộ dữ liệu BO (đơn, sản phẩm, danh mục, sản phẩm hủy đơn, kho và phiếu kho, khách, mã giảm giá, Thủ công, cài đặt, đơn nháp). Không gồm phiên đăng nhập. Cất file ở nơi an toàn (Google Drive, máy khác).
- **Khôi phục:** làm trên máy chủ bằng `pnpm db:import <file>` ở thư mục `be` (xóa dữ liệu hiện có rồi ghi lại theo file, xem [backend.md](../backend.md#nhập-dữ-liệu-từ-bo)). Trang chỉ ghi hướng dẫn này, không có nút khôi phục.
- **Chế độ dữ liệu trên trình duyệt** (`VITE_DATA_SOURCE=local`, dùng cho test): có nút **Khôi phục từ file**, chọn file sao lưu → hiện ngày sao lưu và số đơn, sản phẩm, khách, nguyên liệu, mã giảm giá → bấm **Khôi phục** thì **thay toàn bộ** dữ liệu hiện tại bằng dữ liệu trong file rồi tải lại trang. Nên sao lưu dữ liệu hiện tại trước khi khôi phục.
- File không phải file sao lưu của BO, hoặc hỏng, thì báo lỗi và không đổi gì. Trình duyệt hết chỗ lưu khi khôi phục thì giữ nguyên dữ liệu cũ.
- Hiện **Sao lưu gần nhất** và nhắc (cam) khi chưa sao lưu lần nào hoặc đã quá 7 ngày.

## Xóa toàn bộ dữ liệu

Khối cuối cột trái, nút đỏ **Xóa toàn bộ dữ liệu…**: đưa BO về trạng thái trống để bắt đầu lại.

- Xóa đơn hàng, sản phẩm, danh mục, sản phẩm hủy đơn, kho và phiếu kho, khách hàng, mã giảm giá, cấu hình Thủ công, cài đặt, đơn nháp. Cài đặt về mặc định. **Thủ công** giữ các bước của cấu hình mẫu (Hũ, Sáp, Hương, Bấc, Màu, Trang trí, Cá nhân hóa) nhưng **bỏ hết lựa chọn** và tuỳ chọn thêm (vì lựa chọn mẫu trỏ tới Kho mẫu không còn); ô nhập chữ giữ nguyên. Thêm lựa chọn gắn Kho thật ở trang Thủ công.
- **Giữ đăng nhập:** PIN (nằm ở BE), trạng thái khóa khi nhập sai, phiên đang dùng — không bị đăng xuất.
- **Hộp thoại xác nhận:** cảnh báo đỏ "Không thể hoàn tác" kèm danh sách sẽ xóa; nút **Sao lưu trước** tải file sao lưu ngay trong hộp thoại (xong thì ghi "Đã tải file sao lưu."); phải gõ **XÓA HẾT** (không phân biệt hoa thường) thì nút **Xóa toàn bộ** mới bật, Enter cũng xác nhận. Hủy / đóng thì không đổi gì; đang xóa thì không đóng được.
- Xóa xong báo "Đã xóa toàn bộ dữ liệu." và tải lại BO về Dashboard.
- Chế độ BE gọi `POST /api/admin/reset` ([api.md](../api.md#xóa-toàn-bộ-dữ-liệu)); BE cũng kiểm tra câu xác nhận. Chế độ dữ liệu trên trình duyệt (test) xóa các khóa `bo-*` trong localStorage.

## API

`GET` và `PUT /api/admin/settings` ([api.md](../api.md#cài-đặt)). Đơn lưu lại `depositPercent`, `shippingName`, `shippingDays`, `shippingFee` lúc tạo nên đổi Cài đặt không ảnh hưởng đơn cũ. Chưa có API cho web (`GET /api/settings`).

## Chưa có

Web chưa đọc Cài đặt.

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md).

**Đã có test:**

- `workshop-cost`: lưu số cây mỗi ngày và số ngày làm tối thiểu; `logic/costs-capacity`: tính tải xưởng, ngày gợi ý, lịch 7 ngày.
- `settings`: giá trị mặc định, xem trước, hỏi khi rời trang chưa lưu, chặn tên trùng và tắt hết phương thức, lưu, tải lại, áp dụng vào tạo đơn, đơn cũ không lỗi, nút Mặc định.
- `misc-extra`: mức cọc ngoài 1–99% không lưu được.
- `craft-pricing`: Lãi tối thiểu và Hệ số gợi ý giá có giá trị mặc định, lưu được.
- Số lần giao tối đa và Phí gửi lại đơn được dùng trong `orders-decisions`.
- `backup`: tải file sao lưu (đủ dữ liệu bo-, không có phiên đăng nhập), nhớ lần sao lưu, khôi phục thay dữ liệu và tải lại trang, từ chối file sai hoặc hỏng.
- `shipping`: người gửi in lên nhãn; thêm đơn vị vận chuyển, chặn link thiếu `{code}`, đơn vị mới dùng được khi giao.
