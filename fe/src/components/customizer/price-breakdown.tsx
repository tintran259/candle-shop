"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { formatDelta, formatMoney, type priceBreakdown } from "@/lib/customizer/pricing";

// Giá gốc + phụ thu từng thành phần + tổng (giá ƯỚC TÍNH, BE xác nhận khi đặt)
export function PriceBreakdown({
  price,
  quantity,
  grams,
}: {
  price: ReturnType<typeof priceBreakdown>;
  quantity: number;
  grams?: number;
}) {
  const t = useTranslations("Customizer.price");
  return (
    <div className="flex flex-col gap-3 border-t border-linen pt-4 text-sm">
      <dl className="flex flex-col gap-2">
        <div className="flex justify-between gap-4">
          <dt className="text-dark-300">{grams ? t("baseWithSize", { grams }) : t("base")}</dt>
          <dd className="text-bark tabular-nums">{formatMoney(price.base)}</dd>
        </div>
        {price.extras.map((line) => (
          <div key={line.key} className="flex justify-between gap-4">
            <dt className="text-dark-300">{t(`lines.${line.key}`)}</dt>
            <dd className="text-bark tabular-nums">{formatDelta(line.amount)}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-baseline justify-between border-t border-linen pt-3">
        <span className="text-base font-semibold text-bark">
          {quantity > 1 ? t("totalFor", { count: quantity }) : t("total")}
        </span>
        <motion.span
          key={price.unit * quantity}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-bark tabular-nums"
        >
          {formatMoney(price.unit * quantity)}
        </motion.span>
      </div>
      <p className="text-xs text-dark-300">{t("estimate")}</p>
    </div>
  );
}
