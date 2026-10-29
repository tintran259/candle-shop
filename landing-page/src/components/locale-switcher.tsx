"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { cn } from "@/lib/cn";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

// Nút đổi VI / EN, giữ nguyên vị trí cuộn
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
      className={cn("flex items-center border border-on-ink/60 p-0.5 text-sm", isPending && "opacity-60", className)}
    >
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => change(l)}
          aria-pressed={l === locale}
          className={cn(
            "h-8 min-w-10 cursor-pointer px-2 uppercase transition-colors duration-300",
            l === locale ? "bg-on-ink text-ink" : "text-on-ink/80 hover:bg-on-ink/15 hover:text-on-ink",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
