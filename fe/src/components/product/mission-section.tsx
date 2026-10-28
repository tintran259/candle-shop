import { useTranslations } from "next-intl";
import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";

export function MissionSection() {
  const t = useTranslations("ProductDetail");

  return (
    <section className="mx-auto grid max-w-[1440px] items-center gap-12 px-4 py-20 md:grid-cols-2 md:px-10 lg:py-14 xl:px-20">
      <Reveal className="flex flex-col gap-6">
        <p className="text-lg tracking-caption text-dark-300">{t("missionEyebrow")}</p>
        <p className="max-w-[460px] text-3xl leading-[1.4] text-ink md:text-[40px]">
          {t("missionText")}
        </p>
      </Reveal>

      <Reveal delay={0.1} className="relative ml-auto w-full max-w-[517px] pb-16">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src="/figma/feature-leaves.jpg"
            alt={t("missionImageAlt")}
            fill
            sizes="(min-width: 768px) 517px, 100vw"
            className="object-cover object-[center_30%]"
          />
        </div>
        <div className="absolute bottom-0 left-0 flex h-[136px] items-center gap-3 rounded-2xl bg-[#fdfbf7] px-10 shadow-[0_10px_40px_rgba(12,13,18,0.06)] md:-left-[138px]">
          <span className="text-3xl font-semibold text-ink md:text-[40px]">{t("missionBadge")}</span>
          <span className="text-3xl md:text-[40px]" aria-hidden>
            🌱
          </span>
        </div>
      </Reveal>
    </section>
  );
}
