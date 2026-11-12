// Mạng xã hội của shop (Cài đặt › Mạng xã hội) — chân trang web hiện các mạng đang bật, theo thứ tự.
// Danh sách nền tảng khớp BE (be/src/settings/socials.ts)
export const PLATFORMS = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  threads: "Threads",
  zalo: "Zalo",
  shopee: "Shopee",
  other: "Khác",
} as const;
export type Platform = keyof typeof PLATFORMS;
export const SOCIALS_MAX = 10;

// label trống = tên nền tảng (nền tảng "Khác" bắt buộc nhập tên)
export type Social = { id: string; platform: Platform; label: string; url: string; enabled: boolean };

// Gợi ý link theo nền tảng
export const urlHints: Record<Platform, string> = {
  facebook: "https://facebook.com/…",
  instagram: "https://instagram.com/…",
  tiktok: "https://tiktok.com/@…",
  youtube: "https://youtube.com/@…",
  threads: "https://threads.net/@…",
  zalo: "https://zalo.me/…",
  shopee: "https://shopee.vn/…",
  other: "https://…",
};
