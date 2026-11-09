-- CreateEnum
CREATE TYPE "AromaLevel" AS ENUM ('soft', 'medium', 'strong');

-- CreateEnum
CREATE TYPE "ProductSize" AS ENUM ('small', 'medium', 'big');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('active', 'hidden');

-- CreateEnum
CREATE TYPE "MaterialCategory" AS ENUM ('vessel', 'wax', 'fragrance', 'wick', 'dye', 'decor', 'packaging', 'other');

-- CreateEnum
CREATE TYPE "Unit" AS ENUM ('g', 'ml', 'pcs');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('in', 'out', 'adjust', 'order', 'cost', 'make');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('percent', 'fixed', 'freeship');

-- CreateEnum
CREATE TYPE "DiscountScope" AS ENUM ('all', 'products', 'custom');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'paid', 'producing', 'ready', 'shipping', 'completed', 'delivery_failed', 'returning', 'returned', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentPlan" AS ENUM ('full', 'deposit');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('vnpay', 'momo', 'cod');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'success', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "CancelOutcome" AS ENUM ('returned', 'stocked', 'consumed');

-- CreateEnum
CREATE TYPE "CancelFault" AS ENUM ('customer', 'shop');

-- CreateEnum
CREATE TYPE "ReturnCondition" AS ENUM ('good', 'damaged');

-- CreateEnum
CREATE TYPE "EventKind" AS ENUM ('status', 'payment', 'schedule', 'delivery', 'edit', 'complaint');

-- CreateEnum
CREATE TYPE "ComplaintResolution" AS ENUM ('resend', 'refund', 'none');

-- CreateEnum
CREATE TYPE "CancelledStatus" AS ENUM ('pending', 'converted', 'discarded');

