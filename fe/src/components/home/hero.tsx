"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
  const t = useTranslations("Hero");
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  const headline: { text: string; tone?: "accent" | "script" }[] = [
    { text: t("always") },
    { text: t("accent"), tone: "accent" },
    { text: t("middle") },
    { text: t("script"), tone: "script" },
  ];

  // Tách thành từng chữ để chạy hiệu ứng stagger
  let index = 0;
  const words = headline.flatMap((part) =>
    part.text.split(" ").map((word) => ({ word, tone: part.tone, i: index++ })),
  );

  return (
    <section
      ref={ref}
      className="relative -mt-[72px] grid overflow-hidden lg:-mt-[131px] lg:min-h-[726px] lg:grid-cols-[593fr_847fr]"
    >
      {/* Ảnh bên trái */}
      <div className="relative order-2 h-[420px] bg-[#e5dcd3] lg:order-1 lg:h-auto">
        <div className="absolute inset-x-0 top-0 bottom-0 overflow-hidden lg:top-[131px]">
          <motion.div
            className="absolute inset-0"
            style={{ y: imageY }}
            initial={{ scale: 1.15, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.6, ease }}
          >
            <Image
              src="/brand/hero-2510-stone.png"
              alt={t("imageAlt")}
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover object-[60%_center]"
            />
          </motion.div>
          <div className="absolute inset-0 bg-[linear-gradient(0.44deg,rgba(229,220,211,0)_76.7%,#e5dcd3_96.8%)]" />
        </div>
      </div>

      {/* Nội dung bên phải */}
      <div className="order-1 bg-cream px-4 pt-[120px] pb-14 md:px-10 lg:order-2 lg:pt-[241px] lg:pr-20 lg:pl-[77px]">
        <div className="flex max-w-[690px] flex-col gap-10">
          <div className="flex flex-col gap-2">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="text-base tracking-caption text-dark-300 md:text-lg"
            >
              {t("tagline")}
            </motion.p>
            <h1 className="text-4xl leading-[1.2] font-semibold text-ink sm:text-5xl xl:text-[60px]">
              {words.map(({ word, tone, i }) => (
                <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
                  <motion.span
                    className={cn(
                      "inline-block",
                      tone === "accent" && "text-peanut",
                      tone === "script" && "font-script text-[1.07em] font-normal text-peanut",
                    )}
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.8, delay: 0.15 + i * 0.05, ease }}
                  >
                    {word}
                  </motion.span>
                  {" "}
                </span>
              ))}
            </h1>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9, ease }}
          >
            <Link
              href="/shop"
              className={cn(buttonVariants({ variant: "ink", size: "pill-lg" }), "uppercase")}
            >
              {t("cta")}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
