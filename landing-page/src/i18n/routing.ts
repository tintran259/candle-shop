import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["vi", "en"],
  defaultLocale: "vi",
  // Tiếng Việt ở "/", tiếng Anh ở "/en"
  localePrefix: "as-needed",
  // Landing page: link quảng cáo luôn ra đúng ngôn ngữ của URL, không tự đổi theo trình duyệt
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
