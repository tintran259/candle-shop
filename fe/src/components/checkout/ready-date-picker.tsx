"use client";

import { CalendarClockIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";
import { useToday } from "@/hooks/use-today";
import { deliveryDate, firstAvailable, formatDay, readyOptions } from "@/lib/production";
import type { ShopConfig } from "@/lib/shop-config";
import { cn } from "@/lib/utils";

// Chọn ngày nhận hàng: mỗi ô là 1 ngày xưởng hoàn thành + số ngày giao
export function ReadyDatePicker({
  config,
  quantity,
  shippingDays,
  value,
  onChange,
  highlight,
}: {
  config: ShopConfig;
  quantity: number;
  shippingDays: number;
  value: string | null;
  onChange: (date: string | null) => void;
  highlight?: boolean;
}) {
  const t = useTranslations("Checkout.schedule");
  const locale = useLocale();
  const now = useToday();
  const options = useMemo(
    () => (now ? readyOptions(config.production, quantity, now, 12) : []),
    [config, quantity, now],
  );
  const selectedValid = options.some((o) => o.date === value && o.available);

  // Chọn sẵn ngày sớm nhất; đổi số lượng làm ngày cũ hết chỗ thì chọn lại
  useEffect(() => {
    if (!now || selectedValid) return;
    const next = firstAvailable(options);
    if (next !== value) onChange(next);
  }, [now, selectedValid, options, value, onChange]);

  const { min, max } = config.production.leadTimeDays;

  return (
    <section>
      <h2 className="text-2xl font-semibold text-ink">{t("title")}</h2>
      <p className="mt-2 flex items-start gap-2 text-sm text-dark-300">
        <CalendarClockIcon className="mt-0.5 size-4 shrink-0 text-peanut" aria-hidden />
        {t("hint", { min, max, quantity })}
      </p>
      <div
        role="radiogroup"
        aria-label={t("title")}
        className={cn(
          "mt-5 flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]",
          highlight && "rounded-2xl ring-2 ring-rose ring-offset-4 ring-offset-cream",
        )}
      >
        {options.map((o) => {
          const active = o.date === value;
          const arrive = deliveryDate(o.date, shippingDays);
          return (
            <button
              key={o.date}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={!o.available}
              onClick={() => onChange(o.date)}
              className={cn(
                "flex min-w-[124px] shrink-0 snap-start cursor-pointer flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-left transition-colors",
                active
                  ? "border-ink bg-ink text-white"
                  : "border-brand-200 bg-white text-ink hover:border-peanut",
                "disabled:cursor-not-allowed disabled:border-brand-100 disabled:bg-brand-50/60 disabled:text-dark-50",
              )}
            >
              <span className="text-xs tracking-wide uppercase opacity-70">{t("arrive")}</span>
              <span className="text-lg font-semibold capitalize">{formatDay(arrive, locale)}</span>
              <span className={cn("text-xs", active ? "text-brand-50" : "text-dark-300")}>
                {o.available ? t("slots", { count: o.remaining }) : t("full")}
              </span>
            </button>
          );
        })}
      </div>
      {value && (
        <p className="mt-3 text-sm text-dark-300">
          {t("summary", {
            ready: formatDay(value, locale, { weekday: "long" }),
            arrive: formatDay(deliveryDate(value, shippingDays), locale, { weekday: "long" }),
          })}
        </p>
      )}
    </section>
  );
}
