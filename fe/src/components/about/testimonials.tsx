"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

type Quote = { name: string; role: string; text: string };

// Ảnh đại diện theo vị trí; chưa có ảnh thì hiện chữ cái đầu
const avatars: (string | undefined)[] = [
  "/figma/about/avatar-berry.jpg",
  undefined,
  "/figma/detail/avatar-wing.jpg",
  "/figma/detail/avatar-ghandy.jpg",
  undefined,
];

export function Testimonials() {
  const t = useTranslations("About");
  const quotes = t.raw("quotes") as Quote[];
  const [api, setApi] = useState<CarouselApi>();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Tự chuyển slide mỗi 6 giây
  useEffect(() => {
    if (!api) return;
    const id = setInterval(() => api.scrollNext(), 6000);
    return () => clearInterval(id);
  }, [api]);

  return (
    <section
      aria-label={t("testimonials")}
      className="mx-auto max-w-[1440px] px-4 py-20 md:px-10 lg:py-[80px] xl:px-20"
    >
      <Reveal>
        <Carousel setApi={setApi} opts={{ loop: true }}>
          <CarouselContent>
            {quotes.map((quote, i) => (
              <CarouselItem key={quote.name}>
                <figure className="grid items-center gap-8 rounded-2xl bg-[#fdfbf7] p-8 md:grid-cols-[300px_1fr] md:px-[90px] md:py-[80px]">
                  <figcaption className="flex items-center gap-4">
                    {avatars[i] ? (
                      <Image src={avatars[i]} alt="" width={56} height={56} className="size-14 rounded-full object-cover" />
                    ) : (
                      <span className="flex size-14 items-center justify-center rounded-full bg-brand-100 font-semibold text-ink">
                        {quote.name
                          .split(" ")
                          .map((w) => w[0])
                          .slice(-2)
                          .join("")}
                      </span>
                    )}
                    <span className="flex flex-col">
                      <span className="text-lg font-semibold text-ink">{quote.name}</span>
                      <span className="text-sm text-dark-300">{quote.role}</span>
                    </span>
                  </figcaption>
                  <blockquote className="relative pl-12 text-xl leading-[1.7] text-ink md:text-[22px]">
                    <span aria-hidden className="absolute -top-8 left-0 font-script text-[80px] leading-none text-peanut">
                      “
                    </span>
                    {quote.text}
                  </blockquote>
                </figure>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </Reveal>

      <div className="mt-14 flex justify-center gap-2">
        {quotes.map((quote, i) => (
          <button
            key={quote.name}
            type="button"
            aria-label={t("goToSlide", { index: i + 1 })}
            aria-current={selected === i}
            onClick={() => api?.scrollTo(i)}
            className={cn(
              "h-2.5 cursor-pointer rounded-full border border-peanut transition-all duration-300",
              selected === i ? "w-6 bg-peanut" : "w-2.5 hover:bg-peanut/40",
            )}
          />
        ))}
      </div>
    </section>
  );
}
