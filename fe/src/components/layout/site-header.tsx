"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { MenuIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import { navLinks } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { selectCount, useCartStore } from "@/stores/cart-store";
import { useSearchStore } from "@/stores/search-store";
import { AccountMenu, initials, useLogout } from "@/components/layout/account-menu";

export function SiteHeader() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 40));

  return (
    <header
      className={cn(
        "sticky top-0 z-50 text-ink h-[72px] transition-[background-color,box-shadow,backdrop-filter] duration-300 lg:h-[131px]",
        scrolled && "bg-cream/85 shadow-[0_1px_0_var(--color-brand-100)] backdrop-blur-md",
      )}
    >
      <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-4 md:px-10 xl:px-20">
        {/* Trái: menu */}
        <nav className="flex items-center">
          <MobileMenu />
          <ul className="hidden items-center gap-5 lg:flex xl:gap-8">
            {navLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn("group relative text-lg whitespace-nowrap uppercase xl:text-xl", active && "font-semibold")}
                  >
                    {t(link.key)}
                    {active ? (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute -bottom-2.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-current"
                      />
                    ) : (
                      <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-300 group-hover:scale-x-100" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Giữa: logo */}
        <Link href="/" aria-label={t("home")}>
          <Image
            src="/brand/logo-2510-vertical.png"
            alt="2510 Scented Candle"
            width={534}
            height={622}
            priority
            className="h-16 w-auto lg:h-[115px]"
          />
        </Link>

        {/* Phải: icon */}
        <div className="flex items-center justify-end gap-5 lg:gap-8">
          <SearchButton label={t("search")} />
          {!user && (
            <IconLink label={t("account")} href="/login" icon="/figma/user.svg" className="hidden sm:inline-flex" />
          )}
          <CartButton />
          <LocaleSwitcher className="hidden sm:flex" />
          {user ? (
            <div className="hidden sm:block">
              <AccountMenu user={user} />
            </div>
          ) : (
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline-ink", size: "pill" }),
                "hidden min-w-[115px] xl:inline-flex",
              )}
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function IconLink({
  label,
  href,
  icon,
  className,
}: {
  label: string;
  href: string;
  icon: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn("inline-flex transition-transform hover:scale-110", className)}
    >
      <Image src={icon} alt="" width={24} height={24} />
    </Link>
  );
}

function SearchButton({ label }: { label: string }) {
  const setOpen = useSearchStore((s) => s.setOpen);
  return (
    <button
      type="button"
      aria-label={label}
      aria-keyshortcuts="Meta+K Control+K"
      onClick={() => setOpen(true)}
      className="inline-flex cursor-pointer transition-transform hover:scale-110"
    >
      <Image src="/figma/search.svg" alt="" width={24} height={24} />
    </button>
  );
}

function CartButton() {
  const t = useTranslations("Cart");
  const count = useCartStore(selectCount);
  const setOpen = useCartStore((s) => s.setOpen);

  return (
    <button
      type="button"
      aria-label={t("label", { count })}
      onClick={() => setOpen(true)}
      className="relative inline-flex cursor-pointer transition-transform hover:scale-110"
    >
      <Image src="/figma/bag.svg" alt="" width={24} height={24} />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="absolute -top-2 -right-2 flex size-[18px] items-center justify-center rounded-full bg-rose text-[11px] leading-none text-white"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function MobileMenu() {
  const t = useTranslations("Nav");
  const tAccount = useTranslations("Auth.account");
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [open, setOpen] = useState(false);

  // Đóng menu khi chuyển sang desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        aria-label={t("openMenu")}
        className="inline-flex cursor-pointer lg:hidden"
      >
        <MenuIcon className="size-6" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] bg-cream p-8">
        <SheetTitle className="sr-only">{t("menu")}</SheetTitle>
        <Image
          src="/brand/logo-2510-vertical.png"
          alt="2510 Scented Candle"
          width={534}
          height={622}
          className="h-24 w-auto self-start object-contain"
        />
        <ul className="mt-10 flex flex-col gap-6">
          {navLinks.map((link, i) => (
            <motion.li
              key={link.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
            >
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-2xl uppercase text-ink"
              >
                {t(link.key)}
              </Link>
            </motion.li>
          ))}
        </ul>
        {user ? (
          <div className="mt-10 flex flex-col gap-4 border-t border-brand-200 pt-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-peanut text-sm font-semibold text-white">
                {initials(user.name)}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-semibold text-ink">{user.name}</span>
                <span className="truncate text-xs text-dark-300">{user.email}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className={cn(buttonVariants({ variant: "outline-ink", size: "pill" }), "w-full")}
            >
              {tAccount("logout")}
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className={cn(buttonVariants({ variant: "outline-ink", size: "pill" }), "mt-10 w-full")}
          >
            {t("login")}
          </Link>
        )}
        <LocaleSwitcher className="mt-4 self-start" />
      </SheetContent>
    </Sheet>
  );
}
