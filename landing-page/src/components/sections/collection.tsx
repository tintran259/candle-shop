import Image from "next/image";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/reveal";
import { collections } from "@/lib/content";
import { btnInk } from "@/lib/ui";

// Nhãn trắng + nút SHOP đen, căn phải như Figma
function CollectionLabel({ title, size }: { title: string; size: "lg" | "sm" }) {
  const t = useTranslations("Collection");
  return (
    <div className="flex flex-col items-end">
      <p
        className={cn(
          "bg-paper text-center font-display tracking-tightish text-ink uppercase",
          size === "lg" ? "w-[84%] py-3 text-display-sm sm:py-5 sm:text-[clamp(1.5rem,2.4vw,2.5rem)]" : "w-full px-1 py-2 text-sm sm:py-3 sm:text-xl lg:text-[25px]",
        )}
      >
        {title}
      </p>
      <a
        href="#best-sellers"
        aria-label={t("shopAria", { title })}
        className={cn(btnInk, size === "lg" ? "h-12 w-[60%] text-display-md sm:h-[60px] sm:text-3xl xl:h-[76px] xl:text-[40px]" : "h-11 w-[71%] text-base sm:h-[50px] sm:text-[26px]")}
      >
        {t("shop")}
      </a>
    </div>
  );
}

export function Collection() {
  const t = useTranslations("Collection");
  const { featured, items } = collections;
  return (
    <section id="collection" className="overflow-hidden py-16 lg:py-24">
      <div className="mx-auto grid max-w-[1536px] items-start gap-12 px-4 sm:px-8 lg:grid-cols-[577fr_928fr] lg:gap-[41px] lg:px-[50px] 2xl:px-0">
        {/* Hộp lớn */}
        <Reveal className="relative order-2 aspect-[577/860] overflow-hidden lg:order-1 lg:aspect-[577/1036]">
          <Image
            src={featured.image}
            alt={t("featuredAlt")}
            fill
            sizes="(min-width: 1024px) 577px, 100vw"
            className="object-cover transition-transform duration-[1.2s] ease-out hover:scale-[1.03]"
          />
          <div className="absolute inset-x-0 top-[11%] pl-[6%]">
            <CollectionLabel title={t(featured.key)} size="lg" />
          </div>
        </Reveal>

        <div className="order-1 flex flex-col items-center gap-12 lg:order-2 lg:gap-[162px]">
          <Reveal className="flex items-end justify-center lg:min-h-[398px]">
            <h2 className="max-w-[852px] text-center font-display text-display-lg sm:text-[clamp(2.75rem,5.2vw,5.625rem)] sm:leading-none tracking-tightish uppercase">
              {t("title")}
            </h2>
          </Reveal>

          <ul className="grid w-full max-w-[824px] grid-cols-2 gap-4 sm:gap-8 lg:gap-16">
            {items.map((item, i) => (
              <li key={item.key}>
                <Reveal delay={i * 0.12} className="group relative pb-[18%]">
                  <div className="relative aspect-[380/416] overflow-hidden">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 380px, 50vw"
                      className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="absolute right-0 bottom-0 left-[16%]">
                    <CollectionLabel title={t(item.key)} size="sm" />
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
