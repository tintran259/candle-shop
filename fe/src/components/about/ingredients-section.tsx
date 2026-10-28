import { useTranslations } from "next-intl";
import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";

export function IngredientsSection() {
  const t = useTranslations("About");

  const blocks = [
    { title: t("plantTitle"), text: t("plantText") },
    { title: t("parfumeTitle"), text: t("parfumeText") },
  ];

  return (
    <section className="mx-auto grid max-w-[1440px] items-center gap-12 px-4 py-10 md:grid-cols-2 md:px-10 lg:pb-20 xl:px-20">
      <Reveal className="relative w-full max-w-[626px] pb-12 md:pl-[109px]">
        <div className="relative aspect-square overflow-hidden">
          <Image
            src="/figma/feature-leaves.jpg"
            alt={t("ingredientsAlt")}
            fill
            sizes="(min-width: 768px) 517px, 100vw"
            className="object-cover object-[center_30%]"
          />
        </div>
        <div className="absolute bottom-0 left-0 flex h-[136px] items-center gap-3 rounded-2xl bg-[#fdfbf7] px-10 shadow-[0_10px_40px_rgba(12,13,18,0.06)]">
          <span className="text-3xl font-semibold text-ink md:text-[40px]">{t("ingredientsBadge")}</span>
          <span className="text-3xl md:text-[40px]" aria-hidden>
            🌱
          </span>
        </div>
      </Reveal>

      <div className="flex flex-col gap-14 md:pl-10 lg:pl-20">
        {blocks.map((block, i) => (
          <Reveal key={block.title} delay={0.1 + i * 0.1} className="flex flex-col gap-4">
            <h3 className="text-[26px] font-semibold text-ink">{block.title}</h3>
            <p className="max-w-[480px] text-lg leading-[1.8] text-dark-300">{block.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
