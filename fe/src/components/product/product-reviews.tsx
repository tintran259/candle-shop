"use client";

import { ChevronDownIcon, StarIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useFormatter, useTranslations } from "next-intl";
import Image from "next/image";
import { useMemo, useState } from "react";
import { StarRating } from "@/components/product/star-rating";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productSizes, type Review } from "@/lib/data";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 3;
const sortKeys = ["recent", "highest", "lowest"] as const;
type SortKey = (typeof sortKeys)[number];

const toggle = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export function ProductReviews({ reviews }: { reviews: Review[] }) {
  const t = useTranslations("ProductDetail");
  const tShop = useTranslations("Shop");
  const [stars, setStars] = useState<number[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("recent");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const average = reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1);
  const counts = [5, 4, 3, 2, 1].map((n) => ({
    stars: n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  const filtered = useMemo(() => {
    const list = reviews.filter(
      (r) =>
        (!stars.length || stars.includes(r.rating)) &&
        (!sizes.length || sizes.includes(r.size)),
    );
    const sorters: Record<SortKey, (a: Review, b: Review) => number> = {
      recent: (a, b) => b.date.localeCompare(a.date),
      highest: (a, b) => b.rating - a.rating || b.date.localeCompare(a.date),
      lowest: (a, b) => a.rating - b.rating || b.date.localeCompare(a.date),
    };
    return [...list].sort(sorters[sort]);
  }, [reviews, stars, sizes, sort]);

  const sortItems = sortKeys.map((value) => ({ value, label: t(`sort.${value}`) }));

  return (
    <section id="reviews" className="scroll-mt-40 bg-[#f6efed]">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-4 py-20 md:px-10 lg:flex-row lg:gap-12 xl:px-20">
        {/* Tổng hợp + lọc */}
        <aside className="w-full shrink-0 self-start overflow-hidden rounded-2xl border border-peanut lg:w-[292px]">
          <div className="flex flex-col items-center gap-3 border-b border-peanut px-6 py-8">
            <p className="text-[28px] leading-none font-semibold text-ink">{average.toFixed(1)}</p>
            <StarRating value={Math.round(average * 2) / 2} starClassName="size-6" />
            <p className="text-lg text-ink">{t("basedOn", { count: reviews.length })}</p>
          </div>

          <Accordion multiple defaultValue={["rating", "size"]}>
            <AccordionItem value="rating" className="border-b border-peanut">
              <FilterTrigger>{t("ratingFilter")}</FilterTrigger>
              <AccordionContent>
                <ul className="flex flex-col gap-4 px-6 pb-6">
                  {counts.map(({ stars: n, count }) => (
                    <li key={n}>
                      <label className="flex cursor-pointer items-center gap-3 text-sm text-ink">
                        <Checkbox
                          checked={stars.includes(n)}
                          onCheckedChange={() => {
                            setStars((s) => toggle(s, n));
                            setVisible(PAGE_SIZE);
                          }}
                          className="rounded-[3px] border-dark-50 data-checked:border-ink data-checked:bg-ink"
                        />
                        <StarIcon className="size-4 fill-brand-500 text-brand-500" />
                        <span className="w-3">{n}</span>
                        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-50">
                          <motion.span
                            className="block h-full rounded-full bg-brand-500"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(count / (reviews.length || 1)) * 100}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </span>
                        <span className="w-4 text-right">{count}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="size">
              <FilterTrigger>{t("sizeFilter")}</FilterTrigger>
              <AccordionContent>
                <ul className="flex flex-col gap-4 px-6 pb-6">
                  {productSizes.map((size) => (
                    <li key={size}>
                      <label className="flex cursor-pointer items-center gap-3 text-base text-ink">
                        <Checkbox
                          checked={sizes.includes(size)}
                          onCheckedChange={() => {
                            setSizes((s) => toggle(s, size));
                            setVisible(PAGE_SIZE);
                          }}
                          className="rounded-[3px] border-dark-50 data-checked:border-ink data-checked:bg-ink"
                        />
                        {tShop(`sizes.${size}`)}
                      </label>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </aside>

        {/* Danh sách */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-[0.08em] text-ink">{t("reviews")}</h2>
            <Select items={sortItems} value={sort} onValueChange={(v) => v && setSort(v as SortKey)}>
              <SelectTrigger className="h-auto gap-2 rounded-full border-peanut bg-transparent px-6 py-2.5 text-lg text-ink">
                <span>{t("sortBy")}</span>
                <SelectValue className="font-semibold" />
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

          {filtered.length === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-peanut px-6 py-16 text-center text-dark-300">
              {t("noReviews")}
            </p>
          ) : (
            <ul className="mt-10 flex flex-col gap-8">
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.slice(0, visible).map((review) => (
                  <motion.li
                    key={review.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ReviewCard review={review} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}

          {visible < filtered.length && (
            <div className="mt-14 flex justify-center">
              <Button
                variant="outline-peanut"
                size="pill-lg"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="min-w-[246px]"
              >
                {t("loadMore")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FilterTrigger({ children }: { children: React.ReactNode }) {
  return (
    <AccordionTrigger className="group/rf items-center rounded-none px-6 py-6 text-base font-normal text-ink hover:no-underline [&>[data-slot=accordion-trigger-icon]]:hidden!">
      {children}
      <ChevronDownIcon className="size-5 transition-transform duration-300 group-aria-expanded/rf:rotate-180" />
    </AccordionTrigger>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const t = useTranslations("ProductDetail");
  const tShop = useTranslations("Shop");
  const format = useFormatter();
  const [showReply, setShowReply] = useState(false);

  const meta = [
    { label: t("quality"), value: t(`qualities.${review.quality}`) },
    { label: t("size"), value: tShop(`sizes.${review.size}`) },
    { label: t("level"), value: tShop(`levels.${review.level}`) },
  ];

  return (
    <article className="grid gap-6 rounded-2xl border border-[#efe8e0] bg-[#fdfbf7] p-6 md:grid-cols-[240px_1fr] md:p-10">
      <div className="flex flex-col gap-5">
        <StarRating value={review.rating} />
        <div className="flex items-center gap-4">
          {review.avatar ? (
            <Image
              src={review.avatar}
              alt=""
              width={40}
              height={40}
              className="size-10 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-10 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-ink">
              {review.author
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)}
            </span>
          )}
          <p className="text-lg font-semibold text-ink">{review.author}</p>
        </div>
        <dl className="flex flex-col gap-2 text-sm">
          {meta.map((m) => (
            <div key={m.label} className="flex gap-2">
              <dt className="text-dark-50">{m.label} :</dt>
              <dd className="text-ink">{m.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-col">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-2xl leading-[1.4] font-medium text-ink md:text-[28px]">{review.title}</h3>
          <time dateTime={review.date} className="text-sm text-dark-300">
            {format.dateTime(new Date(review.date), { dateStyle: "long" })}
          </time>
        </div>
        <p className="mt-3 text-lg leading-[1.8] text-ink">{review.body}</p>

        <button
          type="button"
          onClick={() => setShowReply((s) => !s)}
          aria-expanded={showReply}
          className="mt-auto flex cursor-pointer items-center gap-2 self-start pt-8 text-sm text-dark-300 hover:text-ink"
        >
          {showReply ? t("hideReply") : t("seeReply")}
          <ChevronDownIcon className={cn("size-4 transition-transform", showReply && "rotate-180")} />
        </button>
        <AnimatePresence initial={false}>
          {showReply && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 border-l-2 border-peanut pl-4 text-base text-dark-300">
                {review.reply ? (
                  <>
                    <p className="font-semibold text-ink">{t("storeReply")}</p>
                    <p className="mt-1">{review.reply}</p>
                  </>
                ) : (
                  t("noReply")
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </article>
  );
}
