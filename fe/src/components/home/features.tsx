"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef } from "react";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/** Ảnh có hiệu ứng parallax nhẹ bên trong khung cắt */
function ParallaxImage({
  src,
  alt,
  className,
  imageClassName,
  overlay,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  overlay?: string;
  sizes: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <motion.div className="absolute -inset-y-[10%] inset-x-0" style={{ y }}>
        <Image src={src} alt={alt} fill sizes={sizes} className={cn("object-cover", imageClassName)} />
      </motion.div>
      {overlay && <div className="absolute inset-0" style={{ background: overlay }} />}
    </div>
  );
}

function FeatureText({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal className="flex flex-col gap-4 leading-[1.4] text-ink">
      <h3 className="text-3xl font-bold md:text-[40px]">{title}</h3>
      <p className="text-2xl md:text-[32px]">{children}</p>
    </Reveal>
  );
}

export function Features() {
  const t = useTranslations("Features");
  return (
    <section className="bg-blush">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-20 px-4 py-20 md:px-10 xl:px-20">
        {/* Ảnh lớn + câu giới thiệu */}
        <div className="flex flex-col gap-10">
          <Reveal>
            <ParallaxImage
              src="/figma/feature-leaves.jpg"
              alt="Dried autumn leaves and candles"
              className="h-[320px] md:h-[566px]"
              imageClassName="object-[center_30%]"
              overlay="rgba(201,164,137,0.3)"
              sizes="(min-width: 1440px) 1280px, 100vw"
            />
          </Reveal>
          <Reveal>
            <p className="max-w-[625px] text-2xl leading-[1.4] text-ink md:text-[32px]">
              {t("intro")}
            </p>
          </Reveal>
        </div>

        {/* Hàng 1: Diffuser | Durable */}
        <div className="grid gap-10 md:grid-cols-[626fr_614fr]">
          <Reveal>
            <ParallaxImage
              src="/figma/feature-diffuser.jpg"
              alt="Reed diffuser and candle on a book"
              className="h-[480px] md:h-[693px]"
              sizes="(min-width: 1440px) 626px, (min-width: 768px) 50vw, 100vw"
            />
          </Reveal>
          <div className="flex flex-col gap-10">
            <Reveal delay={0.1}>
              <ParallaxImage
                src="/figma/feature-durable.png"
                alt="Candle in a wooden holder"
                className="h-[300px] md:h-[406px]"
                imageClassName="object-top"
                sizes="(min-width: 1440px) 614px, (min-width: 768px) 50vw, 100vw"
              />
            </Reveal>
            <FeatureText title={t("durableTitle")}>{t("durableText")}</FeatureText>
          </div>
        </div>

        {/* Hàng 2: Calm | Woman */}
        <div className="grid gap-10 md:grid-cols-[626fr_614fr]">
          <div className="flex flex-col gap-10">
            <Reveal>
              <ParallaxImage
                src="/figma/feature-calm.png"
                alt="Meditating next to a candle"
                className="h-[300px] md:h-[406px]"
                sizes="(min-width: 1440px) 626px, (min-width: 768px) 50vw, 100vw"
              />
            </Reveal>
            <FeatureText title={t("calmTitle")}>{t("calmText")}</FeatureText>
          </div>
          <Reveal delay={0.1}>
            <ParallaxImage
              src="/figma/feature-woman.jpg"
              alt="Woman enjoying the candle scent"
              className="h-[480px] md:h-[693px]"
              overlay="rgba(201,164,137,0.1)"
              sizes="(min-width: 1440px) 614px, (min-width: 768px) 50vw, 100vw"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
