"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const change = (next: Locale) => {
    if (next === locale) return;
    startTransition(() => router.replace(pathname, { locale: next, scroll: false }));
  };

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn(
        "relative flex items-center rounded-full border border-ink p-0.5 text-sm group-data-[tone=light]/header:border-white",
        isPending && "opacity-60",
        className,
      )}
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => change(l)}
          aria-pressed={l === locale}
          className={cn(
            "cursor-pointer rounded-full px-2.5 py-1 uppercase transition-colors",
            l === locale
              ? "bg-ink text-white group-data-[tone=light]/header:bg-white group-data-[tone=light]/header:text-ink"
              : "text-ink hover:text-peanut group-data-[tone=light]/header:text-white",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
