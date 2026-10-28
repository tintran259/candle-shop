"use client";

import { AnimatePresence, motion } from "motion/react";
import { SlidersHorizontalIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { ProductCard } from "@/components/home/product-card";
import { FilterPanel } from "@/components/shop/filter-panel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePathname, useRouter } from "@/i18n/navigation";
import { products } from "@/lib/data";
import {
  applyFilters,
  countActive,
  parseFilters,
  sortOptions,
  toQuery,
  type ProductFilters,
  type SortOption,
} from "@/lib/product-filters";
import { cn } from "@/lib/utils";

export function ProductListing() {
  const t = useTranslations("Shop");
  const tProduct = useTranslations("Product");
  const tSearch = useTranslations("Search");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = useMemo(
    () => parseFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const visible = useMemo(
    () =>
      applyFilters(products, filters, (p) =>
        [p.name, tProduct(`taglines.${p.id}`), t(`types.${p.aromaType}`), t(`levels.${p.aromaLevel}`)].join(" "),
      ),
    [filters, t, tProduct],
  );
  const activeCount = countActive(filters);

  // Lưu bộ lọc vào URL để có thể chia sẻ / quay lại
  const update = (next: ProductFilters) =>
    startTransition(() =>
      router.replace({ pathname, query: toQuery(next) }, { scroll: false }),
    );

  const clearAll = () => update(parseFilters(new URLSearchParams()));

  const sortItems = sortOptions.map((value) => ({ value, label: t(`sort.${value}`) }));

  return (
    <div className="mx-auto flex max-w-[1440px] gap-10 px-4 pt-10 pb-20 md:px-10 lg:pt-16 lg:pb-[120px] xl:px-20">
      {/* Bộ lọc — desktop */}
      <aside className="hidden w-[280px] shrink-0 lg:block">
        <div className="sticky top-[151px] overflow-hidden rounded-2xl border border-brand-200">
          <div className="flex items-center justify-between border-b border-brand-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-ink">{t("filter")}</h2>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="cursor-pointer text-sm text-dark-300 underline-offset-4 hover:text-ink hover:underline"
              >
                {t("clearAll")}
              </button>
            )}
          </div>
          <FilterPanel filters={filters} onChange={update} />
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-[32px] leading-[1.4] font-semibold text-ink">{t("title")}</h1>
            {filters.q && (
              <button
                type="button"
                onClick={() => update({ ...filters, q: "" })}
                className="mt-1 mb-1 inline-flex cursor-pointer items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm text-ink hover:bg-brand-100"
              >
                {tSearch("open")}: “{filters.q}”
                <XIcon className="size-3.5" />
              </button>
            )}
            <p className="text-sm text-dark-300">{t("results", { count: visible.length })}</p>
          </div>

          <div className="flex items-center gap-3">
            <MobileFilter
              filters={filters}
              onChange={update}
              onClear={clearAll}
              activeCount={activeCount}
              resultCount={visible.length}
            />
            <Select
              items={sortItems}
              value={filters.sort}
              onValueChange={(sort) => sort && update({ ...filters, sort: sort as SortOption })}
            >
              <SelectTrigger className="h-auto gap-2 rounded-full border-brand-200 bg-transparent px-4 py-2 text-base text-dark-500">
                <span>{t("sortBy")}</span>
                <SelectValue className="font-semibold text-ink" />
              </SelectTrigger>
              <SelectContent className="bg-cream">
                {sortItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          className={cn(
            "mt-8 transition-opacity duration-200",
            isPending && "opacity-60",
          )}
        >
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-brand-200 px-6 py-20 text-center">
              <p className="text-2xl font-semibold text-ink">{t("emptyTitle")}</p>
              <p className="text-dark-300">{t("emptyText")}</p>
              <Button variant="outline-ink" size="pill" onClick={clearAll} className="mt-4">
                {t("clearAll")}
              </Button>
            </div>
          ) : (
            <motion.ul layout className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3 xl:gap-x-10">
              <AnimatePresence mode="popLayout">
                {visible.map((product) => (
                  <motion.li
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ProductCard product={product} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </div>
      </section>
    </div>
  );
}

function MobileFilter({
  filters,
  onChange,
  onClear,
  activeCount,
  resultCount,
}: {
  filters: ProductFilters;
  onChange: (next: ProductFilters) => void;
  onClear: () => void;
  activeCount: number;
  resultCount: number;
}) {
  const t = useTranslations("Shop");

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline-peanut" size="pill" className="gap-2 text-base font-normal lg:hidden" />
        }
      >
        <SlidersHorizontalIcon className="size-4" />
        {t("filter")}
        {activeCount > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-ink text-xs text-white">
            {activeCount}
          </span>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] gap-0 bg-cream p-0">
        <div className="flex items-center justify-between border-b border-brand-200 px-6 py-5">
          <SheetTitle className="text-xl font-semibold">{t("filter")}</SheetTitle>
        </div>
        <div className="flex-1 overflow-y-auto" data-lenis-prevent>
          <FilterPanel filters={filters} onChange={onChange} />
        </div>
        <SheetFooter className="flex-row gap-3 border-t border-brand-200 p-4">
          <Button variant="outline-ink" size="pill" onClick={onClear} className="flex-1">
            {t("clearAll")}
          </Button>
          <SheetClose render={<Button variant="ink" size="pill" className="flex-1" />}>
            {t("showResults", { count: resultCount })}
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
