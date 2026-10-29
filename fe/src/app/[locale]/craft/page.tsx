import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { CandleCustomizer } from "@/components/customizer/candle-customizer";
import { CustomizerHero } from "@/components/customizer/customizer-hero";

export async function generateMetadata({ params }: PageProps<"/[locale]/craft">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Customizer" });
  return { title: `${t("metaTitle")} — 2510 Scented Candle`, description: t("intro") };
}

export default async function CraftPage({ params }: PageProps<"/[locale]/craft">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="bg-parchment">
      <CustomizerHero />
      <div className="mx-auto max-w-[1440px] px-4 pt-8 pb-20 md:px-10 lg:pt-10 xl:px-20">
        {/* Đọc ?config= (link "Lưu cấu hình") cần Suspense */}
        <Suspense fallback={<div className="h-[70vh] animate-pulse rounded-xl bg-brand-50" />}>
          <CandleCustomizer />
        </Suspense>
      </div>
    </div>
  );
}
