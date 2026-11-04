# Cài đặt

**Đường dẫn:** `/settings`

**Mục đích:** để admin tự đổi các con số về tiền cọc, giao hàng và phí vận chuyển.

## Các mục cài đặt

| Mục | Khoảng cho phép | Mặc định | Dùng ở đâu | Tình trạng |
|---|---|---|---|---|
| Mức cọc | 1–99% | 50% | Tạo đơn, chi tiết đơn | Đang dùng |
| Số cây làm được mỗi ngày | 0–1.000 cây, 0 = không giới hạn | 20 | Gợi ý ngày làm xong, cảnh báo ngày quá tải, lịch xưởng trên Dashboard | Đang dùng |
| Số ngày làm tối thiểu | 0–30 ngày | 3 | Ngày làm xong gợi ý sớm nhất = hôm nay + số này | Đang dùng |
| Số lần giao tối đa | 1–10 lần | 3 | Giao hàng lỗi: hết số lần thì đơn tự hoàn về | Đang dùng |
| Phí gửi lại đơn | Từ 0 ₫ | 30.000 ₫, số tạm | Gửi lại đơn: phí mặc định, sửa được | Đang dùng |
| Phương thức giao | Tên, phí, số ngày, bật/tắt | Tiêu chuẩn miễn phí 3 ngày; Nhanh 50.000 ₫ 1 ngày | Tạo đơn, chi tiết đơn | Đang dùng |

Tự đặt tên được, nên có thể tạo "Nội thành", "Ngoại tỉnh" để tính phí theo khu vực.

## Bố cục

- **Đầu trang:** dòng "Có thay đổi chưa lưu", nút Mặc định, nút Lưu cài đặt.
- **Bên trái:** 4 khối Đặt cọc, Xưởng, Giao hàng, Phí vận chuyển.
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

## Việc của BE

`ShopSettings` là một bản ghi duy nhất, gồm `depositPercent`, `maxDeliveryAttempts`, `resendFee`, `shippingOptions[]`, `dailyCapacity`, `leadDays`. Mỗi phương thức gồm `id`, `name`, `fee`, `days`, `enabled`.

API đề xuất: `GET /api/settings` cho web, `GET` và `PUT /api/admin/settings` cho BO. Khi tạo đơn, lưu vào đơn `depositPercent`, `shippingName`, `shippingDays`, `shippingFee`.

## Chưa có

Web chưa đọc Cài đặt.

## Kiểm thử

Cách chạy và độ phủ chung ở [testing.md](../testing.md).

**Đã có test:**

- `workshop-cost`: lưu số cây mỗi ngày và số ngày làm tối thiểu; `logic/costs-capacity`: tính tải xưởng, ngày gợi ý, lịch 7 ngày.
- `settings`: giá trị mặc định, xem trước, hỏi khi rời trang chưa lưu, chặn tên trùng và tắt hết phương thức, lưu, tải lại, áp dụng vào tạo đơn, đơn cũ không lỗi, nút Mặc định.
- `misc-extra`: mức cọc ngoài 1–99% không lưu được.
- Số lần giao tối đa và Phí gửi lại đơn được dùng trong `orders-decisions`.
