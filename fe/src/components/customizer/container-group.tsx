"use client";

import { useTranslations } from "next-intl";
import { CandlePreview } from "@/components/customizer/candle-preview";
import { CustomizerSection, SubHeading } from "@/components/customizer/customizer-section";
import { IssueMessage } from "@/components/customizer/issue-message";
import { OptionCard } from "@/components/customizer/option-card";
import { useOptionMeta, type GroupProps } from "@/components/customizer/use-option-meta";
import { findById, sizeSupported } from "@/lib/customizer/options";
import { formatMoney } from "@/lib/customizer/pricing";
import { candleLook } from "@/lib/customizer/snapshot";
import { issuesFor } from "@/lib/customizer/validation";

// Nhóm 1: hũ nến + nắp + kích thước (dung tích)
export function ContainerGroup({ customizer, catalog }: GroupProps) {
  const t = useTranslations("Customizer");
  const meta = useOptionMeta(customizer, catalog);
  const { config, set, issues } = customizer;
  const container = findById(catalog.containers, config.containerId);
  const look = candleLook(config, catalog);

  return (
    <CustomizerSection id="container" index={1} title={t("groups.container")} hint={t("hints.container")}>
      <div role="radiogroup" aria-label={t("groups.container")} className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {catalog.containers.map((c) => {
          const selected = c.id === config.containerId;
          const status = meta.status(c, { containerId: c.id }, selected);
          return (
            <OptionCard
              key={c.id}
              title={meta.name(c)}
              price={meta.price(c.priceDelta)}
              selected={selected}
              disabled={status.disabled}
              badge={status.badge}
              onSelect={() => set({ containerId: c.id, withLid: config.withLid && !!c.lid })}
              media={
                <CandlePreview
                  look={{ ...look, shape: c.shape, vesselColor: c.swatch ?? look.vesselColor, translucent: !!c.translucent, label: undefined, decoration: undefined }}
                  lit={false}
                  className="h-full w-auto"
                />
              }
            />
          );
        })}
      </div>
      <IssueMessage issues={issuesFor(issues, "container")} />

      {container?.lid && (
        <div className="flex flex-col gap-3">
          <SubHeading>{t("lid.title")}</SubHeading>
          <div role="radiogroup" aria-label={t("lid.title")} className="grid gap-3 sm:grid-cols-2 xl:max-w-xl">
            {[false, true].map((withLid) => (
              <OptionCard
                key={String(withLid)}
                layout="row"
                title={withLid ? t("lid.with") : t("lid.none")}
                price={withLid ? meta.price(container.lid!.priceDelta) : undefined}
                selected={config.withLid === withLid}
                disabled={withLid && container.lid!.stock <= 0}
                onSelect={() => set({ withLid })}
              />
            ))}
          </div>
        </div>
      )}
      <IssueMessage issues={issuesFor(issues, "lid")} />

      <div className="flex flex-col gap-3">
        <SubHeading note={t("size.note")}>{t("size.title")}</SubHeading>
        <p className="-mt-2 text-sm text-dark-300">{t("size.hint")}</p>
        <div role="radiogroup" aria-label={t("size.title")} className="grid gap-3 sm:grid-cols-3">
          {catalog.sizes.map((s) => {
            const selected = s.id === config.sizeId;
            const supported = sizeSupported(container, s.id);
            return (
              <OptionCard
                key={s.id}
                layout="row"
                title={`${s.grams}g`}
                subtitle={s.burnHours ? t("size.burn", { hours: s.burnHours }) : undefined}
                price={formatMoney(s.basePrice)}
                selected={selected}
                disabled={!selected && (!s.available || !supported)}
                badge={!supported ? t("option.unsupported") : undefined}
                onSelect={() => set({ sizeId: s.id })}
                media={
                  <CandlePreview look={{ ...look, label: undefined, decoration: undefined }} lit={false} className="w-12" />
                }
              />
            );
          })}
        </div>
        <IssueMessage issues={issuesFor(issues, "size")} />
      </div>
    </CustomizerSection>
  );
}
