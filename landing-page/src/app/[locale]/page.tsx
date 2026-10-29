import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { BackToTop } from "@/components/back-to-top";
import { Benefits } from "@/components/sections/benefits";
import { BestSellers } from "@/components/sections/best-sellers";
import { Collection } from "@/components/sections/collection";
import { Hero } from "@/components/sections/hero";
import { LargeOrders } from "@/components/sections/large-orders";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function LandingPage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("Nav");

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:bg-paper focus:px-4 focus:py-2"
      >
        {t("skip")}
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <Benefits />
        <Collection />
        <BestSellers />
        <LargeOrders />
      </main>
      <SiteFooter />
      <BackToTop />
    </>
  );
}
