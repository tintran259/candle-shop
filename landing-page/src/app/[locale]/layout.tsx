import type { Metadata, Viewport } from "next";
import { Gruppo, Inter, Lexend_Exa } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { absoluteUrl, languageAlternates, localePath, ogLocale, SITE_NAME, SITE_URL } from "@/lib/site";
import "../globals.css";

const gruppo = Gruppo({ weight: "400", subsets: ["latin"], variable: "--font-gruppo" });
// Gruppo không có dấu tiếng Việt — Lexend Exa nét mảnh, chữ rộng thay cho bản vi
const lexendExa = Lexend_Exa({ weight: ["200", "300"], subsets: ["vietnamese"], variable: "--font-lexend-exa" });
// Bảng màu: "brand" (màu candle-shop) hoặc "mono" (đen trắng theo Figma)
const PALETTE: "brand" | "mono" = "brand";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-inter" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const url = absoluteUrl(localePath(locale));

  // Ảnh OG/Twitter lấy tự động từ opengraph-image.tsx cùng thư mục
  return {
    metadataBase: new URL(SITE_URL),
    title: t("title"),
    description: t("description"),
    keywords: t.raw("keywords") as string[],
    applicationName: SITE_NAME,
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    category: "shopping",
    alternates: { canonical: url, languages: languageAlternates() },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: t("title"),
      description: t("description"),
      locale: ogLocale[locale],
      alternateLocale: routing.locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
    },
    twitter: { card: "summary_large_image", title: t("title"), description: t("description") },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    formatDetection: { telephone: false, email: false, address: false },
  };
}

export const viewport: Viewport = { themeColor: PALETTE === "brand" ? "#0c0d12" : "#060606" };

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} data-palette={PALETTE} className={`${gruppo.variable} ${lexendExa.variable} ${inter.variable}`}>
      <body className="min-h-dvh">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
