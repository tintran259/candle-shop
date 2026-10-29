"use client";

import { BookmarkIcon, ClockIcon, ShoppingBagIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { CandlePreview } from "@/components/customizer/candle-preview";
import { ConfigurationSummary } from "@/components/customizer/configuration-summary";
import { PriceBreakdown } from "@/components/customizer/price-breakdown";
import { QuantitySelector } from "@/components/customizer/quantity-selector";
import type { GroupProps } from "@/components/customizer/use-option-meta";
import { Button } from "@/components/ui/button";
import { findById } from "@/lib/customizer/options";
import { candleLook } from "@/lib/customizer/snapshot";
import type { GroupId } from "@/lib/customizer/types";

const LOW_STOCK = 5;

// Cột phải: ảnh minh họa + tóm tắt + giá + số lượng + thêm vào giỏ
export function SummaryPanel({
  customizer,
  catalog,
  withIssues,
  leadTime,
  onAdd,
  onSave,
}: GroupProps & {
  withIssues: Set<GroupId>;
  leadTime: { min: number; max: number };
  onAdd: () => void;
  onSave: () => void;
}) {
  const t = useTranslations("Customizer");
  const { config, price, quantity, maxQuantity, issues, outOfStock } = customizer;
  const look = candleLook(config, catalog);
  const size = findById(catalog.sizes, config.sizeId);

  return (
    <div className="flex flex-col gap-5">
      <figure className="overflow-hidden rounded-xl border border-linen bg-white">
        <div className="relative flex aspect-[4/3.4] items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#fbf8f0,#efe4dc)]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={`${look.shape}-${look.vesselColor}-${look.translucent}`}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-[62%]"
            >
              <CandlePreview look={look} />
            </motion.div>
          </AnimatePresence>
        </div>
        <figcaption className="border-t border-linen px-4 py-2.5 text-xs text-dark-300">{t("summary.previewNote")}</figcaption>
      </figure>

      <div className="rounded-xl border border-linen bg-white p-5">
        <ConfigurationSummary config={config} catalog={catalog} withIssues={withIssues} />
        <div className="mt-5">
          <PriceBreakdown price={price} quantity={quantity} grams={size?.grams} />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-bark">{t("quantity")}</span>
          <QuantitySelector value={quantity} max={Math.max(maxQuantity, 1)} onChange={customizer.setQuantity} />
        </div>
        {!outOfStock && maxQuantity <= LOW_STOCK && (
          <p className="mt-2 text-right text-xs text-dark-300">{t("maxQty", { count: maxQuantity })}</p>
        )}

        {(issues.length > 0 || outOfStock) && (
          <p role="status" className="mt-4 rounded-lg bg-rose/10 px-3 py-2 text-sm text-[#a33a3a]">
            {outOfStock ? t("errors.stock") : t("fixFirst", { count: issues.length })}
          </p>
        )}

        <Button
          onClick={onAdd}
          aria-disabled={issues.length > 0 || outOfStock}
          className="mt-4 h-12 w-full cursor-pointer rounded-lg bg-umber text-base text-white transition-colors hover:bg-bark aria-disabled:opacity-60"
        >
          <ShoppingBagIcon className="size-5" aria-hidden />
          {t("addToCart")}
        </Button>
        <Button
          variant="outline"
          onClick={onSave}
          className="mt-3 h-12 w-full cursor-pointer rounded-lg border-bark bg-white text-base text-bark hover:bg-cream-light"
        >
          <BookmarkIcon className="size-4" aria-hidden />
          {t("save")}
        </Button>

        <p className="mt-4 flex items-start gap-2 text-xs text-dark-300">
          <ClockIcon className="mt-0.5 size-4 shrink-0 text-umber" aria-hidden />
          {t("leadTime", leadTime)}
        </p>
      </div>
    </div>
  );
}
