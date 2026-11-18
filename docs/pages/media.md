# Kho ảnh

BO › Cài đặt › **Kho ảnh** (`/settings/media`, `bo/src/pages/media.tsx`). Xem mọi ảnh đã tải lên Cloudinary (thư mục `candle2510/`), biết ảnh đang dùng ở đâu, dọn ảnh không còn dùng.

Chỉ có khi BO dùng BE và BE đã cấu hình Cloudinary ([backend.md](../backend.md#kho-ảnh-cloudinary)). Chưa cấu hình thì trang báo "Chưa cấu hình kho ảnh"; chế độ dữ liệu trên trình duyệt thì báo trang chỉ có khi dùng BE.

## Trang

- **Thống kê:** tổng ảnh, dung lượng, số ảnh không dùng (kèm dung lượng có thể dọn).
- **Lọc thư mục:** Tất cả, Sản phẩm (`products`), Thủ công & Kho (`craft` — lựa chọn Thủ công và ảnh nguyên liệu), Đơn hàng (`orders` — khiếu nại, hoàn tiền), Giao diện web (`site`), Khác. Mỗi nút ghi số ảnh.
- **Tìm** theo tên ảnh hoặc nơi dùng (không dấu), công tắc **Chỉ ảnh không dùng**.
- **Thẻ ảnh** (`components/media/media-card.tsx`): ảnh thu nhỏ (bấm xem ảnh gốc, lướt qua các ảnh), tên ảnh, cỡ · dung lượng · ngày tải, nơi đang dùng (chữ xanh, nhiều nơi thì "+n", rê chuột xem hết) hoặc nhãn **Không dùng**.
- **Xóa:** chỉ ảnh không dùng mới có ô chọn. Nút **Chọn N ảnh không dùng** (theo bộ lọc đang xem) → **Xóa N ảnh** → xác nhận. Xóa trên Cloudinary, không khôi phục được.
- Điện thoại: lưới 2 cột, thống kê 3 ô nhỏ, nút lọc thư mục cuộn ngang.

## Ảnh đang dùng ở đâu

BE so `public_id` ảnh với mọi URL ảnh đang lưu trong DB (`be/src/media/usage.ts`): sản phẩm, nguyên liệu (Kho), lựa chọn Thủ công (bản đã lưu và bản nháp), ảnh món trong đơn, chứng từ thanh toán, khiếu nại, hoàn tiền, sản phẩm hủy đơn, giao diện web (đã đăng và nháp), đơn nháp. Lúc xóa BE kiểm tra lại — ảnh vừa được dùng ở đâu đó thì từ chối cả lượt (409, ghi nơi dùng), không xóa ảnh nào.

Ảnh lưu tạm trong DB dạng data URL (khi chưa có Cloudinary) không nằm trên Cloudinary nên không hiện ở đây.

## Tên ảnh

Ảnh tải lên từ 18/11/2026 có tên có nghĩa, tự đặt theo nơi dùng (không cần nhập): tên bỏ dấu + ngày giờ VN, vd `nen-vanilla-20261118-151230`, `sap-dau-nanh-…`, `khieu-nai-dh0123-…`, `giao-dien-tet-hero-…`. Ảnh cũ hơn mang tên ngẫu nhiên. Xem [api.md](../api.md#post-adminuploadssign).

## API

`GET /api/admin/media`, `POST /api/admin/media/delete` — [api.md](../api.md#kho-ảnh). BE gọi Search API (lọc `folder:candle2510/*`, chạy được cả tài khoản thư mục cố định lẫn thư mục động) và Admin API xóa ảnh của Cloudinary (`be/src/media/cloudinary.ts`). Gói Free giới hạn khoảng 500 lần gọi Admin API mỗi giờ — mở trang / Tải lại tốn 1 lần (mỗi 500 ảnh).

## Kiểm thử

- BE `test/media.e2e-spec.ts`: Cloudinary giả lập bằng cách thay `fetch` — 503 khi chưa cấu hình, danh sách kèm nơi dùng, chặn xóa ảnh đang dùng, xóa ảnh thừa.
- BE `test/uploads.e2e-spec.ts`: tên ảnh bỏ dấu + ngày giờ, trùng thì `-2`, chữ ký gồm `public_id`.
