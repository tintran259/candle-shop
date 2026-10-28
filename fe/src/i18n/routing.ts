import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["vi", "en"],
  defaultLocale: "vi",
  // Tiếng Việt ở "/", tiếng Anh ở "/en"
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
