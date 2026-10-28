import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { ProductListing } from "@/components/shop/product-listing";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/shop">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Shop" });
  return { title: `${t("title")} — 2510 Scented Candle` };
}

export default async function ShopPage({ params }: PageProps<"/[locale]/shop">) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Bộ lọc đọc từ query string → cần Suspense
  return (
    <Suspense>
      <ProductListing />
    </Suspense>
  );
}
