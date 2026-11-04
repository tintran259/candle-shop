# Danh mục

**Đường dẫn:** `/categories`

**Mục đích:** admin tự quản lý danh mục (loại hương) của sản phẩm trưng bày thay vì danh sách cố định Trái cây, Thiên nhiên, Nước hoa.

## Trang danh sách

| Cột | Nội dung |
|---|---|
| Tay nắm ⠿ | Kéo thả dòng để sắp xếp, hoặc dùng bàn phím: Tab tới tay nắm, Space nhấc, mũi tên lên xuống, Space đặt, Esc hủy. Thứ tự này là thứ tự trong bộ lọc của web |
| Danh mục | Tag theo màu đã chọn, tên tiếng Anh bên dưới |
| Sản phẩm | Số sản phẩm thuộc danh mục, bấm để mở Sản phẩm trưng bày đã lọc sẵn |
| Hiện trên web | Tắt thì danh mục không hiện trong bộ lọc của web. Sản phẩm vẫn giữ danh mục |
| Thao tác | Sửa, xóa |

## Thêm, sửa

| Trường | Quy tắc |
|---|---|
| Tên tiếng Việt | Bắt buộc, không trùng tên khác (so không dấu) |
| Tên tiếng Anh | Để trống thì dùng tên tiếng Việt |
| Màu tag | Chọn trong 12 màu có sẵn |

Mã danh mục tạo từ tên lúc thêm và **không đổi** khi sửa tên, nên sản phẩm luôn giữ đúng danh mục.

## Xóa

- Danh mục **còn sản phẩm** thì không xóa được. Chuyển sản phẩm sang danh mục khác, hoặc tắt "Hiện trên web".
- Danh mục trống xóa được, có hỏi lại.

## Dữ liệu cũ

Sản phẩm lưu trước khi có trang này dùng trường loại hương `fruits`, `nature`, `parfum`. Ba mã này chính là mã của ba danh mục mẫu nên sản phẩm cũ tự vào đúng danh mục, không mất dữ liệu.

## Việc của BE

- `GET/POST/PATCH/DELETE /api/categories`, mỗi bản ghi `{ id, name: { vi, en }, color, hidden, sortOrder }`.
- Sản phẩm lưu `categoryId`. `DELETE` trả lỗi khi còn sản phẩm dùng danh mục.
- Web đọc danh sách danh mục đang hiện theo `sortOrder` để dựng bộ lọc.

## Chưa có

- **Web chưa đọc danh mục từ BO.** Sản phẩm và bộ lọc trên web vẫn lấy từ dữ liệu cứng của web.
- Mỗi sản phẩm chỉ thuộc 1 danh mục.

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md).

**Đã có test:**

- `categories`: danh mục mặc định, dữ liệu cũ tự vào đúng danh mục, thêm, chặn tên trùng, kéo thả bằng chuột và bàn phím, ẩn trên web, đổi tên giữ mã, chặn xóa khi còn sản phẩm, mở Sản phẩm lọc sẵn, form sản phẩm, điện thoại.
- `misc-extra`: chọn màu tag, để trống tên tiếng Anh thì dùng tên tiếng Việt.
