"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export function SafeBanner() {
  const t = useTranslations("About");

  return (
    <section className="bg-peanut px-4 py-16 md:py-20">
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="text-center text-3xl leading-[1.4] font-semibold text-white md:text-5xl"
      >
        {t("bannerText")}{" "}
        <span className="relative inline-block font-script text-[1.1em] font-normal">
          {t("bannerScript")}
          {/* Nét gạch chân viết tay, tự vẽ khi cuộn tới */}
          <svg
            viewBox="0 0 260 34"
            fill="none"
            aria-hidden
            className="absolute top-full -right-6 -left-[30%] h-[0.6em] w-[calc(130%+1.5rem)]"
          >
            <motion.path
              d="M2 32C60 14 110 6 152 6c18 0-34 18-48 24 40-10 96-16 154-14"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.4, ease: "easeInOut" }}
            />
          </svg>
        </span>
      </motion.p>
    </section>
  );
}
