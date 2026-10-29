"use client";

import { MenuIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "cn";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { navLinks } from "@/lib/content";
import { btnPaper } from "@/lib/ui";

export function SiteHeader() {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header className="sticky top-0 z-50">
      {/* Thanh đen: logo + ngôn ngữ + CTA */}
      <div
        className={cn(
          "bg-ink text-on-ink transition-[height] duration-300",
          scrolled ? "h-16 lg:h-20" : "h-16 lg:h-[110px]",
        )}
      >
        <div className="mx-auto flex h-full max-w-[1728px] items-center justify-between gap-6 px-4 sm:px-8 lg:px-[50px]">
          <a href="#top" className="flex h-full items-center" aria-label={t("home")}>
            {/* Logo gốc 2510, bản sáng cho nền đen */}
            <Image
              src="/images/logo-2510-vertical-light.png"
              alt="2510 Scented Candle"
              width={534}
              height={622}
              priority
              className={cn(
                "w-auto object-contain transition-[height] duration-300",
                scrolled ? "h-14 lg:h-[72px]" : "h-14 lg:h-[100px]",
              )}
            />
          </a>

          <div className="flex items-center gap-3 sm:gap-4">
            <LocaleSwitcher />
            <a href="#best-sellers" className={cn(btnPaper, "hidden h-11 px-8 text-2xl sm:inline-flex")}>
              {t("shopNow")}
            </a>
            <button
              type="button"
              className="flex size-11 cursor-pointer items-center justify-center lg:hidden"
              aria-label={open ? t("closeMenu") : t("openMenu")}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <XIcon className="size-7" /> : <MenuIcon className="size-7" />}
            </button>
          </div>
        </div>
      </div>

      {/* Hàng menu trắng — điều hướng trong trang */}
      <nav aria-label={t("sections")} className="hidden h-[72px] border-b border-ink bg-paper lg:block">
        <ul className="flex h-full items-center justify-center gap-[50px]">
          {navLinks.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="relative text-lg text-ink after:absolute after:-bottom-1 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-ink after:transition-transform after:duration-500 after:ease-[cubic-bezier(0.22,1,0.36,1)] hover:after:origin-left hover:after:scale-x-100"
              >
                {t(l.key)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-nav"
            aria-label={t("sections")}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-x-0 top-16 h-[calc(100dvh-4rem)] border-t border-on-ink/10 bg-ink px-4 pt-6 pb-10 text-on-ink sm:px-8 lg:hidden"
          >
            <ul className="flex flex-col">
              {navLinks.map((l) => (
                <li key={l.href} className="border-b border-on-ink/15">
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block py-5 font-display text-4xl uppercase transition-[padding] duration-300 hover:pl-2"
                  >
                    {t(l.key)}
                  </a>
                </li>
              ))}
            </ul>
            <a href="#best-sellers" onClick={() => setOpen(false)} className={cn(btnPaper, "mt-10 h-16 w-full text-3xl")}>
              {t("shopNow")}
            </a>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
