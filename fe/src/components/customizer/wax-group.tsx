"use client";

import { useTranslations } from "next-intl";
import { CustomizerSection } from "@/components/customizer/customizer-section";
import { IssueMessage } from "@/components/customizer/issue-message";
import { OptionCard } from "@/components/customizer/option-card";
import { useOptionMeta, type GroupProps } from "@/components/customizer/use-option-meta";
import { pick } from "@/lib/shop-config";
import { issuesFor } from "@/lib/customizer/validation";

// Nhóm 2: loại sáp
export function WaxGroup({ customizer, catalog }: GroupProps) {
  const t = useTranslations("Customizer");
  const meta = useOptionMeta(customizer, catalog);
  const { config, set, issues } = customizer;

  return (
    <CustomizerSection id="wax" index={2} title={t("groups.wax")} hint={t("hints.wax")}>
      <div role="radiogroup" aria-label={t("groups.wax")} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {catalog.waxes.map((w) => {
          const selected = w.id === config.waxId;
          const status = meta.status(w, { waxId: w.id }, selected);
          return (
            <OptionCard
              key={w.id}
              layout="row"
              title={meta.name(w)}
              subtitle={w.description && pick(w.description, meta.locale)}
              price={meta.price(w.priceDelta)}
              selected={selected}
              disabled={status.disabled}
              badge={status.badge}
              onSelect={() => set({ waxId: w.id })}
              media={<WaxChunk color={w.swatch ?? "#f6efe2"} />}
            />
          );
        })}
      </div>
      <IssueMessage issues={issuesFor(issues, "wax")} />
    </CustomizerSection>
  );
}

// Hình vảy sáp minh họa theo màu sáp
function WaxChunk({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className="size-14">
      {[
        [22, 30, 14, -12],
        [38, 26, 12, 18],
        [30, 42, 15, 6],
        [44, 40, 10, -20],
      ].map(([cx, cy, r, rot], i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx={r}
          ry={r * 0.55}
          transform={`rotate(${rot} ${cx} ${cy})`}
          fill={color}
          stroke="#3b2a1a"
          strokeOpacity="0.12"
        />
      ))}
    </svg>
  );
}
