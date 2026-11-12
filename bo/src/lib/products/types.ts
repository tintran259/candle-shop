import type { ProductBuild } from "@/lib/products/build";

// Sản phẩm trưng bày: mẫu nến hiện trên web. Gộp các trường của bảng Product bên BE (Prisma)
// với các thuộc tính lọc mà web đang dùng (danh mục, độ thơm, kích thước).
// Shop làm theo đơn (2–3 ngày) nên không quản lý tồn kho ở đây.

export const aromaLevels = ["soft", "medium", "strong"] as const;
export const productSizes = ["small", "medium", "big"] as const;

export type AromaLevel = (typeof aromaLevels)[number];
export type ProductSize = (typeof productSizes)[number];

// active = đang bán trên web, hidden = tạm ẩn
export type ProductStatus = "active" | "hidden";

// Một nguyên liệu trong công thức, lượng cho 1 cây theo đơn vị của nguyên liệu
export type RecipeLine = { materialId: string; quantity: number };

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  // VNĐ, số nguyên. salePrice phải nhỏ hơn price
  price: number;
  salePrice?: number;
  // Ảnh đầu tiên là ảnh chính
  images: string[];
  // Danh mục (loại hương) ở trang Danh mục
  categoryId: string;
  // Concept (dịp lễ) ở trang Concept — không bắt buộc, nhiều concept
  conceptIds?: string[];
  aromaLevel: AromaLevel;
  // Cỡ trên web, suy ra từ dung tích hũ
  size: ProductSize;
  scent?: string;
  // Tên các loại sáp trong công thức
  waxType?: string;
  // Giờ cháy ước tính
  burnTime?: number;
  // Công thức để giữ và trừ Kho khi khách đặt — suy ra từ build. Sản phẩm cũ có thể chưa có
  recipe?: RecipeLine[];
  // Dựng từ Kho: hũ, sáp, hương, màu, bấc và phụ kiện (lib/products/build.ts)
  build?: ProductBuild;
  status: ProductStatus;
  isNew: boolean;
  isFeatured: boolean;
  // Số liệu chỉ đọc — do hệ thống đơn hàng/đánh giá cập nhật
  rating: number;
  reviewCount: number;
  sold: number;
  createdAt: string;
  updatedAt: string;
};
