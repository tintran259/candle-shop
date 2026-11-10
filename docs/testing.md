# Kiểm thử BO

Toàn bộ test chạy bằng Playwright, mã ở `bo/e2e/`. Có hai loại:

- **Kịch bản trên trình duyệt** (`*.spec.mjs`, `*.spec.ts`): đi hết luồng như admin dùng, bấm chuột, gõ phím, kéo thả.
- **Quy tắc nghiệp vụ** (`logic/*.spec.ts`): gọi thẳng các hàm tính tiền, trạng thái, phân loại trong `bo/src/lib`, không mở trình duyệt. Chạy cả bộ dưới 2 giây, dùng để phủ hết các trường hợp ngưỡng (đúng bằng mức tối thiểu, hết hạn hôm nay, tỉ lệ bằng nhau…).

## Cách chạy

Trong thư mục `bo`:

| Lệnh | Việc |
|---|---|
| `pnpm test:e2e` | Build (chế độ dữ liệu trên trình duyệt `VITE_DATA_SOURCE=local` — test tự nạp dữ liệu mẫu vào localStorage, không cần BE), mở bản preview cổng 3011, chạy tất cả |
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

## E2E với BE thật

Bộ nhỏ ở `bo/e2e-be/`, chạy BO **chế độ API** với BE thật — bắt lỗi BO và BE lệch nhau (đổi API, định dạng dữ liệu) mà bộ chính (dữ liệu trên trình duyệt) không thấy.

| Lệnh (trong `bo`) | Việc |
|---|---|
| `pnpm test:e2e:be` | Build và chạy BE cổng 4099, build BO gọi BE đó, chạy cổng 3013, chạy cả bộ (~1,5 phút) |

- **Cần `be/.env` có `DATABASE_URL`.** Dữ liệu nằm ở schema riêng **`bo_e2e`** (tự migrate trước khi chạy), không đụng `public` (dữ liệu thật) hay `bo_test` (test BE).
- **Mỗi test nạp lại dữ liệu mẫu** từ `be/test/fixtures/bo-backup-sample.json` (`import-backup` với `DB_SCHEMA=bo_e2e`), đăng nhập bằng token thật của BE (PIN test `739214`, mã băm tạo mới mỗi lần chạy, không dùng PIN thật).
- **Đối chiếu bằng API:** thao tác trên giao diện, rồi đọc thẳng BE (`api.get`) kiểm tra trạng thái, tiền, tồn kho.
- Không có khóa Cloudinary: ảnh lưu data URL. Cổng 4099 / 3013 phải trống. Báo cáo ở `playwright-report-be/`.

| File | Phủ |
|---|---|
| `orders.spec.ts` | Tạo đơn cọc 50% → Bắt đầu làm (BE trừ đúng Kho theo công thức) → Làm xong → Giao (mã vận đơn) → Khách nhận, thu nốt → Hoàn tất; tải lại trang đọc đúng. Hủy đơn đang làm, chưa làm → BE hoàn nguyên liệu |
| `craft.spec.ts` | Sửa giá Sáp ong → bản nháp lưu ở BE (bản web chưa đổi), tải lại không mất → Lưu thay đổi → BE đưa lên bản web, xóa bản nháp |

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
| [Đăng nhập](./pages/login.md) | `login` (giả lập BE) | 5 test | | Tốt |
| [Phần chung](./pages/common.md) | `common`, `drawers`, `chunk-reload`, `layout-width` | 23 mục + 7 test | | Tốt |
| [Dashboard](./pages/dashboard.md) | `dashboard`, `dashboard-ui`, `dashboard-money`, `workshop-cost`, `logic/dashboard`, `logic/money` | 13 mục + 6 test | 16 | Tốt |
| [Đơn hàng](./pages/orders.md) | `orders-*`, `order-changes`, `order-draft`, `shipping`, `workshop-cost`, `price-guards`, `logic/orders`, `logic/order-changes`, `logic/price-guards`, `logic/shipping` | 105 mục + 28 test | 34 | Tốt |
| [Sản phẩm trưng bày](./pages/products.md) | `products`, `price-guards`, `logic/products`, `logic/price-guards` | 12 test | 15 | Tốt |
| [Danh mục](./pages/categories.md) | `categories`, `misc-extra` | 21 mục + 1 test | | Tốt |
| [Sản phẩm hủy đơn](./pages/cancelled-products.md) | `cancelled-*` | 41 mục + 2 test | | Tốt |
| [Thủ công](./pages/craft.md) | `craft-*`, `orders-pending`, `storefront-sync`, `price-guards`, `logic/craft-pricing`, `logic/price-guards` | 103 mục + 15 test | 11 | Tốt |
| [Kho nguyên liệu](./pages/inventory.md) | `inventory`, `inventory-ui`, `production`, `workshop-cost`, `logic/inventory`, `logic/costs-capacity`, `logic/production` | 34 mục + 17 test | 23 | Tốt |
| [Phiếu kho](./pages/stock-movements.md) | `stock-movements` | 4 test | 2 | Tốt |
| [Khách hàng](./pages/customers.md) | `customers`, `customers-list`, `logic/customers` | 9 mục + 7 test | 13 | Tốt |
| [Mã giảm giá](./pages/discounts.md) | `discounts`, `logic/discounts` | 10 test | 24 | Tốt |
| [Cài đặt](./pages/settings.md) | `settings`, `backup`, `misc-extra`, `workshop-cost`, `craft-pricing`, `shipping` | 24 mục + 7 test | | Tốt |

Mỗi trang ghi chi tiết test đang có ở mục **Kiểm thử** cuối tài liệu trang.

**Dữ liệu mẫu trong test:** app bắt đầu không có đơn hàng, sản phẩm trưng bày, sản phẩm hủy đơn. Bộ khung test (`e2e/support/harness.mjs`) nạp đơn, sản phẩm và bản ghi hủy đơn mẫu (`e2e/support/samples.ts`, lấy từ `src/lib/*/sample.ts`) khi các khóa này còn trống, để các kịch bản viết trên dữ liệu mẫu chạy như trước. Test cần trạng thái trống thì đặt `test.use({ samples: false })`, vd `start-empty`.

## Kết quả lần chạy gần nhất

Ngày 05/11/2026, chạy cả bộ trên Edge: **262 đạt, 1 trượt, 1 bỏ qua** (`storefront-sync`, vì web không chạy), mất 29 phút. Test trượt là `workshop-cost` › Sửa giá theo lần mua (ô số trong modal nhận thiếu ký tự); chạy lại riêng 3 lần đều đạt. Gồm cảnh báo bán lỗ: phụ thu nắp, ô nhập / tuỳ chọn thêm, sản phẩm theo giá nhập hiện tại, đơn sau giảm giá, cọc tối thiểu.

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
