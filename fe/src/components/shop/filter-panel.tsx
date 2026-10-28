"use client";

import { ChevronRightIcon, StarIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { aromaLevels, aromaTypes, formatPrice, productSizes } from "@/lib/data";
import {
  PRICE_MAX,
  PRICE_MIN,
  type ProductFilters,
} from "@/lib/product-filters";
import { cn } from "@/lib/utils";

type Props = {
  filters: ProductFilters;
  onChange: (next: ProductFilters) => void;
  className?: string;
};

type ListKey = "level" | "type" | "size";

export function FilterPanel({ filters, onChange, className }: Props) {
  const t = useTranslations("Shop");

  const toggle = (key: ListKey, value: string, checked: boolean) =>
    onChange({
      ...filters,
      [key]: checked
        ? [...filters[key], value]
        : filters[key].filter((v) => v !== value),
    });

  const checkboxGroups: {
    id: ListKey;
    title: string;
    options: readonly string[];
    label: (v: string) => string;
  }[] = [
    { id: "level", title: t("aromaLevel"), options: aromaLevels, label: (v) => t(`levels.${v}`) },
    { id: "type", title: t("aromaType"), options: aromaTypes, label: (v) => t(`types.${v}`) },
    { id: "size", title: t("productSize"), options: productSizes, label: (v) => t(`sizes.${v}`) },
  ];

  return (
    <Accordion
      multiple
      defaultValue={["level", "type", "size"]}
      className={cn("gap-0", className)}
    >
      {checkboxGroups.map((group) => (
        <Section key={group.id} value={group.id} title={group.title}>
          <ul className="flex flex-col gap-3">
            {group.options.map((option) => (
              <li key={option}>
                <CheckRow
                  checked={filters[group.id].includes(option)}
                  onCheckedChange={(c) => toggle(group.id, option, c)}
                  label={group.label(option)}
                />
              </li>
            ))}
          </ul>
        </Section>
      ))}

      <Section value="rating" title={t("rating")}>
        <ul className="flex flex-col gap-3" role="radiogroup">
          {[0, 4, 3].map((stars) => (
            <li key={stars}>
              <button
                type="button"
                role="radio"
                aria-checked={filters.rating === stars}
                onClick={() => onChange({ ...filters, rating: stars })}
                className="flex cursor-pointer items-center gap-3 text-sm text-dark-500"
              >
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-full border border-brand-200 transition-colors",
                    filters.rating === stars && "border-ink",
                  )}
                >
                  {filters.rating === stars && <span className="size-2 rounded-full bg-ink" />}
                </span>
                {stars === 0 ? (
                  t("ratingAny")
                ) : (
                  <span className="flex items-center gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <StarIcon
                        key={i}
                        className={cn(
                          "size-3.5",
                          i < stars ? "fill-peanut text-peanut" : "text-brand-200",
                        )}
                      />
                    ))}
                    <span className="ml-1">{t("ratingUp", { stars })}</span>
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <Section value="price" title={t("price")}>
        <PriceRange
          // Dựng lại khi URL đổi (ví dụ bấm "Xóa tất cả")
          key={filters.price.join("-")}
          value={filters.price}
          onCommit={(price) => onChange({ ...filters, price })}
        />
      </Section>

      <Section value="other" title={t("other")} last>
        <ul className="flex flex-col gap-3">
          <li>
            <CheckRow
              checked={filters.sale}
              onCheckedChange={(sale) => onChange({ ...filters, sale })}
              label={t("onSale")}
            />
          </li>
          <li>
            <CheckRow
              checked={filters.isNew}
              onCheckedChange={(isNew) => onChange({ ...filters, isNew })}
              label={t("newArrival")}
            />
          </li>
        </ul>
      </Section>
    </Accordion>
  );
}

function Section({
  value,
  title,
  last,
  children,
}: {
  value: string;
  title: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={value} className={cn("border-brand-200", !last && "border-b")}>
      <AccordionTrigger className="group/filter items-center rounded-none px-6 py-4 text-base font-medium text-ink hover:no-underline [&>[data-slot=accordion-trigger-icon]]:hidden!">
        {title}
        <ChevronRightIcon className="size-5 transition-transform duration-300 group-aria-expanded/filter:rotate-90" />
      </AccordionTrigger>
      <AccordionContent>
        <div className="px-6 pb-5">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}

function CheckRow({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-dark-500">
      <Checkbox
        checked={checked}
        onCheckedChange={(c) => onCheckedChange(c === true)}
        className="rounded-[3px] border-dark-50 data-checked:border-ink data-checked:bg-ink"
      />
      {label}
    </label>
  );
}

function PriceRange({
  value,
  onCommit,
}: {
  value: [number, number];
  onCommit: (value: [number, number]) => void;
}) {
  // Giữ giá trị khi kéo, chỉ cập nhật URL khi thả tay
  const [draft, setDraft] = useState(value);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Slider
        min={PRICE_MIN}
        max={PRICE_MAX}
        step={1}
        value={draft}
        onValueChange={(v) => setDraft(v as [number, number])}
        onValueCommitted={(v) => onCommit(v as [number, number])}
      />
      <div className="flex justify-between text-sm text-dark-500">
        <span>{formatPrice(draft[0])}</span>
        <span>{formatPrice(draft[1])}</span>
      </div>
    </div>
  );
}
