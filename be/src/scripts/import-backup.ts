// Nhập file sao lưu của BO vào DB: pnpm db:import <đường-dẫn-file.json>
// Xóa sạch dữ liệu BO hiện có rồi ghi lại toàn bộ, trong một giao dịch — lỗi giữa chừng thì không đổi gì.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { mapBackup, type BackupFile } from "../import/map-backup.js";

const path = process.argv[2];
if (!path) {
  console.error("Cách dùng: pnpm db:import <file-sao-luu.json>");
  process.exit(1);
}

const { data, warnings } = mapBackup(JSON.parse(readFileSync(path, "utf8")) as BackupFile);
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

await prisma.$transaction(
  async (tx) => {
    // Xóa theo thứ tự con trước cha (khóa ngoại)
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

    await tx.shopSettings.create({ data: data.settings });
    await tx.shippingOption.createMany({ data: data.shippingOptions });
    await tx.carrier.createMany({ data: data.carriers });
    await tx.material.createMany({ data: data.materials });
    await tx.materialRecipeLine.createMany({ data: data.materialRecipe });
    await tx.stockMovement.createMany({ data: data.movements });
    await tx.category.createMany({ data: data.categories });
    await tx.product.createMany({ data: data.products });
    await tx.productRecipeLine.createMany({ data: data.productRecipe });
    await tx.customer.createMany({ data: data.customers });
    await tx.discount.createMany({ data: data.discounts });
    await tx.discountCustomer.createMany({ data: data.discountCustomers });
    await tx.order.createMany({ data: data.orders });
    await tx.orderItem.createMany({ data: data.orderItems });
    await tx.payment.createMany({ data: data.payments });
    await tx.orderEvent.createMany({ data: data.events });
    await tx.complaint.createMany({ data: data.complaints });
    await tx.cancelledProduct.createMany({ data: data.cancelled });
    await tx.craftConfig.createMany({ data: data.craft });
    await tx.orderDraft.createMany({ data: data.orderDraft });
    await tx.notificationRead.createMany({ data: data.notificationsRead });
  },
  { timeout: 120_000 },
);
await prisma.$disconnect();

console.log(
  `Đã nhập: ${data.orders.length} đơn, ${data.products.length} sản phẩm, ${data.materials.length} nguyên liệu, ${data.movements.length} phiếu kho, ${data.customers.length} khách, ${data.discounts.length} mã giảm giá.`,
);
for (const w of warnings) console.warn("Lưu ý:", w);
