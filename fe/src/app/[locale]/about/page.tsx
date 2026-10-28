import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AboutHero } from "@/components/about/about-hero";
import { HowToVideo } from "@/components/about/how-to-video";
import { IngredientsSection } from "@/components/about/ingredients-section";
import { OurProduct } from "@/components/about/our-product";
import { SafeBanner } from "@/components/about/safe-banner";
import { Testimonials } from "@/components/about/testimonials";

export async function generateMetadata({ params }: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  return { title: `${t("metaTitle")} — 2510 Scented Candle`, description: t("heroText") };
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <AboutHero />
      <OurProduct />
      <HowToVideo />
      <IngredientsSection />
      <SafeBanner />
      <Testimonials />
    </>
  );
}
