"use client";

import { PlayIcon } from "lucide-react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Reveal } from "@/components/motion/reveal";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

// Đặt URL video (mp4) khi có; để null thì nút play chỉ báo "sắp ra mắt"
const VIDEO_SRC: string | null = null;

export function HowToVideo() {
  const t = useTranslations("About");
  const [open, setOpen] = useState(false);

  const play = () => (VIDEO_SRC ? setOpen(true) : toast.info(t("videoSoon")));

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-10 md:px-10 lg:py-20 xl:px-20">
      <Reveal className="group relative aspect-[4/5] overflow-hidden sm:aspect-[1280/541]">
        <Image
          src="/figma/about/video-poster-clean.jpg"
          alt={t("videoAlt")}
          fill
          sizes="(min-width: 1440px) 1280px, 100vw"
          className="object-cover object-top transition-transform duration-[1.5s] ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,13,18,0)_35%,rgba(12,13,18,0.55)_100%)]" />

        <button
          type="button"
          onClick={play}
          aria-label={t("playVideo")}
          className="absolute top-1/2 left-1/2 flex size-[100px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center"
        >
          <motion.span
            className="absolute inset-0 rounded-full border-4 border-white/40"
            animate={{ scale: [1, 1.25], opacity: [0.8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
          <span className="flex size-[88px] items-center justify-center rounded-full border-4 border-white/50 bg-ink/60 backdrop-blur-sm transition-transform group-hover:scale-110">
            <PlayIcon className="ml-1 size-9 fill-white text-white" />
          </span>
        </button>

        <div className="absolute inset-x-6 bottom-8 text-white md:inset-x-14 md:bottom-12">
          <p className="text-base tracking-[0.06em] text-brand-50 md:text-lg">{t("howToUse")}</p>
          <p className="mt-3 text-xl leading-[1.4] font-semibold md:text-[32px]">
            {t("videoLine1")}
            <br />
            {t("videoLine2")}
          </p>
        </div>
      </Reveal>

      {VIDEO_SRC && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[min(92vw,1100px)] bg-ink p-0 sm:max-w-[min(92vw,1100px)]">
            <DialogTitle className="sr-only">{t("howToUse")}</DialogTitle>
            <video src={VIDEO_SRC} controls autoPlay className="aspect-video w-full rounded-lg" />
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}
