# Giao diện web

**Đường dẫn:** `/settings/site-theme` (danh sách) và `/settings/site-theme/<mã>` (chi tiết). Menu Hệ thống › Cài đặt › **Giao diện web** (mục con thụt dưới Cài đặt).

**Mục đích:** chủ shop tự đổi **thanh thông báo**, **logo** và **hero** (ảnh lớn đầu trang chủ) của web `fe` mà không cần sửa code. Chuẩn bị sẵn nhiều giao diện cùng lúc, mỗi cái cho một dịp (Noel, Tết…) và gắn với [concept](./concepts.md). Web tự dùng giao diện khi concept của nó đang trong mùa, hết mùa thì quay về Mặc định.

## Danh sách

- Thông báo xanh: web **đang sử dụng** giao diện nào (tính từ các bản đã đăng + mùa của concept hôm nay, giờ VN).
- **Thêm giao diện:** nhập tên (vd "Giáng sinh 2026") → mở trang chi tiết để chọn concept và sửa nội dung.

| Cột | Nội dung |
|---|---|
| Giao diện | Tên (bấm mở chi tiết). Điện thoại: concept hiện ngay dưới tên |
| Dùng cho concept | Mặc định: "Khi không có dịp nào". Giao diện khác: tag tên concept (kèm "· đang ẩn" / "· đã kết thúc" nếu có), hoặc "Chưa gắn concept" |
| Trạng thái | **Đang sử dụng** (web đang dùng) · **Đang chờ** (đã đăng, chưa tới thời gian áp dụng, hoặc đang nhường giao diện của concept xếp trên; Mặc định khi có giao diện dịp lễ đang dùng) · **Hết mùa** · **Chưa gắn concept** · **Nháp chưa đăng** · **Chưa có nội dung**; thêm "· có nháp" khi bản đã đăng có nháp. Mặc định chưa đăng vẫn "Đang sử dụng" (web dùng nội dung có sẵn) |
| Thời gian áp dụng | Mặc định: "Ngoài các dịp". Giao diện khác: mỗi dòng một khoảng theo concept còn hiệu lực (vd "13/11 – 29/11/2026"; nhiều concept thì kèm tên: "01/12 – 26/12/2026 (Noel)"), "mọi ngày" khi concept không đặt ngày, "Hết mùa", "—" khi chưa gắn (từ màn hình nhỏ trở lên) |
| Xóa | Hỏi lại; Mặc định không xóa được. Điện thoại: xóa ở trang chi tiết |

## Chi tiết

- Đầu trang: ← Giao diện web, **tên** (bấm bút chì để đổi — đổi ngay, không cần Lưu; Mặc định không đổi tên), trạng thái (như danh sách), "Cập nhật lúc …" (lần đăng gần nhất), các nút **Gỡ khỏi web**, **Bỏ nháp**, **Xóa**, **Hủy thay đổi**, **Lưu nháp**, **Lưu và đăng lên web**.
- **Dùng cho concept** (trừ Mặc định): chọn một hoặc nhiều concept. Concept **đã thuộc giao diện khác** (bản nháp hoặc đã đăng) bị khóa, ghi "· thuộc "<tên>"". Chưa chọn concept thì web không dùng giao diện này. Concept là một phần nội dung — đổi xong phải Lưu / Đăng. Ngay dưới là **thời gian áp dụng**: "Giao diện sẽ tự lên web vào 13/11 – 29/11/2026." (concept không đặt ngày: "… mọi ngày."); nhiều concept thì liệt kê từng khoảng theo ngày bắt đầu, kèm tên: "Giao diện sẽ tự lên web vào: 01/12 – 26/12/2026 (Noel); 20/01 – 10/02/2027 (Tết)." Concept đã hết mùa / đang ẩn bỏ khỏi danh sách; không còn concept nào thì báo vàng "… giao diện sẽ không lên web".
- Mặc định chưa đăng: giao diện khác hiện cảnh báo "ô để trống ở đây sẽ lấy nội dung có sẵn của web" + nút Mở Mặc định.
- Trái: form 3 khối. Ô ảnh / logo trống: ở **Mặc định** hiện ảnh hero và logo gốc của web (nhãn "Ảnh có sẵn của web"); ở giao diện khác để trống, ghi "Dùng ảnh của Mặc định".
- Phải: **Xem trước trang chủ** — trang chủ web thu nhỏ dựng ở bề ngang thật (máy tính 1280px / điện thoại 390px), ghép với Mặc định (bản đã đăng), đổi ngay khi gõ:
  - **Cuộn trong khung** như đang lướt web: thanh thông báo + điều hướng dính trên cùng, cuộn qua hero thì đổi nền kem và logo tối; dưới hero là cam kết, "Xưởng nến" (3 thẻ minh họa), chân trang.
  - Chưa chọn ảnh thì dùng ảnh hero / logo có sẵn của web (`bo/public/site-preview/`, chép từ `fe/public`) — không để khung đen.
  - **Thu nhỏ / Phóng to** (100–300%, cuộn ngang khi phóng to) và nút **Mở lớn** (cửa sổ gần toàn màn hình, chọn Máy tính / Điện thoại).
  - Gần đúng (chữ có chân dùng font máy, không phải Cormorant) — xem bản thật trên web sau khi đăng.

