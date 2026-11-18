-- Ảnh nguyên liệu (Kho)
ALTER TABLE "Material" ADD COLUMN "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
