import { useTranslations } from "next-intl";
import Image from "next/image";
import { NewsletterDialog } from "@/components/layout/newsletter-dialog";
import { Link } from "@/i18n/navigation";
import { footerLinks, socialLinks } from "@/lib/data";

const linkClass = "transition-colors hover:text-peanut";

export function SiteFooter() {
  const t = useTranslations("Footer");

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-[1440px] px-4 pt-14 pb-14 md:px-10 xl:px-20">
        <div className="flex flex-col justify-between gap-12 lg:flex-row">
          <div className="flex flex-col gap-10 sm:flex-row sm:gap-20">
            <Image
              src="/brand/logo-2510-vertical-light.png"
              alt="2510 Scented Candle"
              width={534}
              height={622}
              className="h-28 w-auto self-start"
            />
            <div className="flex gap-20">
              <ul className="flex flex-col gap-3 text-lg uppercase">
                {footerLinks.map((link) => (
                  <li key={link.key}>
                    <Link href={link.href} className={linkClass}>
                      {t(`links.${link.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="flex flex-col gap-3 text-lg uppercase">
                {socialLinks.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} target="_blank" rel="noreferrer" className={linkClass}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-start gap-4">
            <p className="text-2xl leading-[1.6] font-semibold">
              {t("newsletterLine1")}
              <br />
              {t("newsletterLine2")}
            </p>
            <NewsletterDialog />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-dark-300 pt-4 text-sm text-brand-50 sm:flex-row sm:justify-between">
          <p>{t("copyright", { year: 2022 })}</p>
          <p>
            {t("designBy")} <span className="text-white">TeamUp Agency</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
