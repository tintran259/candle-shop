import { routing, type Locale } from "@/i18n/routing";

// Domain thật đặt qua NEXT_PUBLIC_SITE_URL khi deploy (vd https://2510candle.vn)
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002").replace(/\/$/, "");

export const SITE_NAME = "2510 Scented Candle";

export const ogLocale: Record<Locale, string> = { vi: "vi_VN", en: "en_US" };

// Đường dẫn theo localePrefix "as-needed": vi ở "/", en ở "/en"
export const localePath = (locale: Locale) => (locale === routing.defaultLocale ? "/" : `/${locale}`);

export const absoluteUrl = (path: string) => `${SITE_URL}${path === "/" ? "" : path}` || SITE_URL;

export const languageAlternates = () => ({
  ...Object.fromEntries(routing.locales.map((l) => [l, absoluteUrl(localePath(l))])),
  "x-default": absoluteUrl(localePath(routing.defaultLocale)),
});
