"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { CustomizerSection } from "@/components/customizer/customizer-section";
import { IssueMessage } from "@/components/customizer/issue-message";
import { OptionCard } from "@/components/customizer/option-card";
import { useOptionMeta, type GroupProps } from "@/components/customizer/use-option-meta";
import { wickCompatible } from "@/lib/customizer/options";
import { pick } from "@/lib/shop-config";
import { issuesFor } from "@/lib/customizer/validation";
import { cn } from "@/lib/utils";

// Nhóm 4: bấc — chỉ chọn được bấc hợp với hũ, sáp, kích thước đã chọn
export function WickGroup({ customizer, catalog }: GroupProps) {
  const t = useTranslations("Customizer");
  const meta = useOptionMeta(customizer, catalog);
  const { config, set, issues } = customizer;

  return (
    <CustomizerSection id="wick" index={4} title={t("groups.wick")} hint={t("hints.wick")}>
      <div role="radiogroup" aria-label={t("groups.wick")} className="grid gap-3 sm:grid-cols-2 xl:max-w-2xl">
        {catalog.wicks.map((w) => {
          const selected = w.id === config.wickId;
          const compatible = wickCompatible(w, config, catalog);
          const status = meta.status(w, { wickId: w.id }, selected);
          return (
            <OptionCard
              key={w.id}
              layout="row"
              title={meta.name(w)}
              subtitle={w.description && pick(w.description, meta.locale)}
              price={meta.price(w.priceDelta)}
              selected={selected}
              disabled={status.disabled || (!selected && !compatible)}
              badge={compatible ? status.badge : t("option.unsupported")}
              onSelect={() => set({ wickId: w.id })}
              media={<WickIcon wood={w.id === "wood"} />}
            />
          );
        })}
      </div>
      <IssueMessage issues={issuesFor(issues, "wick")} />
    </CustomizerSection>
  );
}

function WickIcon({ wood }: { wood: boolean }) {
  return (
    <svg viewBox="0 0 40 48" aria-hidden className="h-12 w-10">
      <path d="M20 4 C25 12, 24 20, 20 20 C16 20, 15 12, 20 4 Z" fill="#f6b04a" />
      {wood ? (
        <rect x="14" y="20" width="12" height="24" rx="1.5" fill="#8a6a4a" />
      ) : (
        <line x1="20" y1="20" x2="20" y2="44" stroke="#3d3e44" strokeWidth="2.5" strokeLinecap="round" />
      )}
    </svg>
  );
}

// Nhóm 5: màu sáp — ô tròn màu, có tên + dấu tick (không chỉ dựa vào màu)
export function ColorGroup({ customizer, catalog }: GroupProps) {
  const t = useTranslations("Customizer");
  const meta = useOptionMeta(customizer, catalog);
  const { config, set, issues } = customizer;

  return (
    <CustomizerSection id="color" index={5} title={t("groups.color")} hint={t("hints.color")}>
      <div role="radiogroup" aria-label={t("groups.color")} className="flex flex-wrap gap-3">
        {catalog.colors.map((c) => {
          const selected = c.id === config.colorId;
          const status = meta.status(c, { colorId: c.id }, selected);
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={status.disabled}
              onClick={() => set({ colorId: c.id })}
              className={cn(
                "flex w-[84px] cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-colors duration-300",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-umber",
                selected ? "border-umber bg-cream-light ring-1 ring-umber" : "border-transparent hover:border-linen",
                "disabled:cursor-not-allowed disabled:opacity-45",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border border-linen",
                  c.natural && "bg-[repeating-linear-gradient(45deg,#fff_0_4px,#eee8de_4px_8px)]",
                )}
                style={c.natural ? undefined : { background: c.swatch }}
              >
                {selected && <CheckIcon className="size-4 text-bark" />}
              </span>
              <span className="text-xs text-bark">{meta.name(c)}</span>
              <span className="text-[11px] text-dark-300">{status.badge ?? meta.price(c.priceDelta)}</span>
            </button>
          );
        })}
      </div>
      <IssueMessage issues={issuesFor(issues, "color")} />
    </CustomizerSection>
  );
}
