"use client";

import { XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Slider } from "@/components/ui/slider";
import type { GroupProps } from "@/components/customizer/use-option-meta";
import { findById, fragranceShares } from "@/lib/customizer/options";
import { pick } from "@/lib/shop-config";

// Điều chỉnh tỉ lệ khi phối nhiều mùi
export function FragranceBlend({ customizer, catalog }: GroupProps) {
  const t = useTranslations("Customizer.blend");
  const locale = useLocale();
  const shares = fragranceShares(customizer.config.fragrances);

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-linen bg-cream-light p-4">
      <p className="text-sm font-semibold text-bark">{t("title")}</p>
      <div className="flex h-2.5 overflow-hidden rounded-full" aria-hidden>
        {shares.map((s) => (
          <span
            key={s.id}
            className="h-full transition-[width] duration-300"
            style={{ width: `${s.percent}%`, background: findById(catalog.fragrances, s.id)?.swatch }}
          />
        ))}
      </div>
      {shares.map((s) => {
        const option = findById(catalog.fragrances, s.id);
        if (!option) return null;
        const name = pick(option.name, locale);
        return (
          <div key={s.id} className="flex items-center gap-3">
            <span className="w-28 shrink-0 text-sm text-bark">{name}</span>
            <Slider
              aria-label={t("ratioFor", { name })}
              min={10}
              max={100}
              step={5}
              value={[s.weight]}
              onValueChange={(v) => customizer.setFragranceWeight(s.id, Array.isArray(v) ? v[0] : v)}
              className="flex-1"
            />
            <span className="w-10 text-right text-sm font-semibold text-bark tabular-nums">{s.percent}%</span>
            <button
              type="button"
              aria-label={t("remove", { name })}
              onClick={() => customizer.toggleFragrance(s.id)}
              className="cursor-pointer text-dark-300 transition-colors hover:text-rose"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
