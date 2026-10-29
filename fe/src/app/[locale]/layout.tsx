import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Bitter,
  Dancing_Script,
  La_Belle_Aurore,
  Zilla_Slab,
} from "next/font/google";
import { notFound } from "next/navigation";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { CartSheet } from "@/components/layout/cart-sheet";
import { ContactShopButton } from "@/components/layout/contact-shop";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SpotlightSearch } from "@/components/layout/spotlight-search";
import { Providers } from "@/components/providers";
import { routing } from "@/i18n/routing";
import "../globals.css";

const zilla = Zilla_Slab({
  variable: "--font-zilla",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const belle = La_Belle_Aurore({
  variable: "--font-belle",
  subsets: ["latin"],
  weight: "400",
});

// Zilla Slab / La Belle Aurore không có dấu tiếng Việt → dùng font thay thế cho "vi"
const bitter = Bitter({
  variable: "--font-bitter",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const dancing = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin", "vietnamese"],
  weight: "400",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata" });
  return { title: t("title"), description: t("description") };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${zilla.variable} ${belle.variable} ${bitter.variable} ${dancing.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col tracking-brand">
        <NextIntlClientProvider>
          <Providers>
            <AnnouncementBar />
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <CartSheet />
            <SpotlightSearch />
            <ContactShopButton />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
