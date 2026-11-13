// Giao diện trang chủ từ BE (GET /api/shop/home, docs/api.md#web-bán-hàng): thanh thông báo, logo, hero do chủ shop sửa ở
// BO › Cài đặt › Giao diện web — BE đã chọn sẵn giao diện của concept đang trong mùa — và 3 mẫu nổi bật cho khối "Xưởng nến".
// Trường trống / BE lỗi thì web dùng nội dung có sẵn (content/home.ts). Lưu đệm 60 giây như danh sách sản phẩm
import { cache } from "react";
import { footerContent, type BlocksTheme, type FooterContent } from "@/lib/blocks";
import { API_URL, aromaLabels, cloudinaryFit, formatPrice, isDataUrl, productUrl, sizeLabels, type ShopCategory, type ShopProduct } from "@/lib/shop";
import { announcement as defaultAnnouncement, collection, hero as defaultHero } from "@/content/home";

export type Focus = "left" | "center" | "right";
export type SiteTheme = {
  themeId?: string | null;
  conceptId: string | null;
  announcementOn: boolean;
  announcement?: string;
  logo: { light?: string; dark?: string };
  hero: { image?: string; focus?: Focus; eyebrow?: string; title?: string; text?: string; cta?: string; mark?: string };
  // Khối Xưởng nến: chữ do BO sửa (mẫu chọn tay BE đã xếp sẵn vào featured)
  collection?: { title?: string; heading?: string; note?: string; eyebrow?: string };
} & BlocksTheme;
type HomeData = { theme: SiteTheme; featured: ShopProduct[]; categories: ShopCategory[] };

// Tag lưu đệm của giao diện web: BE báo POST /api/revalidate?tag=site-theme khi đăng / gỡ giao diện → làm mới ngay (app/api/revalidate/route.ts)
export const SITE_THEME_TAG = "site-theme";

// cache(): khung trang (thanh thông báo, logo) và trang chủ cùng đọc trong một lượt dựng — chỉ gọi một lần
export const getHome = cache(async (): Promise<HomeData | null> => {
  if (process.env.SHOP_MOCK === "1") return (await import("@/lib/shop-mock")).mockHome;
  try {
    const res = await fetch(`${API_URL}/shop/home`, { next: { revalidate: 60, tags: [SITE_THEME_TAG] }, signal: AbortSignal.timeout(20_000) });
    return res.ok ? ((await res.json()) as HomeData) : null;
  } catch {
    return null;
  }
});

// Khung trang mọi trang: thanh thông báo + logo
// Khung trang mọi trang: thanh thông báo + logo + chân trang (ảnh, khẩu hiệu)
export type Chrome = { announcement: string | null; logo: { light?: string; dark?: string }; footer: FooterContent };
export async function getChrome(): Promise<Chrome> {
  const t = (await getHome())?.theme;
  return { announcement: t && !t.announcementOn ? null : t?.announcement || defaultAnnouncement, logo: t?.logo ?? {}, footer: footerContent(t?.footer) };
}

// Hero: phần BO để trống lấy nội dung có sẵn. Điểm lấy nét: ảnh có sẵn đặt 62% (chủ thể lệch phải), ảnh tải lên theo lựa chọn ở BO
const FOCUS: Record<Focus, string> = { left: "30% center", center: "50% center", right: "70% center" };
export function heroContent(t: SiteTheme["hero"] | undefined) {
  const h = t ?? {};
  return {
    eyebrow: h.eyebrow || defaultHero.eyebrow,
    title: h.title ? h.title.split("\n").filter((l) => l.trim()) : defaultHero.title,
    text: h.text || defaultHero.text,
    cta: { label: h.cta || defaultHero.cta.label, href: defaultHero.cta.href },
    mark: h.mark || defaultHero.mark,
    footnote: defaultHero.footnote,
    photo: h.image
      ? { src: cloudinaryFit(h.image, 2400), alt: "Ảnh trang chủ 2510 Candle", position: FOCUS[h.focus ?? "right"], remote: true }
      : { src: defaultHero.photo.src, alt: defaultHero.photo.alt, position: "62% center", remote: false },
  };
}
export type HeroContent = ReturnType<typeof heroContent>;

// Chữ khối "Xưởng nến": BO để trống thì dùng nội dung có sẵn
export function collectionText(t: SiteTheme["collection"] | undefined) {
  return { title: t?.title || collection.title, heading: t?.heading || collection.heading, note: t?.note || collection.note, eyebrow: t?.eyebrow || collection.eyebrow };
}
export type CollectionText = ReturnType<typeof collectionText>;

// Thẻ "Xưởng nến": đủ 3 mẫu từ BE thì dùng mẫu thật (bấm mở trang chi tiết), thiếu thì giữ 3 thẻ có sẵn
export type FeaturedCard = { key: string; name: string; category: string; price: string; notes: string; details: string; href: string; photo?: { src: string; alt: string } };
export function featuredCards(home: HomeData | null): FeaturedCard[] {
  if (!home || home.featured.length < 3) return collection.products.map((p) => ({ ...p, key: p.name, href: collection.more.href }));
  return home.featured.map((p) => {
    const image = p.images.find((s) => !isDataUrl(s));
    return {
      key: p.id,
      name: p.name,
      category: home.categories.find((c) => c.id === p.categoryId)?.name ?? "",
      price: formatPrice(p.salePrice ?? p.price),
      notes: p.scent || aromaLabels[p.aromaLevel],
      details: [sizeLabels[p.size], p.burnTime && `cháy khoảng ${p.burnTime} giờ`].filter(Boolean).join(" · "),
      href: productUrl(p),
      photo: image ? { src: image, alt: p.name } : undefined,
    };
  });
}
