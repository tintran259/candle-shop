import { setRequestLocale } from "next-intl/server";
import { Faq } from "@/components/home/faq";
import { Features } from "@/components/home/features";
import { FragranceRoom } from "@/components/home/fragrance-room";
import { Hero } from "@/components/home/hero";
import { TrendingProducts } from "@/components/home/trending-products";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <TrendingProducts />
      <Features />
      <FragranceRoom />
      <Faq />
    </>
  );
}
