-- Giao diện trang chủ web cấu hình ở BO (bản đã đăng / bản nháp)
-- CreateTable
CREATE TABLE "SiteTheme" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteTheme_pkey" PRIMARY KEY ("id")
);

