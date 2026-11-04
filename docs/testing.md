# Kiểm thử BO

Toàn bộ test chạy bằng Playwright, mã ở `bo/e2e/`. Có hai loại:

- **Kịch bản trên trình duyệt** (`*.spec.mjs`, `*.spec.ts`): đi hết luồng như admin dùng, bấm chuột, gõ phím, kéo thả.
- **Quy tắc nghiệp vụ** (`logic/*.spec.ts`): gọi thẳng các hàm tính tiền, trạng thái, phân loại trong `bo/src/lib`, không mở trình duyệt. Chạy cả bộ dưới 2 giây, dùng để phủ hết các trường hợp ngưỡng (đúng bằng mức tối thiểu, hết hạn hôm nay, tỉ lệ bằng nhau…).

## Cách chạy

Trong thư mục `bo`:

| Lệnh | Việc |
|---|---|
| `pnpm test:e2e` | Build, mở bản preview cổng 3011, chạy tất cả |
| `pnpm test:e2e e2e/logic` | Chỉ chạy quy tắc nghiệp vụ |
| `pnpm test:e2e e2e/discounts` | Chạy một file |
| `pnpm test:e2e:ui` | Mở giao diện Playwright, xem từng bước |
| `pnpm test:e2e:report` | Xem báo cáo lần chạy gần nhất, có ảnh chụp và trace khi trượt |

- **Trình duyệt:** Edge có sẵn trên máy (`PW_CHANNEL=chrome` để đổi).
- **Bản build:** nếu đã có bản preview đang chạy ở cổng 3011, test dùng luôn bản đó. Sửa code BO xong thì chạy `pnpm exec vite build` trước, không thì test chạy trên bản cũ.
- **Dữ liệu:** mỗi test mở trình duyệt riêng, dữ liệu trống rồi dựng từ dữ liệu mẫu. Phiên đăng nhập tạo sẵn, trừ test trang Đăng nhập.
- **Web:** test không ghi đè cấu hình Thủ công đang dùng trên web. `storefront-sync` chỉ chạy khi web chạy ở cổng 3000, không thì bỏ qua.
- **Chạy lần lượt:** nhiều kịch bản cũ có bước chờ cố định, chạy song song làm máy chậm và trượt giả. Cả bộ mất khoảng 25 phút.
- **Lỗi console** cũng làm test trượt. Một thao tác không thấy phần tử sau 10 giây thì báo lỗi luôn.

## Cấu trúc

| Thư mục, file | Nội dung |
|---|---|
| `e2e/*.spec.ts` | Kịch bản viết theo kiểu Playwright: `getByRole`, `expect` tự chờ, không chờ cố định. Test mới viết theo kiểu này |
| `e2e/*.spec.mjs` | Kịch bản viết trước, mỗi mục kiểm tra có mã và tên, ví dụ `A1 Doanh thu theo tiền thực nhận`. Sai một mục vẫn chạy tiếp |
| `e2e/logic/` | Quy tắc nghiệp vụ |
| `e2e/flows/` | Luồng dùng chung: dựng kho từ trống (E2E 1) cho cả `inventory` và `craft-builder` |
| `e2e/support/harness.mjs` | Bộ hàm dùng chung: đăng nhập sẵn, chặn gửi cấu hình sang web, `t.click`, `t.moveStep`… |
| `e2e/fixtures/` | Bản lưu cấu hình và kho kiểu cũ, để kiểm tra dữ liệu cũ vẫn đọc được |

## Độ phủ theo trang

"Test" là số `test(...)`; một test kiểm tra nhiều điều. Kịch bản `.mjs` ghi theo số mục kiểm tra.

| Trang | File | Trình duyệt | Quy tắc | Mức phủ |
|---|---|---|---|---|
| [Đăng nhập](./pages/login.md) | `login`, `login-extra` | 19 mục + 2 test | | Tốt |
| [Phần chung](./pages/common.md) | `common`, `drawers`, `chunk-reload`, `layout-width` | 23 mục + 7 test | | Tốt |
| [Dashboard](./pages/dashboard.md) | `dashboard`, `dashboard-ui`, `workshop-cost`, `logic/dashboard` | 13 mục + 5 test | 8 | Tốt |
| [Đơn hàng](./pages/orders.md) | `orders-*`, `order-changes`, `workshop-cost`, `logic/orders`, `logic/order-changes` | 104 mục + 16 test | 25 | Tốt |
| [Sản phẩm trưng bày](./pages/products.md) | `products`, `logic/products` | 10 test | 13 | Tốt |
| [Danh mục](./pages/categories.md) | `categories`, `misc-extra` | 21 mục + 1 test | | Tốt |
| [Sản phẩm hủy đơn](./pages/cancelled-products.md) | `cancelled-*` | 41 mục + 2 test | | Tốt |
| [Thủ công](./pages/craft.md) | `craft-*`, `orders-pending`, `storefront-sync` | 103 mục + 9 test | | Tốt |
| [Kho nguyên liệu](./pages/inventory.md) | `inventory`, `inventory-ui`, `production`, `workshop-cost`, `logic/inventory`, `logic/costs-capacity`, `logic/production` | 34 mục + 17 test | 23 | Tốt |
| [Khách hàng](./pages/customers.md) | `customers`, `customers-list`, `logic/customers` | 9 mục + 7 test | 13 | Tốt |
| [Mã giảm giá](./pages/discounts.md) | `discounts`, `logic/discounts` | 8 test | 21 | Tốt |
| [Cài đặt](./pages/settings.md) | `settings`, `misc-extra`, `workshop-cost` | 24 mục + 2 test | | Tốt |

Mỗi trang ghi chi tiết test đang có ở mục **Kiểm thử** cuối tài liệu trang.

## Kết quả lần chạy gần nhất

Ngày 04/11/2026, chạy cả bộ trên Edge: **220 đạt, 0 trượt, 1 bỏ qua** (`storefront-sync`, vì web không chạy), mất 26 phút.

Trong lúc viết test đã phát hiện và sửa:

- Biểu đồ trên Dashboard còn tên cũ "Theo loại hương", nay là "Theo danh mục" cho khớp trang Danh mục.
- Tên các cách sắp xếp đơn hàng trong tài liệu chưa khớp giao diện.

Khi làm sửa đơn, khiếu nại, giá vốn, công suất xưởng, test phát hiện và đã sửa:

- Hoàn phần thu dư sau khi sửa đơn từng bị trừ vào giá trị hàng, làm lãi gộp âm. Nay chỉ tiền hoàn do khiếu nại mới trừ.
- Đổi ngày làm xong sang ngày quá tải bằng bàn phím (gõ ngày rồi Enter): hộp hỏi lại tự đóng và không đổi ngày. Nay đổi luôn và báo cảnh báo, đúng nguyên tắc chỉ cảnh báo không chặn.

## Còn chưa phủ

Không còn chức năng nào của BO chưa có test. Các phần sau cố ý chưa test:

- **Nút Dữ liệu mẫu** ở các trang: sẽ bỏ khi có BE.
- **Trang Đánh giá:** chưa làm.
- **`storefront-sync`:** chỉ chạy khi web chạy ở cổng 3000.
