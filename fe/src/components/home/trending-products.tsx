import { useTranslations } from "next-intl";
import Image from "next/image";
import { ProductCard } from "@/components/home/product-card";
import { Reveal } from "@/components/motion/reveal";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { trendingProducts } from "@/lib/data";
import { cn } from "@/lib/utils";

export function TrendingProducts() {
  const t = useTranslations("Trending");
  return (
    <section className="bg-cream-light">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center px-4 pt-20 pb-20 md:px-10 xl:px-20">
        <Reveal className="flex flex-col items-center gap-2 text-center">
          <p className="text-lg tracking-caption text-dark-300">{t("eyebrow")}</p>
          <h2 className="text-2xl leading-[1.4] font-semibold text-ink md:text-[32px]">
            {t("title")}
          </h2>
        </Reveal>

        <div className="mt-14 grid w-full grid-cols-1 gap-10 sm:grid-cols-2 xl:grid-cols-4">
          {trendingProducts.map((product, i) => (
            <Reveal key={product.id} delay={i * 0.1}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>

        <SaleBanner />

        <Link
          href="/shop"
          className={cn(
            buttonVariants({ variant: "outline-peanut", size: "pill-lg" }),
            "mt-14 px-16",
          )}
        >
          {t("showMore")}
        </Link>
      </div>
    </section>
  );
}

function SaleBanner() {
  const t = useTranslations("Trending");
  return (
    <Reveal className="mt-16 w-full">
      <Link
        href="/shop?sale=1"
        className="group relative block h-[320px] overflow-hidden md:h-[400px]"
      >
        <Image
          src="/figma/sale-banner.png"
          alt={t("saleImageAlt")}
          fill
          sizes="(min-width: 1440px) 1280px, 100vw"
          className="scale-[1.27] object-cover object-[50%_45%] transition-transform duration-[1.2s] ease-out group-hover:scale-[1.33]"
        />
        <div className="absolute inset-0 bg-[rgba(201,164,137,0.3)]" />

        <div className="absolute top-1/4 left-6 text-white md:left-20">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-[136px] items-center justify-center bg-ink md:h-[87px] md:w-[184px]">
              <Image
                src="/figma/sale-35.svg"
                alt="35%"
                width={140}
                height={51}
                className="h-auto w-[104px] md:w-[140px]"
              />
            </div>
            <span className="text-6xl leading-[1.3] font-semibold md:text-[80px]">{t("saleOff")}</span>
          </div>
          <p className="mt-3 text-2xl leading-[1.4] md:text-[32px]">
            {t("saleLine1")}
            <br />
            {t("saleLine2")}
          </p>
        </div>
      </Link>
    </Reveal>
  );
}