| Khối | Trường | Quy tắc |
|---|---|---|
| Thanh thông báo | Hiện thanh thông báo (chỉ ở Mặc định) | Tắt thì web ẩn dải thông báo ở mọi trang |
| | Nội dung | Tối đa 90 ký tự |
| Logo | Logo sáng (trên hero tối), Logo tối (trên nền kem, chân trang) | PNG / SVG nền trong suốt, ngang từ 400px (nhỏ hơn thì cảnh báo, vẫn nhận). SVG giữ nguyên, ảnh khác nén WebP cạnh dài ≤ 1200px |
| Hero | Ảnh | Ngang từ 1600px (khoảng 3:2), chủ thể lệch phải. Nén WebP cạnh dài ≤ 2400px |
| | Điểm lấy nét | Trái / Giữa / Phải — phần ảnh giữ lại khi màn hình hẹp (web đặt `object-position` 30% / 50% / 70%) |
| | Nhãn nhỏ, Đoạn giới thiệu, Chữ trên nút | Tối đa 60 / 220 / 30 ký tự |
| | Tiêu đề | Tối đa 2 dòng (xuống dòng để ngắt), mỗi dòng 30 ký tự |
| | Câu lớn dưới ảnh | Tối đa 32 ký tự, một dòng — càng ngắn chữ càng to |

**Để trống = giá trị dự phòng:** ở Mặc định là nội dung có sẵn của web (`fe/src/content/home.ts`, ô trống hiện sẵn chữ đó làm gợi ý); ở giao diện khác là giá trị **đã đăng** của Mặc định. Giao diện dịp lễ chỉ cần điền phần muốn khác (vd chỉ đổi ảnh hero + câu lớn). Nút hero vẫn dẫn tới khối "Xưởng nến".

## Bản nháp và đăng (riêng từng giao diện)

| Thao tác | Kết quả |
|---|---|
| Lưu nháp | Lưu bản nháp của giao diện này, web **chưa** đổi. Giao diện khác không bị ảnh hưởng |
| Lưu và đăng lên web | Bản đang sửa (hoặc bản nháp) thành bản đã đăng, xóa nháp. BE báo web làm mới (tag `site-theme`) nên web đổi ngay ở lượt xem kế tiếp (không gọi được web thì sau tối đa 1 phút). Gỡ khỏi web / xóa giao diện đã đăng cũng báo Giao diện gắn concept **chỉ lên web trong thời gian áp dụng**: chưa tới thời gian / không lên web thì hỏi lại trước khi đăng (nội dung = câu thời gian áp dụng + "Trước đó web vẫn dùng Mặc định.", bấm "Vẫn đăng"); đăng xong trạng thái "Đang chờ" |
| Bỏ nháp | Hỏi lại, xóa bản nháp — quay về bản đã đăng (chưa đăng thì nội dung trống) |
| Gỡ khỏi web | (Trừ Mặc định) bỏ bản đã đăng, nội dung giữ lại làm bản nháp. Web quay về Mặc định trong mùa của concept |
| Hủy thay đổi | Bỏ chỉnh sửa chưa lưu trên trang |

