# Phần chung của BO

## Menu bên trái

| Nhóm | Mục | Số đỏ trên menu |
|---|---|---|
| Tổng quan | Dashboard | |
| Bán hàng | Đơn hàng | Đơn Chờ thanh toán, Đã thanh toán, Giao không thành, Đã hoàn về |
| | Khách hàng, Đánh giá, Mã giảm giá | |
| Sản phẩm | Sản phẩm trưng bày, Danh mục, Sản phẩm hủy đơn | |
| Xưởng | Thủ công | |
| | Kho nguyên liệu (mục con Phiếu kho) | Nguyên liệu đã hết hàng |
| Hệ thống | Cài đặt | |

Nút ở đầu trang thu gọn menu: còn icon, tên nhóm thay bằng vạch ngăn. Trên điện thoại, menu mở từ cạnh màn hình.

Logo và khối tài khoản luôn đứng yên, chỉ phần menu cuộn khi màn hình thấp. Mục đang mở có nền sáng hơn và vạch màu nhấn bên trái; mục con (Phiếu kho) có đường nhánh nối lên mục cha.

Cuối menu là tên tài khoản và nút **Đăng xuất**. Chưa đăng nhập thì mọi trang chuyển về [Đăng nhập](./login.md).

## Tìm kiếm trên header

Mở bằng ô tìm kiếm hoặc `Ctrl K`. Tìm không phân biệt dấu trong:

- Trang và thao tác nhanh: Thêm sản phẩm, Tạo mã giảm giá.
- Đơn hàng, khách hàng, sản phẩm trưng bày, mã giảm giá.
- Nguyên liệu và lựa chọn Thủ công.

Hiện kết quả mở gần đây khi chưa gõ. Chưa tìm được từng sản phẩm hủy đơn, danh mục và từng mục trong Cài đặt.

## Thông báo

Chuông trên header tự tổng hợp từ dữ liệu:

| Loại | Khi nào |
|---|---|
| Cần xử lý | Đơn trễ hạn làm xong; đơn cần xong hôm nay, ngày mai; đơn Giao không thành, Đã hoàn về; đơn chờ hoàn tiền; nguyên liệu hết hoặc sắp hết; mã giảm giá sắp hết hạn |
| Hoạt động mới | Đơn mới chờ thanh toán; đơn đã nhận cọc hoặc đã thanh toán |

Bấm một thông báo để mở đúng đơn hoặc đúng bộ lọc.

## Quy ước dùng chung

- **Drawer mở theo đường dẫn:** gửi link cho người khác sẽ mở đúng đơn, đúng sản phẩm. Nút Back đóng drawer.
- **Phân trang trên đường dẫn:** tải lại vẫn giữ trang đang xem.
- **Thay đổi chưa lưu:** đóng drawer sửa hoặc rời trang Cài đặt sẽ được hỏi lại.
- **Nút Dữ liệu mẫu:** có ở nhiều trang, xóa dữ liệu trên trình duyệt và quay về dữ liệu mẫu. Sẽ bỏ khi có BE.
- **Khung tải:** mỗi trang có skeleton đúng bố cục, chạy hết chiều rộng màn hình.
- **Điện thoại (dưới 576px):** không trang nào cuộn ngang. Bảng Đơn hàng, Khách hàng, Mã giảm giá, đơn gần đây ở Tổng quan, Kho, Danh mục, lựa chọn Thủ công gộp cột phụ xuống dưới cột chính — mỗi dòng một ô gọn (vd đơn: mã, tổng tiền, khách, trạng thái, thanh toán, ngày làm xong), chỉ giữ công tắc và nút thao tác (`bo/src/components/compact-columns.tsx`). Bảng Đơn hàng trên điện thoại bỏ ô chọn in nhiều đơn. Màn cảm ứng nới vùng chạm của công tắc nhỏ, ô tích, nút sao chép, nút phân trang lên ~40px. Ô tiêu đề cột ghim (khi bảng cuộn ngang trên màn vừa) có nền, không lộ chữ cột khác.

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md).

**Đã có test:**

