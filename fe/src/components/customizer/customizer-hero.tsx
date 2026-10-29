import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { LeafIcon } from "lucide-react";

// Banner đầu trang Thủ công — chữ bên trái, ảnh nến bên phải (server component)
export async function CustomizerHero() {
  const t = await getTranslations("Customizer");
  return (
    <section className="relative overflow-hidden bg-[#efe7dc]">
      <div className="mx-auto grid max-w-[1440px] md:min-h-[320px] md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="relative z-10 flex flex-col justify-center px-4 py-10 md:py-14 md:pl-10 xl:pl-20">
          <p className="text-xs tracking-[0.24em] text-umber uppercase">{t("eyebrow")}</p>
          <h1 className="mt-3 text-[36px] leading-tight font-semibold text-bark md:text-[52px]">{t("title")}</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-bark/80">{t("intro")}</p>
          <LeafIcon className="mt-5 size-6 text-umber" aria-hidden />
        </div>
        <div className="relative h-56 md:h-auto">
          <Image
            src="/brand/hero-2510-stone.png"
            alt={t("heroAlt")}
            fill
            priority
            sizes="(min-width: 768px) 55vw, 100vw"
            className="object-cover object-[42%_55%]"
          />
          {/* Viền mờ nối ảnh với nền chữ */}
          <div className="absolute inset-y-0 left-0 hidden w-28 bg-gradient-to-r from-[#efe7dc] to-transparent md:block" />
        </div>
      </div>
    </section>
  );
}