-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" TEXT NOT NULL DEFAULT 'shop',
    "depositPercent" INTEGER NOT NULL DEFAULT 50,
    "maxDeliveryAttempts" INTEGER NOT NULL DEFAULT 3,
    "resendFee" INTEGER NOT NULL DEFAULT 30000,
    "dailyCapacity" INTEGER NOT NULL DEFAULT 20,
    "leadDays" INTEGER NOT NULL DEFAULT 3,
    "minMargin" INTEGER NOT NULL DEFAULT 50,
    "priceMarkup" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "senderName" TEXT NOT NULL DEFAULT '2510 Candle',
    "senderPhone" TEXT NOT NULL DEFAULT '',
    "senderAddress" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fee" INTEGER NOT NULL,
    "days" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShippingOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carrier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trackingUrl" TEXT,
    "requireCode" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Carrier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "nameVi" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'default',
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "salePrice" INTEGER,
    "images" TEXT[],
    "categoryId" TEXT NOT NULL,
    "aromaLevel" "AromaLevel" NOT NULL,
    "size" "ProductSize" NOT NULL,
    "scent" TEXT,
    "waxType" TEXT,
    "burnTime" INTEGER,
    "build" JSONB,
    "status" "ProductStatus" NOT NULL DEFAULT 'active',
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "sold" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRecipeLine" (
    "productId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductRecipeLine_pkey" PRIMARY KEY ("productId","materialId")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "category" "MaterialCategory" NOT NULL,
    "unit" "Unit" NOT NULL,
    "tracked" BOOLEAN NOT NULL DEFAULT true,
    "stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lowStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unitCost" DOUBLE PRECISION,
    "jarType" TEXT,
    "capacity" INTEGER,
    "swatch" TEXT,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialRecipeLine" (
    "materialId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MaterialRecipeLine_pkey" PRIMARY KEY ("materialId","componentId")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "change" DOUBLE PRECISION NOT NULL,
    "after" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "orderCode" TEXT,
    "totalCost" INTEGER,
    "unitCost" DOUBLE PRECISION,
    "previousCost" DOUBLE PRECISION,
    "batch" TEXT,
    "by" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL,
    "hasAccount" BOOLEAN NOT NULL DEFAULT false,
    "newsletter" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "note" TEXT,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "DiscountType" NOT NULL,
    "value" INTEGER NOT NULL,
    "maxDiscount" INTEGER,
    "minOrder" INTEGER,
    "scope" "DiscountScope" NOT NULL DEFAULT 'all',
    "firstOrderOnly" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TEXT NOT NULL,
    "endsAt" TEXT,
    "usageLimit" INTEGER,
    "perCustomerLimit" INTEGER,
    "used" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TEXT NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCustomer" (
    "discountId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,

    CONSTRAINT "DiscountCustomer_pkey" PRIMARY KEY ("discountId","customerId")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL DEFAULT '',
    "customerPhone" TEXT NOT NULL,
    "shippingAddress" TEXT NOT NULL,
    "shippingMethod" TEXT NOT NULL,
    "shippingName" TEXT,
    "shippingDays" INTEGER,
    "depositPercent" INTEGER,
    "subtotal" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "discountCode" TEXT,
    "shippingFee" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "paymentPlan" "PaymentPlan" NOT NULL,
    "paymentMethod" "PaymentProvider" NOT NULL,
    "readyDate" TEXT NOT NULL,
    "note" TEXT,
    "internalNote" TEXT,
    "cancelReason" TEXT,
    "cancelOutcome" "CancelOutcome",
    "cancelFault" "CancelFault",
    "refundDue" INTEGER,
    "refundAmount" INTEGER,
    "refundImages" TEXT[],
    "refundNote" TEXT,
    "refundAt" TIMESTAMP(3),
    "refundBy" TEXT,
    "carrierId" TEXT,
    "carrierName" TEXT,
    "shipCarrierId" TEXT,
    "shipCarrier" TEXT,
    "trackingCode" TEXT,
    "trackingUrl" TEXT,
    "shipCost" INTEGER,
    "shippedAt" TIMESTAMP(3),
    "shippingCost" INTEGER,
    "deliveryAttempts" INTEGER,
    "deliveryIssue" TEXT,
    "returnCondition" "ReturnCondition",
    "returnNote" TEXT,
    "resendFee" INTEGER,
    "materialCost" INTEGER,
    "replacementForId" TEXT,
    "replacementForCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "custom" TEXT,
    "craft" JSONB,
    "recipe" JSONB,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "transactionId" TEXT,
    "isRefund" BOOLEAN NOT NULL DEFAULT false,
    "images" TEXT[],
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "at" TIMESTAMP(3) NOT NULL,
    "kind" "EventKind",
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "by" TEXT NOT NULL,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "images" TEXT[],
    "resolution" "ComplaintResolution" NOT NULL,
    "refundAmount" INTEGER,
    "replacementId" TEXT,
    "replacementCode" TEXT,
    "at" TIMESTAMP(3) NOT NULL,
    "by" TEXT NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CancelledProduct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "custom" TEXT,
    "recipe" JSONB,
    "personalized" BOOLEAN NOT NULL DEFAULT false,
    "images" TEXT[],
    "price" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "cancelReason" TEXT NOT NULL,
    "cancelledAt" TIMESTAMP(3) NOT NULL,
    "status" "CancelledStatus" NOT NULL DEFAULT 'pending',
    "displayProductId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CancelledProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CraftConfig" (
    "id" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "pendingMaterials" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CraftConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDraft" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "values" JSONB NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationRead" (
    "id" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationRead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "StockMovement_materialId_at_idx" ON "StockMovement"("materialId", "at");

-- CreateIndex
CREATE INDEX "StockMovement_orderCode_idx" ON "StockMovement"("orderCode");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Discount_code_key" ON "Discount"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Order_code_key" ON "Order"("code");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_customerPhone_idx" ON "Order"("customerPhone");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_at_idx" ON "OrderEvent"("orderId", "at");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRecipeLine" ADD CONSTRAINT "ProductRecipeLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRecipeLine" ADD CONSTRAINT "ProductRecipeLine_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRecipeLine" ADD CONSTRAINT "MaterialRecipeLine_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRecipeLine" ADD CONSTRAINT "MaterialRecipeLine_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCustomer" ADD CONSTRAINT "DiscountCustomer_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCustomer" ADD CONSTRAINT "DiscountCustomer_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
