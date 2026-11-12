// Giao diện web (docs/pages/site-theme.md) — cùng dạng với BE (be/src/site-theme/theme.ts).
// Danh sách giao diện: "Mặc định" (luôn có) + giao diện gắn concept (dịp lễ). Mỗi giao diện có bản nháp + bản đã đăng riêng.
// Trường để trống: giao diện concept lấy của Mặc định (bản đã đăng), Mặc định lấy nội dung có sẵn của web (webDefaults)
import { seasonOf, type Concept } from "@/lib/products/concepts";

export type Focus = "left" | "center" | "right";
export type HeroTheme = { image?: string; focus?: Focus; eyebrow?: string; title?: string; text?: string; cta?: string; mark?: string };
// Khối "Xưởng nến": chữ + tối đa 12 mẫu chọn tay (theo thứ tự; hơn 3 mẫu thì web chạy băng chuyền tự cuộn). Giao diện concept không chọn mẫu thì dùng mẫu của Mặc định; không ai chọn thì web tự lấy mẫu nổi bật
export type CollectionTheme = { title?: string; heading?: string; note?: string; eyebrow?: string; productIds?: string[] };
export const COLLECTION_MAX = 12;
export type ThemePart = { announcement?: string; logo?: { light?: string; dark?: string }; hero?: HeroTheme; collection?: CollectionTheme };
// Phần form sửa (announcementOn chỉ ở Mặc định)
export type BaseTheme = ThemePart & { announcementOn?: boolean };
// Nội dung lưu: thêm concept áp dụng (chỉ giao diện khác Mặc định; mỗi concept thuộc tối đa một giao diện)
export type ThemeContent = BaseTheme & { conceptIds?: string[] };
export type SiteTheme = {
  id: string;
  name: string;
  isDefault: boolean;
  published: ThemeContent | null;
  draft: ThemeContent | null;
  publishedAt: string | null;
  updatedAt: string;
};

export const DEFAULT_THEME = "default";
export const defaultTheme = (): SiteTheme => ({ id: DEFAULT_THEME, name: "Mặc định", isDefault: true, published: null, draft: null, publishedAt: null, updatedAt: new Date(0).toISOString() });

// Giới hạn — khớp BE (site-theme.module.ts) và bố cục trang chủ
export const LIMITS = { name: 60, announcement: 90, eyebrow: 60, titleLine: 30, text: 220, cta: 30, mark: 32, collTitle: 20, collHeading: 60, collNote: 60, collEyebrow: 40 };

// Nội dung có sẵn của web khi chưa cấu hình (chép từ fe/src/content/home.ts — đổi ở web thì đổi ở đây) — dùng làm chữ gợi ý và xem trước
export const webDefaults = {
  announcement: "Mỗi hũ nến được đổ tay theo đơn của bạn · Hoàn thành trong 2–3 ngày",
  eyebrow: "Nến thủ công mẻ nhỏ. Nghi thức mỗi ngày.",
  title: "Một chút ánh sáng.\nThật nhiều cảm xúc.",
  text: "Những hũ nến đổ tay dành cho những khoảnh khắc bạn muốn chậm lại. Làm chậm rãi. Cháy thật đẹp.",
  cta: "Tìm ánh nến của bạn",
  mark: "Made by hand, never twice.",
  collection: { title: "Xưởng nến", heading: "Ngày đẹp bắt đầu từ một ánh nến.", note: "Đổ tay tỉ mỉ. Chăm chút từng chi tiết.", eyebrow: "Bộ sưu tập đặc trưng" },
};

// Ảnh có sẵn của web (chép từ fe/public sang bo/public/site-preview) — hiện khi chưa chọn ảnh, và ở phần minh họa dưới hero của khung xem trước
export const webAssets = {
  hero: "/site-preview/hero-2510.jpg",
  logo: "/site-preview/logo-2510.png",
  cards: [
    { name: "Sáng Chủ Nhật", category: "Mùi hương mỗi ngày", price: "320.000 ₫", image: "/site-preview/sunday-morning.jpg" },
    { name: "Giờ Vàng", category: "Ấm áp & gỗ", price: "340.000 ₫", image: "/site-preview/golden-hour.jpg" },
    { name: "Vào Rừng", category: "Tươi mát & bình yên", price: "340.000 ₫", image: "/site-preview/into-the-woods.jpg" },
  ],
};

export const focusLabels: Record<Focus, string> = { left: "Trái", center: "Giữa", right: "Phải" };
// Vị trí lấy nét của ảnh khi bị cắt (giống web)
export const focusPosition: Record<Focus, string> = { left: "30% center", center: "50% center", right: "70% center" };

// Bỏ trường rỗng để so sánh / lưu gọn
export function compact<T extends object>(o: T): T {
  return JSON.parse(JSON.stringify(o, (_, v) => (v === "" || v === null ? undefined : v)));
}

// Ghép giao diện concept lên Mặc định — để xem trước (như BE)
export function merged(base: ThemeContent, over?: ThemeContent): BaseTheme {
  const pick = <V>(a?: V, b?: V) => (a !== undefined && a !== "" ? a : b);
  return {
    announcementOn: base.announcementOn,
    announcement: pick(over?.announcement, base.announcement),
    logo: { light: pick(over?.logo?.light, base.logo?.light), dark: pick(over?.logo?.dark, base.logo?.dark) },
    hero: Object.fromEntries((["image", "focus", "eyebrow", "title", "text", "cta", "mark"] as const).map((k) => [k, pick(over?.hero?.[k], base.hero?.[k])])),
    collection: {
      ...Object.fromEntries((["title", "heading", "note", "eyebrow"] as const).map((k) => [k, pick(over?.collection?.[k], base.collection?.[k])])),
      productIds: over?.collection?.productIds?.length ? over.collection.productIds : base.collection?.productIds,
    },
  };
}

// Concept mà giao diện đang giữ (bản nháp hoặc đã đăng) — concept đã giữ thì giao diện khác không chọn được
export const heldConcepts = (t: SiteTheme) => new Set([...(t.published?.conceptIds ?? []), ...(t.draft?.conceptIds ?? [])]);

// Giao diện web đang dùng (như BE): concept hiện đầu tiên (thứ tự trang Concept) đang trong mùa có giao diện ĐÃ ĐĂNG gắn với nó
export function liveTheme(themes: SiteTheme[], concepts: Concept[]) {
  for (const c of concepts) {
    if (c.hidden || !["on", "always"].includes(seasonOf(c))) continue;
    const t = themes.find((x) => !x.isDefault && x.published?.conceptIds?.includes(c.id));
    if (t) return { theme: t, concept: c };
  }
  return null;
}
