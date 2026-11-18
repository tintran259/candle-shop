-- Pha màu: dữ liệu mẫu đổ thử của bột oxit / màu nước, một bản JSON cho cả BO (docs/pages/color-mix.md)
CREATE TABLE "ColorMix" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColorMix_pkey" PRIMARY KEY ("id")
);
