# Tài liệu 2510 Back Office

Bộ tài liệu để chủ shop duyệt chức năng. Ghi theo những gì BO đang chạy, phần chưa làm được đánh dấu rõ.

Hướng dẫn cho Claude Code (cấu trúc dự án, cách chạy trên máy mới, quy ước, trạng thái và việc còn lại): [CLAUDE.md](../CLAUDE.md).

Bắt đầu từ [Workflow đơn hàng](./workflow.md).

## Tài liệu theo trang

| Trang | Đường dẫn | Tài liệu | Tình trạng |
|---|---|---|---|
| Đăng nhập | `/login` | [login.md](./pages/login.md) | Đã có, PIN 6 số qua BE |
| Phần chung (menu, tìm kiếm, thông báo) | | [common.md](./pages/common.md) | Đã có |
| Dashboard | `/` | [dashboard.md](./pages/dashboard.md) | Đã có, số thật từ đơn trong BO |
| Đơn hàng | `/orders` | [orders.md](./pages/orders.md) | Đã có, gồm hoàn tiền và giao hàng lỗi |
| Sản phẩm trưng bày | `/products` | [products.md](./pages/products.md) | Đã có |
| Danh mục | `/categories` | [categories.md](./pages/categories.md) | Đã có, web chưa đọc |
| Sản phẩm hủy đơn | `/cancelled-products` | [cancelled-products.md](./pages/cancelled-products.md) | Đã có |
| Thủ công | `/craft` | [craft.md](./pages/craft.md) | Đã có |
| Kho nguyên liệu | `/inventory` | [inventory.md](./pages/inventory.md) | Đã có |
| Phiếu kho | `/inventory/movements` | [stock-movements.md](./pages/stock-movements.md) | Đã có |
| Khách hàng | `/customers` | [customers.md](./pages/customers.md) | Đã có |
| Đánh giá | `/reviews` | Chưa có | Trang tạm, chưa làm |
| Mã giảm giá | `/discounts` | [discounts.md](./pages/discounts.md) | Đã có |
| Cài đặt | `/settings` | [settings.md](./pages/settings.md) | Đã có |

## Kiểm thử

Test E2E bằng Playwright ở `bo/e2e/`, chạy `pnpm test:e2e` trong `bo`. Độ phủ từng trang, test đang trượt và test case còn thiếu ở [testing.md](./testing.md).

## Đặc tả kỹ thuật cho BE

| Tài liệu | Nội dung |
|---|---|
| [craft-builder.md](./craft-builder.md) | Cấu hình Thủ công, cách tính giá, API |
| [inventory.md](./inventory.md) | Nguyên liệu, phiếu kho, tiêu hao, trừ kho, API |
| [backend.md](./backend.md) | Cài đặt BE (Neon), bảng, nhập dữ liệu từ BO, đăng nhập PIN |
| [api.md](./api.md) | Mọi endpoint của BE: đầu vào, đầu ra, mã lỗi, ví dụ |

Yêu cầu dữ liệu đơn hàng cho BE nằm ở [orders.md](./pages/orders.md#việc-của-be).

## Giới hạn hiện tại

- **Dữ liệu trên máy chủ:** BO đọc / ghi qua BE (Postgres trên Neon), máy nào đăng nhập cũng thấy cùng dữ liệu ([backend.md](./backend.md#bo-dùng-api)). Chưa đưa lên mạng (giai đoạn 5). Sao lưu bằng file ở [Cài đặt › Sao lưu dữ liệu](./pages/settings.md#sao-lưu-dữ-liệu), khôi phục bằng `pnpm db:import` ở BE.
- **Web (`fe`) đã xóa, sẽ tạo lại sau.** Trước đây web nối tạm với BO: trang Thủ công chạy theo cấu hình BO. BO chạy trên máy tự đẩy cấu hình đã lưu và tồn dùng được sang web qua `fe/src/app/api/craft-config`, chỉ dùng khi dev. Web chưa đọc Cài đặt, đơn trên web chưa vào BO.
- **Ô lượng cho 1 hũ:** chỉ có ở popup Tự phối nến của BO, web không có.
- **Đăng nhập:** một người dùng, không phân quyền. BE đã có đăng nhập bằng **PIN 6 số** (khóa tăng dần khi nhập sai, xem [backend.md](./backend.md#đăng-nhập)). Màn đăng nhập BO chỉ có ô PIN 6 số, BE kiểm tra và trả token ([pages/login.md](./pages/login.md)).
