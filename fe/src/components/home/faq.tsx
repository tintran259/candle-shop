"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqGroupIds, type FaqItem } from "@/lib/data";
import { cn } from "@/lib/utils";

type GroupId = (typeof faqGroupIds)[number];

export function Faq() {
  const t = useTranslations("Faq");
  const [groupId, setGroupId] = useState<GroupId>(faqGroupIds[0]);
  const items = t.raw(`groups.${groupId}.items`) as FaqItem[];

  return (
    <section className="bg-cream" id="faq">
      <div className="mx-auto max-w-[1440px] px-4 pt-20 pb-24 md:px-10 lg:pb-36 xl:px-20">
        <Reveal>
          <h2 className="text-[32px] leading-[1.4] font-semibold text-ink">{t("title")}</h2>
        </Reveal>

        <div className="mt-10 flex flex-col justify-between gap-10 lg:flex-row">
          {/* Danh mục */}
          <div className="flex gap-3 overflow-x-auto lg:flex-col lg:gap-4" role="tablist">
            {faqGroupIds.map((id) => {
              const active = id === groupId;
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setGroupId(id)}
                  className={cn(
                    "relative shrink-0 cursor-pointer rounded-2xl border px-6 py-4 text-left text-lg leading-[1.6] font-semibold transition-colors lg:w-[360px] lg:px-10 lg:py-6 lg:text-2xl",
                    active
                      ? "border-brand-50 text-white"
                      : "border-brand-100 text-dark-500 hover:border-peanut",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="faq-tab"
                      className="absolute inset-0 -z-0 rounded-2xl bg-ink"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{t(`groups.${id}.label`)}</span>
                </button>
              );
            })}
          </div>

          {/* Câu hỏi */}
          <AnimatePresence mode="wait">
            <motion.div
              key={groupId}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="w-full lg:max-w-[760px]"
            >
              <Accordion defaultValue={[0]} className="gap-8">
                {items.map((item, i) => (
                  <AccordionItem
                    key={item.q}
                    value={i}
                    className="border-b border-brand-200 pb-6 not-last:border-b"
                  >
                    <AccordionTrigger className="group/faq items-start gap-6 rounded-none p-0 text-xl leading-[1.4] font-medium text-ink hover:no-underline md:text-[28px] [&>[data-slot=accordion-trigger-icon]]:hidden!">
                      <span className="max-w-[516px]">{item.q}</span>
                      <span className="relative mt-1 size-8 shrink-0">
                        <Image
                          src="/figma/plus.svg"
                          alt=""
                          width={32}
                          height={32}
                          className="absolute inset-0 transition-all duration-300 group-aria-expanded/faq:rotate-90 group-aria-expanded/faq:opacity-0"
                        />
                        <Image
                          src="/figma/minus.svg"
                          alt=""
                          width={32}
                          height={32}
                          className="absolute inset-0 -rotate-90 opacity-0 transition-all duration-300 group-aria-expanded/faq:rotate-0 group-aria-expanded/faq:opacity-100"
                        />
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="max-w-[505px] pt-4 text-lg leading-[1.6] text-dark-300 md:text-xl">
                        {item.a}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
