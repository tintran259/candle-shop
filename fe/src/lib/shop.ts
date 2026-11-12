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
  // Concept (dịp lễ: Noel, Tết…) — có thể rỗng
  conceptIds: string[];
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
// Concept (dịp lễ): như danh mục + thời gian bán (YYYY-MM-DD, null = không giới hạn). BE chỉ trả concept đang trong mùa
export type ShopConcept = ShopCategory & { startsOn?: string | null; endsOn?: string | null };
export type ShopData = { categories: ShopCategory[]; concepts: ShopConcept[]; products: ShopProduct[] };
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
    const data = (await res.json()) as ShopData;
    // BE cũ chưa có concept: coi như chưa có concept nào
    return { ...data, concepts: data.concepts ?? [], products: data.products.map((p) => ({ ...p, conceptIds: p.conceptIds ?? [] })) };
  } catch {
    return null;
  }
}

export const productUrl = (p: Pick<ShopProduct, "slug">) => `/products/${encodeURIComponent(p.slug)}`;

// Gợi ý ở trang chi tiết: mẫu chung concept (dịp lễ) trước, rồi cùng danh mục, thiếu thì thêm mẫu khác; cùng mức thì giữ thứ tự BE (nổi bật trước, mới trước)
export function suggestProducts(all: ShopProduct[], current: ShopProduct, n = 4) {
  const score = (p: ShopProduct) => p.conceptIds.filter((c) => current.conceptIds.includes(c)).length * 2 + (p.categoryId === current.categoryId ? 1 : 0);
  return all
    .filter((p) => p.id !== current.id)
    .map((p, i) => ({ p, i, s: score(p) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, n)
    .map((r) => r.p);
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

// Ảnh Cloudinary thu về bề ngang tối đa, giữ nguyên tỉ lệ (không cắt) — dùng cho hero, logo
export function cloudinaryFit(src: string, width: number) {
  if (!src.startsWith("https://res.cloudinary.com/") || !src.includes("/image/upload/")) return src;
  return src.replace("/image/upload/", `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
}

// Ngày bán cuối của mẫu theo concept: mọi concept của mẫu đều có ngày kết thúc thì lấy ngày muộn nhất; có concept không giới hạn thì null
export function saleEndsOn(p: ShopProduct, concepts: ShopConcept[]) {
  const mine = concepts.filter((c) => p.conceptIds.includes(c.id));
  if (!mine.length || mine.some((c) => !c.endsOn)) return null;
  return {
    date: mine
      .map((c) => c.endsOn!)
      .sort()
      .at(-1)!,
    names: mine.map((c) => c.name),
  };
}

export const formatDay = (d: string) => d.split("-").reverse().join("/");

// Concept chưa tới ngày mở bán (giờ VN)
const todayVN = () => new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
export const isUpcoming = (c: Pick<ShopConcept, "startsOn">) => !!c.startsOn && c.startsOn > todayVN();

// Ảnh lưu thẳng trong DB dạng data URL (khi chưa cấu hình Cloudinary) có thể vài trăm KB – vài MB mỗi ảnh: nhúng vào HTML danh sách
// thì trang rất nặng. Danh sách, tìm kiếm, gợi ý bỏ các ảnh này (thẻ hiện logo thay thế); trang chi tiết vẫn hiện
export const isDataUrl = (src: string) => src.startsWith("data:");
export const withoutDataImages = (p: ShopProduct): ShopProduct => (p.images.some(isDataUrl) ? { ...p, images: p.images.filter((s) => !isDataUrl(s)) } : p);
export const listable = (d: ShopData): ShopData => ({ ...d, products: d.products.map(withoutDataImages) });
