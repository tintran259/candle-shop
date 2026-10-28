"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function FragranceRoom() {
  const t = useTranslations("Fragrance");
  const ref = useRef<HTMLElement>(null);

  // Đồng bộ ScrollTrigger với Lenis smooth scroll
  useLenis(ScrollTrigger.update);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        });
        tl.fromTo(
          "[data-title]",
          { letterSpacing: "0.2em", opacity: 0.4 },
          { letterSpacing: "0.03em", opacity: 1, ease: "none", duration: 0.5 },
          0,
        )
          .fromTo(
            "[data-jar]",
            { yPercent: 6, rotate: -6, scale: 0.95 },
            { yPercent: -12, rotate: 4, scale: 1.05, ease: "none", duration: 1 },
            0,
          );
      });
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      className="relative h-[560px] overflow-hidden bg-brand-500 md:h-[800px] xl:h-[1024px]"
    >
      <div className="absolute inset-0 bg-[linear-gradient(-1.34deg,#7a6457_3.46%,rgba(170,155,147,0)_42.69%)]" />

      <h2
        data-title
        className="absolute inset-x-0 top-[18%] text-center text-5xl leading-[1.4] font-bold whitespace-nowrap text-white md:top-[20%] md:text-8xl xl:text-[128px]"
      >
        {t("title")}
      </h2>

      <div
        data-jar
        className="absolute top-[4%] left-1/2 aspect-square w-[90vw] max-w-[800px] -translate-x-1/2"
      >
        <Image
          src="/figma/fragrance-jar.png"
          alt={t("imageAlt")}
          fill
          sizes="(min-width: 900px) 800px, 90vw"
          className="scale-[1.6] object-contain"
        />
      </div>

      <Link
        href="/shop"
        className={cn(
          buttonVariants({ variant: "ink", size: "pill-lg" }),
          "absolute bottom-10 left-1/2 w-[240px] -translate-x-1/2 md:bottom-[80px] md:w-[289px]",
        )}
      >
        {t("cta")}
      </Link>
    </section>
  );
}
