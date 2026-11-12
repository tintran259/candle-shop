// Mạng xã hội của shop (BO › Cài đặt › Mạng xã hội, docs/pages/settings.md#mạng-xã-hội) — hiện ở chân trang web (GET /shop/contact).
// Danh sách nền tảng khớp BO (bo/src/lib/settings/socials.ts) và web (fe/src/lib/shop.ts)
export const PLATFORMS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  threads: 'Threads',
  zalo: 'Zalo',
  shopee: 'Shopee',
  other: 'Khác',
} as const;
export type Platform = keyof typeof PLATFORMS;
export const PLATFORM_IDS = Object.keys(PLATFORMS) as Platform[];
export const SOCIALS_MAX = 10;

// Tên hiện trên web: tên tự đặt, trống thì tên nền tảng
export const socialLabel = (s: { platform: string; label: string }) => s.label.trim() || PLATFORMS[s.platform as Platform] || s.platform;
