"use client";

import { useTranslations } from "next-intl";
import { CandlePreview } from "@/components/customizer/candle-preview";
import { CustomizerSection } from "@/components/customizer/customizer-section";
import { IssueMessage } from "@/components/customizer/issue-message";
import { OptionCard } from "@/components/customizer/option-card";
import { useOptionMeta, type GroupProps } from "@/components/customizer/use-option-meta";
import { pick } from "@/lib/shop-config";
import { candleLook } from "@/lib/customizer/snapshot";
import { issuesFor } from "@/lib/customizer/validation";

// Nhóm 6: trang trí — chỉ hiện các mục xưởng đã duyệt an toàn khi đốt
export function DecorationGroup({ customizer, catalog }: GroupProps) {
  const t = useTranslations("Customizer");
  const meta = useOptionMeta(customizer, catalog);
  const { config, set, issues } = customizer;
  const look = candleLook(config, catalog);

  return (
    <CustomizerSection id="decoration" index={6} title={t("groups.decoration")} hint={t("hints.decoration")}>
      <div role="radiogroup" aria-label={t("groups.decoration")} className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {catalog.decorations
          .filter((d) => d.approved)
          .map((d) => {
            const selected = d.id === config.decorationId;
            const status = meta.status(d, { decorationId: d.id }, selected);
            return (
              <OptionCard
                key={d.id}
                title={meta.name(d)}
                subtitle={d.description && pick(d.description, meta.locale)}
                price={meta.price(d.priceDelta)}
                selected={selected}
                disabled={status.disabled}
                badge={status.badge}
                onSelect={() => set({ decorationId: d.id })}
                media={
                  <CandlePreview look={{ ...look, decoration: d.look, label: undefined }} lit={false} className="h-full w-auto" />
                }
              />
            );
          })}
      </div>
      <IssueMessage issues={issuesFor(issues, "decoration")} />
    </CustomizerSection>
  );
}