- `common`: số đỏ menu Đơn hàng và Kho khớp dữ liệu, nhập kho thì số giảm; thông báo mở đúng chỗ, đánh dấu đã đọc; tìm kiếm `Ctrl K`, phím `/`, tìm không dấu đơn, khách, sản phẩm, nguyên liệu, mở gần đây, không có kết quả; thu gọn menu; menu điện thoại.
- `drawers`: mở drawer theo đường dẫn, Back đóng drawer, giữ trang khi mở và đóng, link sai báo không tìm thấy, nguyên liệu mở ở Kho.
- `chunk-reload`: lỗi tải code trang thì tự tải lại một lần, vẫn lỗi thì báo lỗi tiếng Việt và giữ menu.
- `layout-width`: nội dung và khung tải chạy hết chiều rộng, không tràn ngang.

## Trên điện thoại (cảm ứng)

Cập nhật 26/11/2026:

- **Tooltip** dùng chung `bo/src/components/tooltip.tsx` (eslint chặn import `Tooltip` thẳng từ `antd`). Máy có chuột: rê chuột hiện như cũ. Máy cảm ứng: tooltip bọc **nút / link** không hiện — chạm **một lần** là bấm (trước đây iPhone coi lần chạm đầu là "rê chuột", phải chạm 2 lần, vd nút ảnh chính / xem / xóa ảnh, Sao chép SĐT, Nhắn Zalo). Nút đang khóa và chữ / nhãn / biểu tượng thông tin thì **chạm để xem**.
- Hiệu ứng rê chuột trong CSS (`:hover`) chỉ áp dụng khi máy có chuột (`@media (hover: hover)`), không "dính" sau khi chạm.
- **Vạch Home iPhone:** `viewport-fit=cover` + `env(safe-area-inset-*)` (`bo/src/styles/safe-area.css`): cuối trang, chân drawer (nút Lưu / Hủy), drawer không có chân, thanh "thay đổi chưa lưu" ở Thủ công đều chừa khoảng dưới, không dính vạch Home. Máy không có vạch Home thì không đổi gì.
- **Thanh "thay đổi chưa lưu"** (Thủ công): điện thoại xếp "Xem thay đổi" + "Bỏ thay đổi" chia đôi hàng, "Lưu thay đổi" cả hàng bên dưới (trước đây ba nút một hàng tràn khỏi màn hình).
- Nút nhỏ dưới ảnh (ảnh chính / xem / xóa) trên màn cảm ứng to 36 × 36 px cho dễ chạm.
- **Ô nhập không làm phóng to trang:** iPhone tự phóng to khi chạm ô nhập có chữ < 16px (antd 14px) → layout lệch, nút chân drawer bị cắt. Màn cảm ứng: chữ trong Input / Select / InputNumber / DatePicker / ô văn bản 16px (`bo/src/styles/touch.css`). Không khóa phóng to (`maximum-scale`) để vẫn phóng to bằng hai ngón được.
- **Menu điện thoại:** cao theo phần màn hình nhìn thấy (`100dvh`, trừ vạch Home) — khối tài khoản + nút Đăng xuất luôn nằm trong màn hình (trước đây `100vh` trên iPhone cao hơn màn hình, đẩy xuống dưới vạch Home). Mở menu: khóa cuộn trang phía sau, menu cuộn tới mục đang mở; đóng bằng chạm nền tối hoặc phím Esc. Logo sáng bỏ lớp nền gần trong suốt (thành khung mờ trên nền nâu).
- **Drawer Sản phẩm › Phụ kiện khác:** điện thoại xếp ô nguyên liệu cả hàng, lượng + giá + xóa hàng dưới (trước đây một hàng, ô nguyên liệu bị ép ~30px, danh sách thả xuống không đọc được).
- **Không cuộn trang phía dưới:** mở dialog / drawer / xem ảnh lớn / menu điện thoại thì khóa cả `html` (`bo/src/lib/scroll-lock.ts` theo dõi khóa của antd — `<style rc-util-key="rc-util-locker-…">` chỉ khóa `body`, iPhone vẫn vuốt cuộn được trang dưới) — đóng thì trang giữ đúng vị trí cũ. Danh sách thả xuống, lịch, dialog, drawer: `overscroll-behavior: contain` (`styles/touch.css`) — cuộn tới cuối danh sách thì dừng, trước đây trang phía dưới cuộn theo.
- Rà khổ 390 px (17 trang): không trang nào tràn ngang; Concept trước đây tràn hàng nút đầu trang — nay xuống dòng.
