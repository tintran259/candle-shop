"use client";

import { HandHeartIcon, SparklesIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useShopConfig } from "@/hooks/use-shop-config";
import { useToday } from "@/hooks/use-today";
import { Link } from "@/i18n/navigation";
import { shippingMethods } from "@/lib/checkout";
import { deliveryDate, firstAvailable, formatDay, readyOptions } from "@/lib/production";
import { cn } from "@/lib/utils";

// Nến làm theo đơn: báo thời gian làm + ngày nhận sớm nhất, gợi ý tự phối ở trang Thủ công
export function MadeToOrderNote({ className }: { className?: string }) {
  const t = useTranslations("MadeToOrder");
  const locale = useLocale();
  const { data } = useShopConfig();
  const now = useToday();

  const ready = data && now ? firstAvailable(readyOptions(data.production, 1, now, 10)) : null;
  const standardDays = shippingMethods.find((m) => m.id === "standard")!.days;

  return (
    <div className={cn("rounded-2xl border border-brand-100 bg-cream-light p-5", className)}>
      <p className="flex items-center gap-2 text-base font-semibold text-ink">
        <HandHeartIcon className="size-5 text-peanut" aria-hidden />
        {data
          ? t("badge", { min: data.production.leadTimeDays.min, max: data.production.leadTimeDays.max })
          : t("badgeShort")}
      </p>
      <p className="mt-2 min-h-5 text-sm text-dark-300">
        {ready && t("earliest", { date: formatDay(deliveryDate(ready, standardDays), locale, { weekday: "long" }) })}
      </p>
      <Link
        href="/craft"
        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-ink underline decoration-peanut underline-offset-4 transition-colors hover:text-peanut"
      >
        <SparklesIcon className="size-4" aria-hidden />
        {t("craftCta")}
      </Link>
    </div>
  );
}
