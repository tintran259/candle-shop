# Liên hệ (lời nhắn từ web)

**Đường dẫn:** `/messages`. Menu Bán hàng › **Liên hệ** (dưới Khách hàng), huy hiệu = số lời nhắn **chưa xử lý**.

**Mục đích:** khách để lại lời nhắn ở khối **"Gửi lời nhắn"** cuối trang chủ web (cần tư vấn chọn nến, đặt quà…). Chủ shop nhắn Zalo / gọi lại theo số khách để lại, xong thì đánh dấu đã xử lý. Thay cho ô đăng ký email trước đây (không dùng được vì chưa gửi email).

## Trang BO

- Lọc: **Chưa xử lý** (mặc định) · **Đã xử lý** · **Tất cả**, kèm số lượng. Mới nhất ở trên, 20 dòng mỗi trang.
- Cột **Khách**: họ tên, SĐT (sao chép được), email nếu có, giờ gửi. Cột **Nội dung**: tối đa 4 dòng, "Xem thêm" để mở hết; nhãn "Đã xử lý".
- Nút: **Nhắn Zalo** (mở `zalo.me/<số>` theo SĐT khách, tab mới), **Đánh dấu đã xử lý** / **Chuyển về chưa xử lý**, **Xóa** (hỏi lại).
- **Xóa toàn bộ dữ liệu** (Cài đặt) cũng xóa lời nhắn.

## Trên web

- Khối `fe/src/components/sections/contact.tsx` (`id="contact"`, bố cục khối "Nhận tin" cũ: ảnh trái, tiêu đề "Gửi lời nhắn" phải). Chân trang **Hỗ trợ › Liên hệ** dẫn tới `/#contact`.
- Form (`contact-form.tsx`): **Họ và tên**, **Số điện thoại (Zalo)**, **Email (không bắt buộc)**, **Nội dung** (tối đa 1000 ký tự, hiện bộ đếm khi gần đầy). Kiểm tra ngay trên trình duyệt như BE, lỗi dưới từng ô, focus ô lỗi đầu tiên.
- Trình duyệt **gửi thẳng tới BE** `POST /api/shop/messages` để BE giới hạn theo IP từng khách → `FRONTEND_URL` của BE phải đúng địa chỉ web (CORS). Đang gửi: "Đang gửi…", khóa nút (BE Render có thể đang khởi động, chờ tối đa 60 giây). Thành công: "Cảm ơn bạn! Chúng tôi đã nhận được lời nhắn và sẽ liên lạc lại sớm.", xóa trắng form. Lỗi: câu của BE (400 / 429) hoặc "Chưa gửi được, bạn thử lại sau ít phút nhé."
- Chế độ dữ liệu giả (`SHOP_MOCK=1`) không gửi, chỉ báo thành công.

## Quy tắc (BE)

| Trường | Quy tắc |
|---|---|
| Họ tên | Bắt buộc, ≤ 60 ký tự (bỏ khoảng trắng đầu cuối) |
| SĐT | Bắt buộc, 8–20 ký tự số / dấu cách / `+ . ( ) -` ("Số điện thoại không đúng.") |
| Email | Không bắt buộc; có thì đúng định dạng, viết thường |
| Nội dung | Bắt buộc, ≤ 1000 ký tự |
| Ô bẫy `website` có giá trị | Trả như thường nhưng không lưu |
| Mỗi IP quá 5 lời nhắn / 10 phút | 429 "Bạn gửi quá nhiều lần, thử lại sau ít phút." (đếm trong bộ nhớ) |

Bảng `ContactMessage` (`id`, `name`, `phone`, `email` — trống nếu không có, `message`, `handled`, `createdAt`). Migration `20261113150000_contact_messages` bỏ bảng `Subscriber` (đăng ký email, chưa dùng thật) và tạo bảng này.

## API

`POST /shop/messages` (công khai), `GET /admin/messages`, `PATCH /admin/messages/:id` `{ handled }`, `DELETE /admin/messages/:id` — [api.md#liên-hệ](../api.md#liên-hệ).

## Kiểm thử

- BE: `be/test/messages.e2e-spec.ts` (bỏ khoảng trắng, email viết thường / không bắt buộc, bẫy bot, dữ liệu sai 400, xem / đánh dấu / xóa, 401, 404, Xóa toàn bộ dữ liệu, 5 lần / IP).
- BO: `bo/e2e/messages.spec.ts` (huy hiệu menu, lọc, link Zalo, đánh dấu / chuyển về, xóa).

## Chưa có

- Báo cho chủ shop khi có lời nhắn mới (email / Zalo OA) — hiện xem ở BO, huy hiệu menu.
