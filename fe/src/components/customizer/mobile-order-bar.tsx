"use client";

import { useTranslations } from "next-intl";
import { formatMoney } from "@/lib/customizer/pricing";

// Thanh dính đáy màn hình trên mobile: tổng tiền + nút thêm vào giỏ
export function MobileOrderBar({
  total,
  disabled,
  onAdd,
  onReview,
}: {
  total: number;
  disabled: boolean;
  onAdd: () => void;
  onReview: () => void;
}) {
  const t = useTranslations("Customizer");
  return (
    <div data-mobile-order-bar className="fixed inset-x-0 bottom-0 z-30 border-t border-linen bg-cream-light/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <button type="button" onClick={onReview} className="flex min-w-0 flex-1 cursor-pointer flex-col items-start text-left">
          <span className="text-xs text-dark-300 underline underline-offset-2">{t("summary.view")}</span>
          <span className="text-lg font-bold text-bark tabular-nums">{formatMoney(total)}</span>
        </button>
        <button
          type="button"
          onClick={onAdd}
          aria-disabled={disabled}
          className="h-12 cursor-pointer rounded-lg bg-umber px-6 text-sm font-medium text-white transition-colors hover:bg-bark aria-disabled:opacity-60"
        >
          {t("addToCart")}
        </button>
      </div>
    </div>
  );
}
