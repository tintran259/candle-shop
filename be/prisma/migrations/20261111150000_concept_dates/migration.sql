-- Concept: thời gian áp dụng (trống = mọi ngày) — sản phẩm thuộc concept chỉ bán trên web trong mùa
-- AlterTable
ALTER TABLE "Concept" ADD COLUMN     "endsOn" DATE,
ADD COLUMN     "startsOn" DATE;

