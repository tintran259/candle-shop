"use client";

import { ArrowUpIcon } from "lucide-react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { btnInk } from "@/lib/ui";

// Nút lên đầu trang: hiện sau khi cuộn qua hero, viền chạy theo tiến độ cuộn
export function BackToTop() {
  const t = useTranslations("Nav");
  const { scrollY, scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setVisible(y > 600));

  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={toTop}
          aria-label={t("backToTop")}
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.9 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            btnInk,
            "group fixed right-4 bottom-4 z-40 size-12 shadow-float sm:right-8 sm:bottom-8 lg:size-14",
          )}
        >
          <svg aria-hidden viewBox="0 0 56 56" className="pointer-events-none absolute inset-0 size-full" fill="none">
            <motion.rect
              x="1.5"
              y="1.5"
              width="53"
              height="53"
              stroke="var(--accent)"
              strokeWidth="3"
              style={{ pathLength: scrollYProgress }}
            />
          </svg>
          <ArrowUpIcon
            aria-hidden
            className="size-5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 lg:size-6"
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
