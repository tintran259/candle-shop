import Image from "next/image";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/reveal";
import { benefits } from "@/lib/content";

export function Benefits() {
  const t = useTranslations("Benefits");
  return (
    <section aria-label={t("label")} className="border-y border-ink/10 bg-band">
      <ul className="mx-auto grid max-w-[1728px] gap-2 px-4 py-10 sm:grid-cols-3 sm:px-8 lg:gap-[85px] lg:px-[50px] lg:py-16 2xl:px-[127px]">
        {benefits.map((b, i) => (
          <li key={b.key}>
            <Reveal delay={i * 0.1} className="flex flex-col items-center gap-4 p-4 text-center lg:gap-5 lg:p-[30px]">
              <Image src={b.icon} alt="" width={80} height={80} className="size-14 lg:size-20" />
              <h2 className="font-display text-2xl tracking-tightish uppercase lg:text-[clamp(1.5rem,1.9vw,1.875rem)]">{t(`${b.key}.title`)}</h2>
              <p className="max-w-[296px] text-sm tracking-tightish uppercase lg:text-lg">{t(`${b.key}.text`)}</p>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
