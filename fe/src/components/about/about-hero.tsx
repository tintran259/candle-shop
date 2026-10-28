"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export function AboutHero() {
  const t = useTranslations("About");
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  // Ảnh hai bên trôi nhanh hơn ảnh giữa → tạo chiều sâu
  const sideY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const centerY = useTransform(scrollYProgress, [0, 1], [0, -30]);

  return (
    <section ref={ref} className="relative -mt-[72px] overflow-hidden pb-20 lg:-mt-[131px] lg:pb-[120px]">
      {/* Nền nâu phủ cả phần header, dừng ở giữa hàng ảnh */}
      <div className="absolute inset-x-0 top-0 h-[calc(100%-160px)] bg-peanut lg:h-[calc(100%-308px)]" />

      <div className="relative mx-auto grid max-w-[1440px] gap-8 px-4 pt-[120px] md:px-10 lg:grid-cols-[1fr_570px] lg:items-end lg:gap-20 lg:pt-[218px] xl:px-20">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease }}
          className="max-w-[600px] text-4xl leading-[1.25] font-semibold text-white md:text-5xl xl:text-[60px]"
        >
          {t("heroTitle")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease }}
          className="pb-2 text-lg leading-[1.8] text-white"
        >
          {t("heroText")}
        </motion.p>
      </div>

      <div className="relative mt-12 grid grid-cols-[1fr_1.8fr_1fr] items-center gap-3 md:gap-6 lg:mt-[60px] lg:gap-[42px]">
        <motion.div style={{ y: sideY }}>
          <HeroImage src="/figma/about/hero-left.jpg" alt={t("heroAlt.left")} ratio="aspect-[358/290]" delay={0.3} />
        </motion.div>
        <motion.div style={{ y: centerY }}>
          <HeroImage src="/figma/about/hero-center.jpg" alt={t("heroAlt.center")} ratio="aspect-[640/425]" delay={0.15} priority />
        </motion.div>
        <motion.div style={{ y: sideY }}>
          <HeroImage src="/figma/about/hero-right.jpg" alt={t("heroAlt.right")} ratio="aspect-[358/290]" delay={0.45} />
        </motion.div>
      </div>
    </section>
  );
}

function HeroImage({
  src,
  alt,
  ratio,
  delay,
  priority,
}: {
  src: string;
  alt: string;
  ratio: string;
  delay: number;
  priority?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay, ease }}
      className={`relative overflow-hidden ${ratio}`}
    >
      <Image src={src} alt={alt} fill priority={priority} sizes="(min-width: 1440px) 640px, 45vw" className="object-cover" />
    </motion.div>
  );
}
