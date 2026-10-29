import Image from "next/image";
import { useTranslations } from "next-intl";
import { navLinks } from "@/lib/content";

export function SiteFooter() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Nav");
  const information = [
    { href: "#about", label: t("ourStory") },
    { href: "#large-orders", label: tNav("largeOrders") },
    { href: "#large-orders", label: t("contact") },
  ];
  const explore = navLinks.map((l) => ({ href: l.href, label: tNav(l.key) }));

  return (
    <footer>
      <div
        id="about"
        className="mx-auto grid max-w-[1728px] gap-10 border-t border-ink px-4 py-12 sm:px-8 lg:grid-cols-[minmax(0,716px)_1fr_1fr] lg:gap-16 2xl:gap-[89px] lg:p-[50px]"
      >
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-[28px]">
          <Image
            src="/images/logo-2510-vertical.png"
            alt="2510 Scented Candle"
            width={534}
            height={622}
            className="h-36 w-auto shrink-0 object-contain lg:h-[217px]"
          />
          <div className="flex flex-col gap-4">
            <h2 className="font-display text-[clamp(2rem,8.5vw,3rem)] leading-none tracking-tightish whitespace-nowrap uppercase lg:text-[clamp(2.5rem,3.4vw,4.375rem)]">{t("aboutTitle")}</h2>
            <p className="text-lg tracking-tightish lg:text-[22px]">
              {t("aboutText")}
            </p>
          </div>
        </div>

        <FooterColumn title={t("information")} links={information} />
        <FooterColumn title={t("explore")} links={explore} />
      </div>

      <div className="bg-ink py-2 text-center font-display text-xl tracking-tightish text-on-ink uppercase lg:text-[30px]">
        {t("rights", { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: readonly { href: string; label: string }[] }) {
  return (
    <nav aria-label={title} className="flex flex-col gap-4">
      <h2 className="font-display text-3xl tracking-tightish whitespace-nowrap uppercase lg:text-[clamp(1.75rem,2.2vw,2.5rem)]">{title}</h2>
      <ul className="flex flex-col gap-3">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="inline-block text-lg tracking-tightish transition-[translate,opacity] duration-300 hover:translate-x-1 hover:opacity-60 lg:text-[22px]">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
