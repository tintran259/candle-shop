"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { btnPaper } from "@/lib/ui";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const t = useTranslations("Hero");
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  return (
    <section ref={ref} id="top" className="overflow-hidden">
      <div className="mx-auto grid max-w-[1728px] gap-10 px-4 pt-10 pb-16 sm:px-8 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-0 lg:px-[50px] lg:pt-0 lg:pb-2 2xl:px-[127px]">
        {/* Cột chữ */}
        <div className="flex flex-col justify-center lg:pt-[120px] lg:pb-[120px]">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease }}
            className="font-display text-display-xl leading-[0.95] tracking-tightish uppercase sm:text-[clamp(3.25rem,7.5vw,6.94rem)] [:lang(vi)_&]:text-[2.125rem] [:lang(vi)_&]:leading-[1.12] sm:[:lang(vi)_&]:text-[clamp(2.4rem,5.6vw,5.5rem)] sm:[:lang(vi)_&]:leading-[1.08]"
          >
            <span className="mb-4 block font-sans text-caption font-normal tracking-[0.16em] sm:text-sm sm:tracking-[0.24em] text-ink-text normal-case lg:mb-7 lg:text-base [:lang(vi)_&]:leading-normal">
              {t("eyebrow")}
            </span>
            {t("line1")}
            <br />
            {t("line2")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.15 }}
            className="mt-5 max-w-[620px] text-body text-ink-text tracking-tightish sm:text-lg lg:text-[21px]"
          >
            {t("text")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease, delay: 0.3 }}
            className="relative z-10 mt-10 lg:mt-16 lg:ml-auto lg:w-[min(690px,100%)] lg:translate-x-[62px]"
          >
            <a
              href="#collection"
              className={cn(
                btnPaper,
                "h-16 w-full border border-ink text-display-md shadow-float sm:h-24 sm:text-4xl lg:h-[167px] lg:border-0 lg:text-[60px] lg:shadow-float-lg",
              )}
            >
              {t("cta")}
            </a>
          </motion.div>

          <motion.a
            href="#large-orders"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-8 self-start text-base text-ink-text underline decoration-ink/30 underline-offset-[6px] transition-colors hover:decoration-ink lg:mt-12"
          >
            {t("event")}
          </motion.a>
        </div>

        {/* Ảnh hero */}
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease }}
          className="relative aspect-[560/700] w-full overflow-hidden lg:aspect-[560/1017]"
        >
          <motion.div style={{ y: imageY }} className="absolute inset-[-6%_0]">
            <Image
              src="/images/hero-candle.jpg"
              alt={t("imageAlt")}
              fill
              priority
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
