"use client";

import { useLocale, useTranslations } from "next-intl";
import type { CandleCustomizer } from "@/hooks/use-candle-customizer";
import { inStock } from "@/lib/customizer/options";
import { formatDelta } from "@/lib/customizer/pricing";
import { maxQuantity } from "@/lib/customizer/snapshot";
import type { BaseOption, CandleConfiguration, CustomizerCatalog } from "@/lib/customizer/types";
import { pick } from "@/lib/shop-config";

const LOW_STOCK = 5;

export type GroupProps = { customizer: CandleCustomizer; catalog: CustomizerCatalog };

// Tên, giá, trạng thái còn hàng của 1 lựa chọn — dùng chung cho các nhóm
export function useOptionMeta(customizer: CandleCustomizer, catalog: CustomizerCatalog) {
  const t = useTranslations("Customizer.option");
  const locale = useLocale();

  return {
    locale,
    name: (o: { name: BaseOption["name"] }) => pick(o.name, locale),
    price: (amount: number) => (amount === 0 ? t("included") : formatDelta(amount)),
    // Badge khi tạm hết hoặc chỉ còn đủ vài hũ nếu đổi sang lựa chọn này
    status(option: BaseOption, patch: Partial<CandleConfiguration>, selected: boolean) {
      if (!inStock(option)) return { disabled: !selected, badge: t("soldOut") };
      const capacity = maxQuantity({ ...customizer.config, ...patch }, catalog);
      if (capacity < 1) return { disabled: !selected, badge: t("notEnough") };
      if (capacity <= LOW_STOCK) return { disabled: false, badge: t("onlyLeft", { count: capacity }) };
      return { disabled: false, badge: undefined };
    },
  };
}
