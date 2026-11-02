# Tài liệu 2510 Back Office

Bộ tài liệu để chủ shop duyệt chức năng. Ghi theo những gì BO đang chạy, phần chưa làm được đánh dấu rõ.

Bắt đầu từ [Workflow đơn hàng](./workflow.md).

## Tài liệu theo trang

| Trang | Đường dẫn | Tài liệu | Tình trạng |
|---|---|---|---|
| Phần chung (menu, tìm kiếm, thông báo) | | [common.md](./pages/common.md) | Đã có |
| Dashboard | `/` | [dashboard.md](./pages/dashboard.md) | Đã có, số thật từ đơn trong BO |
| Đơn hàng | `/orders` | [orders.md](./pages/orders.md) | Đã có, gồm hoàn tiền và giao hàng lỗi |
| Sản phẩm trưng bày | `/products` | [products.md](./pages/products.md) | Đã có |
| Sản phẩm hủy đơn | `/cancelled-products` | [cancelled-products.md](./pages/cancelled-products.md) | Đã có |
| Thủ công | `/craft` | [craft.md](./pages/craft.md) | Đã có |
| Kho nguyên liệu | `/inventory` | [inventory.md](./pages/inventory.md) | Đã có |
| Khách hàng | `/customers` | [customers.md](./pages/customers.md) | Đã có |
| Đánh giá | `/reviews` | Chưa có | Trang tạm, chưa làm |
| Mã giảm giá | `/discounts` | [discounts.md](./pages/discounts.md) | Đã có |
| Cài đặt | `/settings` | [settings.md](./pages/settings.md) | Đã có |

## Đặc tả kỹ thuật cho BE

| Tài liệu | Nội dung |
|---|---|
| [craft-builder.md](./craft-builder.md) | Cấu hình Thủ công, cách tính giá, API |
| [inventory.md](./inventory.md) | Nguyên liệu, phiếu kho, tiêu hao, trừ kho, API |

Yêu cầu dữ liệu đơn hàng cho BE nằm ở [orders.md](./pages/orders.md#việc-của-be).

## Giới hạn hiện tại

- **Dữ liệu lưu trên trình duyệt:** chưa có BE, xóa dữ liệu trình duyệt là mất. Máy khác không thấy.
- **Web (`fe`) chưa nối:** chưa đọc Thủ công, Kho, Cài đặt. Đơn trên web chưa vào BO. Khi nối cần làm thêm: chọn nhiều sáp, màu, trang trí, phụ thu theo tỉ lệ, phụ thu hương.
- **Ô lượng cho 1 hũ:** chỉ có ở popup Tự phối nến của BO, web không có.
- **Tài khoản:** thao tác đang ghi tên "Admin 2510", chưa có đăng nhập và phân quyền.
