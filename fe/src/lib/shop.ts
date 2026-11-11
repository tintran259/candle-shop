// Dữ liệu cửa hàng từ BE (API công khai GET /api/shop/products, docs/api.md#web-bán-hàng).
// Gọi ở máy chủ Next (không qua trình duyệt) nên không cần CORS; lưu đệm 60 giây (ISR) — BO sửa sản phẩm thì web cập nhật sau tối đa 1 phút
export type ShopCategory = { id: string; name: string; nameEn: string };
export type ShopProduct = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number;
  images: string[];
  categoryId: string;
  aromaLevel: "soft" | "medium" | "strong";
  size: "small" | "medium" | "big";
  scent?: string;
  waxType?: string;
  burnTime?: number;
  isNew: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
};
export type ShopData = { categories: ShopCategory[]; products: ShopProduct[] };
export type ShopContact = { name: string; phone: string };

// Máy chủ Next gọi BE: API_URL (vd https://candle2510-be.onrender.com/api), mặc định BE trên máy
const API_URL = (process.env.API_URL || "http://localhost:4000/api").replace(/\/$/, "");

// null = không tải được (BE đang khởi động / lỗi) — trang hiện thông báo, lần sau tự thử lại.
// SHOP_MOCK=1: dùng dữ liệu giả (lib/shop-mock.ts), không gọi BE — chỉ để thử giao diện trên máy
export async function getShopProducts(): Promise<ShopData | null> {
  if (process.env.SHOP_MOCK === "1") return (await import("@/lib/shop-mock")).mockShopData;
  try {
    const res = await fetch(`${API_URL}/shop/products`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    return (await res.json()) as ShopData;
  } catch {
    return null;
  }
}

export const productUrl = (p: Pick<ShopProduct, "slug">) => `/products/${encodeURIComponent(p.slug)}`;

// Gợi ý ở trang chi tiết: cùng danh mục trước, thiếu thì thêm mẫu khác; trong mỗi nhóm giữ thứ tự BE (nổi bật trước, mới trước)
export function suggestProducts(all: ShopProduct[], current: ShopProduct, n = 4) {
  const others = all.filter((p) => p.id !== current.id);
  return [...others.filter((p) => p.categoryId === current.categoryId), ...others.filter((p) => p.categoryId !== current.categoryId)].slice(0, n);
}

// Liên hệ của shop: tên + SĐT người gửi ở BO › Cài đặt. Lỗi thì null (trang vẫn hiện, chỉ ẩn nút liên hệ)
export async function getShopContact(): Promise<ShopContact | null> {
  if (process.env.SHOP_MOCK === "1") return (await import("@/lib/shop-mock")).mockShopContact;
  try {
    const res = await fetch(`${API_URL}/shop/contact`, { next: { revalidate: 60 }, signal: AbortSignal.timeout(20_000) });
    return res.ok ? ((await res.json()) as ShopContact) : null;
  } catch {
    return null;
  }
}

// Link chat Zalo từ SĐT (bỏ dấu cách, chấm, ngoặc; +84 → 0). Không đủ số thì null — ẩn nút
export function zaloUrl(phone: string | undefined) {
  const digits = (phone ?? "").replace(/\D/g, "").replace(/^84(?=\d{9}$)/, "0");
  return digits.length >= 9 ? `https://zalo.me/${digits}` : null;
}

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
export const formatPrice = (v: number) => money.format(v);

export const aromaLabels: Record<ShopProduct["aromaLevel"], string> = { soft: "Hương nhẹ", medium: "Hương vừa", strong: "Hương đậm" };
export const sizeLabels: Record<ShopProduct["size"], string> = { small: "Cỡ nhỏ", medium: "Cỡ vừa", big: "Cỡ lớn" };

// Ảnh Cloudinary: chèn tham số để Cloudinary trả đúng cỡ + định dạng tốt nhất (như imageUrl của BO). Ảnh khác giữ nguyên
export function cloudinary(src: string, width: number) {
  if (!src.startsWith("https://res.cloudinary.com/") || !src.includes("/image/upload/")) return src;
  return src.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_fill,g_auto,ar_1:1,w_${width}/`);
}
