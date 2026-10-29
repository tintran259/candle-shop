import type { Metadata, Viewport } from "next";
import { Gruppo, Inter, Lexend_Exa } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
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
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002"),
    title: t("title"),
    description: t("description"),
    alternates: { languages: { vi: "/", en: "/en" } },
    openGraph: { title: t("title"), description: t("description"), images: ["/images/hero-candle.png"] },
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
