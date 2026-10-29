"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";

// Chọn số lượng: tối thiểu 1, tối đa theo nguyên liệu còn trong kho
export function QuantitySelector({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (next: number) => void;
}) {
  const t = useTranslations("Customizer");
  return (
    <div role="group" aria-label={t("quantity")} className="flex h-10 items-center rounded-lg border border-linen bg-white">
      <button
        type="button"
        aria-label={t("decrease")}
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        className="flex size-10 cursor-pointer items-center justify-center text-bark disabled:cursor-not-allowed disabled:opacity-40"
      >
        <MinusIcon className="size-4" />
      </button>
      <span className="w-10 text-center text-sm text-bark tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        aria-label={t("increase")}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        className="flex size-10 cursor-pointer items-center justify-center text-bark disabled:cursor-not-allowed disabled:opacity-40"
      >
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}
