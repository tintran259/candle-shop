"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "cn";
import { Reveal } from "@/components/reveal";
import { formatPrice, products } from "@/lib/content";
import { btnInk, PREFILL_EVENT } from "@/lib/ui";

// Landing page không có giỏ hàng: nút đặt hàng điền sẵn form và cuộn tới đó
function orderProduct(name: string) {
  window.dispatchEvent(new CustomEvent(PREFILL_EVENT, { detail: name }));
  document.getElementById("large-orders")?.scrollIntoView({ behavior: "smooth" });
}

export function BestSellers() {
  const t = useTranslations("BestSellers");
  const locale = useLocale();
  return (
    <section id="best-sellers" className="py-16 lg:py-[60px]">
      <div className="mx-auto max-w-[1728px] px-4 sm:px-8 lg:px-[100px]">
        <Reveal>
          <h2 className="text-center font-display text-[clamp(2.75rem,5.2vw,5.625rem)] leading-none tracking-tightish uppercase">
            {t("title")}
          </h2>
        </Reveal>

        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 lg:mt-[127px] lg:gap-10 xl:grid-cols-4">
          {products.map((p, i) => {
            const name = t(`products.${p.id}.name`);
            return (
              <li key={p.id}>
                <Reveal delay={(i % 4) * 0.1} className="group flex h-full flex-col items-center gap-3 text-center lg:gap-4">
                  <div className="relative aspect-[350/404] w-full overflow-hidden bg-mist">
                    <Image
                      src={p.image}
                      alt={name}
                      fill
                      sizes="(min-width: 1280px) 350px, 50vw"
                      className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.05]"
                    />
                  </div>
                  <h3 className="font-display text-2xl tracking-tightish uppercase sm:text-3xl lg:text-[40px]">{name}</h3>
                  <p className="text-sm tracking-tightish sm:text-base lg:text-[22px] lg:leading-snug">{t(`products.${p.id}.description`)}</p>
                  <p className="mt-auto text-2xl tracking-tightish lg:text-[40px]">{formatPrice(p.price, locale)}</p>
                  <button
                    type="button"
                    onClick={() => orderProduct(name)}
                    className={cn(btnInk, "h-14 w-full text-xl sm:text-2xl lg:h-[85px] lg:text-[30px]")}
                  >
                    {t("order")}
                  </button>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
