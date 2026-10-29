import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { absoluteUrl, languageAlternates, localePath } from "@/lib/site";

// Mỗi ngôn ngữ một URL, kèm hreflang trỏ sang bản còn lại
export default function sitemap(): MetadataRoute.Sitemap {
  return routing.locales.map((locale) => ({
    url: absoluteUrl(localePath(locale)),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: locale === routing.defaultLocale ? 1 : 0.9,
    alternates: { languages: languageAlternates() },
  }));
}
