"use client";

import { PencilLineIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { customizerGroups, scrollToGroup } from "@/components/customizer/groups";
import { findById, fragranceShares } from "@/lib/customizer/options";
import type { CandleConfiguration, CustomizerCatalog, GroupId } from "@/lib/customizer/types";
import { pick } from "@/lib/shop-config";
import { cn } from "@/lib/utils";

// "Tóm tắt tùy chỉnh": mỗi nhóm 1 dòng, bấm để quay lại chỉnh
export function ConfigurationSummary({
  config,
  catalog,
  withIssues,
}: {
  config: CandleConfiguration;
  catalog: CustomizerCatalog;
  withIssues: Set<GroupId>;
}) {
  const t = useTranslations("Customizer");
  const locale = useLocale();
  const name = (o?: { name: { vi: string; en: string } }) => (o ? pick(o.name, locale) : t("summary.none"));
  const container = findById(catalog.containers, config.containerId);
  const size = findById(catalog.sizes, config.sizeId);
  const p = config.personalization;

  const values: Record<GroupId, string> = {
    container: [
      container && `${name(container)}${container.lid ? ` (${config.withLid ? t("lid.with") : t("lid.none")})` : ""}`,
      size && `${size.grams}g`,
    ]
      .filter(Boolean)
      .join(" · ") || t("summary.none"),
    wax: name(findById(catalog.waxes, config.waxId)),
    fragrance:
      fragranceShares(config.fragrances)
        .map((f) => name(findById(catalog.fragrances, f.id)) + (config.fragrances.length > 1 ? ` ${f.percent}%` : ""))
        .join(" / ") + (config.intensity ? ` · ${t(`intensity.${config.intensity}`)}` : ""),
    wick: name(findById(catalog.wicks, config.wickId)),
    color: name(findById(catalog.colors, config.colorId)),
    decoration: name(findById(catalog.decorations, config.decorationId)),
    personalization:
      [p.labelText && `“${p.labelText}”`, p.recipientName, p.giftMessage && t("summary.message"), p.giftBox && t("personal.giftBox")]
        .filter(Boolean)
        .join(" · ") || t("summary.none"),
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-bark">{t("summary.title")}</h2>
        <button
          type="button"
          onClick={() => scrollToGroup("container")}
          className="flex cursor-pointer items-center gap-1 text-xs text-umber underline-offset-4 hover:underline"
        >
          <PencilLineIcon className="size-3.5" aria-hidden />
          {t("summary.edit")}
        </button>
      </div>
      <dl className="mt-4 flex flex-col gap-3">
        {customizerGroups.map(({ id, icon: Icon }) => (
          <div key={id} className="flex gap-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-umber" aria-hidden />
            <div className="min-w-0">
              <dt className="text-sm font-medium text-bark">{t(`groups.${id}`)}</dt>
              <dd className={cn("text-xs break-words", withIssues.has(id) ? "text-[#a33a3a]" : "text-dark-300")}>
                {values[id]}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
