// Xóa sạch dữ liệu BO (đơn, sản phẩm, kho, khách, mã giảm giá, Thủ công, cài đặt, nháp…), theo thứ tự con trước cha (khóa ngoại).
// Không đụng LoginGuard: PIN nằm ở biến môi trường, trạng thái khóa đăng nhập giữ nguyên. Gọi trong một giao dịch
import type { Prisma } from '../generated/prisma/client.js';

export async function wipeBoData(tx: Prisma.TransactionClient) {
  await tx.orderEvent.deleteMany();
  await tx.payment.deleteMany();
  await tx.orderItem.deleteMany();
  await tx.complaint.deleteMany();
  await tx.order.deleteMany();
  await tx.discountCustomer.deleteMany();
  await tx.discount.deleteMany();
  await tx.customer.deleteMany();
  await tx.productRecipeLine.deleteMany();
  await tx.product.deleteMany();
  await tx.category.deleteMany();
  await tx.stockMovement.deleteMany();
  await tx.materialRecipeLine.deleteMany();
  await tx.material.deleteMany();
  await tx.cancelledProduct.deleteMany();
  await tx.craftConfig.deleteMany();
  await tx.orderDraft.deleteMany();
  await tx.notificationRead.deleteMany();
  await tx.shippingOption.deleteMany();
  await tx.carrier.deleteMany();
  await tx.shopSettings.deleteMany();
}