Ảnh chọn xong chỉ nén + xem trước trên máy; khi bấm Lưu nháp / Lưu và đăng mới tải lên Cloudinary (thư mục `site`) — như ảnh sản phẩm ([backend.md](../backend.md#kho-ảnh-cloudinary)). Concept đã bị xóa thì tự bỏ khỏi giao diện khi lưu.

## Web chọn giao diện thế nào

1. Duyệt concept theo thứ tự ở trang Concept; lấy **concept đầu tiên** không ẩn, **đang trong mùa** (quy tắc [concepts.md#thời-gian](./concepts.md#thời-gian)) và có giao diện **đã đăng** gắn với nó. Bản nháp không bao giờ lên web.
2. Ghép từng trường: giao diện đó có thì dùng, trống thì lấy Mặc định (đã đăng), Mặc định trống thì web dùng nội dung có sẵn.
3. Không concept nào khớp → Mặc định.

Tính lúc web đọc (`GET /shop/home`, ngày giờ VN), không có tác vụ hẹn giờ: tới 00:00 ngày bắt đầu là BE trả giao diện mới, không cần đăng lại. Web lưu đệm 60 giây nên trang đổi trong khoảng 1 phút sau nửa đêm (lượt xem đầu tiên sau đó có thể còn bản cũ, lượt sau là bản mới).

Muốn giao diện Tết thắng Noel khi hai mùa chồng nhau: kéo Tết lên trên ở trang Concept.

Web: thanh thông báo + logo ở **mọi trang**; hero + khối "Xưởng nến" ở trang chủ. Khối "Xưởng nến" hiện **3 mẫu đang bán** (nổi bật trước) từ BE, bấm mở trang chi tiết; BE có ít hơn 3 mẫu thì giữ 3 thẻ mẫu có sẵn. BE lỗi / chưa cấu hình → web hiện nội dung có sẵn.

## Dữ liệu cũ

Migration `20261112180000_site_theme_list` chuyển bản cũ (một JSON chung `{ base, concepts[] }`): `base` → giao diện Mặc định, mỗi phần ghi đè của concept → giao diện `concept-<mã>` tên theo concept, giữ cả bản đã đăng và bản nháp.

## API

`GET/POST /admin/site-themes`, `PATCH/DELETE /admin/site-themes/:id`, `PUT/DELETE /admin/site-themes/:id/draft`, `POST /admin/site-themes/:id/publish`, `POST /admin/site-themes/:id/unpublish`; web đọc `GET /shop/home` — [api.md#giao-diện-web](../api.md#giao-diện-web).

## Kiểm thử

- BE: `be/src/site-theme/theme.spec.ts` (chọn giao diện theo mùa, ghép trường, một giao diện nhiều concept, bỏ qua bản chưa đăng; **lịch theo ngày**: trước / đúng ngày bắt đầu / ngày kết thúc / sau ngày kết thúc, khoảng trống giữa hai mùa của một giao diện, hai giao diện chồng mùa), `be/test/site-theme.e2e-spec.ts` (thêm / đổi tên / xóa, nháp / đăng / gỡ riêng từng giao diện, concept chỉ thuộc một giao diện, chặn dữ liệu sai, `/shop/home`; **giả đồng hồ**: đăng một lần, 23:59:59 giờ VN hôm trước vẫn Mặc định, 00:00 ngày bắt đầu tự đổi, 00:00 sau ngày kết thúc tự về Mặc định).
- BO: `bo/e2e/site-theme.spec.ts` (danh sách + Mặc định: sửa, xem trước, tiêu đề quá 2 dòng, ảnh nhỏ cảnh báo, đăng; thêm giao diện Noel: gắn concept, nháp chưa lên web, đăng → web đang dùng, concept bị khóa ở giao diện khác, gỡ khỏi web, xóa; nhiều concept chưa tới mùa: câu thời gian áp dụng từng khoảng, hỏi lại khi đăng, danh sách "Đang chờ" + cột thời gian, Mặc định "Đang sử dụng"; đường dẫn không tồn tại).

## Chưa có

- Xóa ảnh cũ trên Cloudinary khi đổi / bỏ / xóa giao diện.
- Xem trước bản nháp trên web thật (hiện chỉ xem trước hero trong BO).
- Nhân bản giao diện (copy từ giao diện có sẵn).
- Trang 404 dựng tĩnh lúc build: thanh thông báo / logo ở đó chỉ đổi sau lần deploy web kế tiếp.
