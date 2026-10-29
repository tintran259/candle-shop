// Sản phẩm nến bán sẵn (trang Sản phẩm). Gộp các trường của bảng Product bên BE (Prisma)
// với các thuộc tính lọc mà web đang dùng (loại hương, độ thơm, kích thước).
// Shop làm theo đơn (2–3 ngày) nên không quản lý tồn kho ở đây.

export const aromaTypes = ["fruits", "nature", "parfum"] as const;
export const aromaLevels = ["soft", "medium", "strong"] as const;
export const productSizes = ["small", "medium", "big"] as const;

export type AromaType = (typeof aromaTypes)[number];
export type AromaLevel = (typeof aromaLevels)[number];
export type ProductSize = (typeof productSizes)[number];

// active = đang bán trên web, hidden = tạm ẩn
export type ProductStatus = "active" | "hidden";

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
  aromaType: AromaType;
  aromaLevel: AromaLevel;
  size: ProductSize;
  scent?: string;
  waxType?: string;
  // Giờ cháy ước tính
  burnTime?: number;
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
