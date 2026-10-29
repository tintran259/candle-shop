"use client";

import { useTranslations } from "next-intl";
import { CustomizerSection, SubHeading } from "@/components/customizer/customizer-section";
import { FragranceBlend } from "@/components/customizer/fragrance-blend";
import { IssueMessage } from "@/components/customizer/issue-message";
import { OptionCard } from "@/components/customizer/option-card";
import { useOptionMeta, type GroupProps } from "@/components/customizer/use-option-meta";
import { isUnscented } from "@/lib/customizer/options";
import { intensities } from "@/lib/customizer/types";
import { issuesFor } from "@/lib/customizer/validation";

// Nhóm 3: mùi hương (phối tối đa N mùi) + độ đậm
export function FragranceGroup({ customizer, catalog }: GroupProps) {
  const t = useTranslations("Customizer");
  const meta = useOptionMeta(customizer, catalog);
  const { config, set, toggleFragrance, issues } = customizer;
  const unscented = isUnscented(config, catalog);
  const hint =
    catalog.maxFragrances > 1 ? t("hints.fragranceBlend", { max: catalog.maxFragrances }) : t("hints.fragrance");

  return (
    <CustomizerSection id="fragrance" index={3} title={t("groups.fragrance")} hint={hint}>
      <div
        role="group"
        aria-label={t("groups.fragrance")}
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
      >
        {catalog.fragrances.map((f) => {
          const selected = config.fragrances.some((x) => x.id === f.id);
          const status = meta.status(f, { fragrances: [{ id: f.id, weight: 50 }] }, selected);
          return (
            <OptionCard
              key={f.id}
              layout="row"
              multi={catalog.maxFragrances > 1}
              title={meta.name(f)}
              price={f.priceDelta ? meta.price(f.priceDelta) : undefined}
              selected={selected}
              disabled={status.disabled}
              badge={status.badge}
              onSelect={() => toggleFragrance(f.id)}
              media={
                <span
                  aria-hidden
                  className="size-10 rounded-full border border-linen"
                  style={{ background: f.unscented ? "#fff" : `radial-gradient(circle at 35% 35%, #fff8, ${f.swatch})` }}
                />
              }
            />
          );
        })}
      </div>
      <IssueMessage issues={issuesFor(issues, "fragrance")} />

      {config.fragrances.length > 1 && <FragranceBlend customizer={customizer} catalog={catalog} />}

      {catalog.intensity && !unscented && (
        <div className="flex flex-col gap-3">
          <SubHeading>{t("intensity.title")}</SubHeading>
          <div role="radiogroup" aria-label={t("intensity.title")} className="grid grid-cols-3 gap-2 sm:max-w-md">
            {intensities.map((level) => {
              const delta = catalog.intensity!.priceDelta[level];
              return (
                <OptionCard
                  key={level}
                  layout="row"
                  title={t(`intensity.${level}`)}
                  price={delta ? meta.price(delta) : undefined}
                  selected={config.intensity === level}
                  onSelect={() => set({ intensity: level })}
                  className="justify-center py-2.5 [&>span:first-child]:hidden"
                />
              );
            })}
          </div>
        </div>
      )}
    </CustomizerSection>
  );
}
