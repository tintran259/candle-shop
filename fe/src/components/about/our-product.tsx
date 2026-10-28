"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRef } from "react";
import { Reveal } from "@/components/motion/reveal";

const left = ["nature", "premium"] as const;
const right = ["unique", "economical"] as const;

function Value({ id, delay }: { id: (typeof left)[number] | (typeof right)[number]; delay: number }) {
  const t = useTranslations("About");
  return (
    <Reveal delay={delay} className="flex flex-col gap-4">
      <h3 className="text-[26px] font-semibold text-ink">{t(`values.${id}.title`)}</h3>
      <p className="text-lg leading-[1.8] text-dark-300">{t(`values.${id}.text`)}</p>
    </Reveal>
  );
}

export function OurProduct() {
  const t = useTranslations("About");
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const jarY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const jarRotate = useTransform(scrollYProgress, [0, 1], [-4, 4]);

  return (
    <section ref={ref} className="mx-auto max-w-[1440px] px-4 py-10 md:px-10 lg:pb-20 xl:px-20">
      <Reveal>
        <h2 className="text-2xl font-bold tracking-[0.06em] text-ink">{t("ourProduct")}</h2>
      </Reveal>
      <div className="mt-12 grid items-center gap-12 md:grid-cols-2 lg:mt-[100px] lg:grid-cols-[330px_1fr_330px] lg:gap-10">
        <div className="flex flex-col gap-14">
          {left.map((id, i) => (
            <Value key={id} id={id} delay={i * 0.1} />
          ))}
        </div>
        <motion.div
          style={{ y: jarY, rotate: jarRotate }}
          className="relative mx-auto aspect-[303/544] w-[220px] md:order-last md:col-span-2 lg:order-none lg:col-span-1 lg:w-[303px]"
        >
          <Image src="/figma/about/jar.png" alt={t("jarAlt")} fill sizes="303px" className="object-contain" />
        </motion.div>
        <div className="flex flex-col gap-14">
          {right.map((id, i) => (
            <Value key={id} id={id} delay={0.2 + i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}
