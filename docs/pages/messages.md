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
- Trình duyệt **gửi thẳng tới BE** `POST /api/shop/messages` để BE giới hạn theo IP từng khách → `FRONTEND_URL` của BE phải đúng địa chỉ web (CORS). Đang gửi: "Đang gửi…", khóa nút (BE Render có thể đang khởi động, chờ tối đa 60 giây). Thành công: **form được thay bằng lời cảm ơn** — "Đã gửi lời nhắn", "Cảm ơn <tên>!", "…sẽ nhắn Zalo hoặc gọi lại qua số <SĐT> trong ngày." (hiện dần, focus vào đây để trình đọc màn hình đọc ngay) và nút **Gửi lời nhắn khác** mở lại form trống; khách không lỡ bấm gửi lần nữa. Lỗi: câu của BE (400 / 429) hoặc "Chưa gửi được, bạn thử lại sau ít phút nhé."
- Chế độ dữ liệu giả (`SHOP_MOCK=1`) không gửi, chỉ hiện lời cảm ơn.

## Quy tắc (BE)

| Trường | Quy tắc |
|---|---|
| Họ tên | Bắt buộc, ≤ 60 ký tự (bỏ khoảng trắng đầu cuối) |
| SĐT | Bắt buộc, 8–20 ký tự số / dấu cách / `+ . ( ) -` ("Số điện thoại không đúng.") |
| Email | Không bắt buộc; có thì đúng định dạng, viết thường |
| Nội dung | Bắt buộc, ≤ 1000 ký tự |

## Chống spam

Người gửi thật không thấy gì khác. Các bước theo thứ tự:

| Trường hợp | Kết quả |
|---|---|
| Ô bẫy `website` có giá trị (bot điền ô ẩn) | Trả `{ ok: true }` như thường, **không lưu** |
| Gửi quá nhanh: `elapsed` (mili giây từ lúc form hiện ra, web tự gửi kèm) dưới 3 giây, hoặc không có (gọi thẳng API) | Trả ok, không lưu |
| Mỗi IP quá 5 lời nhắn / 10 phút | 429 "Bạn gửi quá nhiều lần, thử lại sau ít phút." (đếm trong bộ nhớ, BE khởi động lại thì đếm lại; lượt của bot không tính) |
| Cùng SĐT + cùng nội dung trong 24 giờ | Trả ok (web vẫn hiện lời cảm ơn), chỉ lưu lần đầu |
| Mỗi SĐT quá 3 lời nhắn / 24 giờ (khác IP vẫn tính) | 429 "Số điện thoại này đã gửi nhiều lời nhắn hôm nay — chúng tôi sẽ liên lạc lại với bạn sớm." |

So SĐT sau khi chuẩn hóa (chỉ giữ số, `84…` → `0…`: "0901 234 567" = "+84901234567"); so nội dung không phân biệt hoa thường, khoảng trắng thừa. Chưa có CAPTCHA (thêm Cloudflare Turnstile nếu spam thật sự xuất hiện).

Bảng `ContactMessage` (`id`, `name`, `phone`, `email` — trống nếu không có, `message`, `handled`, `createdAt`). Migration `20261113150000_contact_messages` bỏ bảng `Subscriber` (đăng ký email, chưa dùng thật) và tạo bảng này.

## API

`POST /shop/messages` (công khai), `GET /admin/messages`, `PATCH /admin/messages/:id` `{ handled }`, `DELETE /admin/messages/:id` — [api.md#liên-hệ](../api.md#liên-hệ).

## Kiểm thử

- BE: `be/test/messages.e2e-spec.ts` (bỏ khoảng trắng, email viết thường / không bắt buộc, dữ liệu sai 400, xem / đánh dấu / xóa, 401, 404, Xóa toàn bộ dữ liệu; chống spam: bẫy bot, gửi dưới 3 giây / thiếu `elapsed`, trùng nội dung 24 giờ kể cả SĐT viết khác, 3 lời nhắn / SĐT / 24 giờ khác IP vẫn tính, 5 lần / IP). App test bật `trust proxy` như `main.ts` để giả IP bằng `X-Forwarded-For`.
- BO: `bo/e2e/messages.spec.ts` (huy hiệu menu, lọc, link Zalo, đánh dấu / chuyển về, xóa).
- BO + BE thật: `bo/e2e-be/messages.spec.ts` (gửi qua API công khai → đánh dấu đã xử lý, chuyển về, xóa trên BO, BE lưu đúng, không báo lỗi — bắt lỗi "$ is not a function" khi kho BO áp danh sách BE trả về).

## Chưa có

- Báo cho chủ shop khi có lời nhắn mới (email / Zalo OA) — hiện xem ở BO, huy hiệu menu.
