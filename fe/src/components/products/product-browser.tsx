"use client";
// Duyệt sản phẩm: hàng Concept (dịp lễ, nút viền — chỉ khi có concept) phía trên hàng Danh mục (tab gạch chân), kèm số mẫu; sắp xếp (Nổi bật / giá),
// lưới thẻ, phân trang (tối đa 9 mẫu / trang). Đổi concept thì danh mục về Tất cả (số đếm danh mục tính trong concept đang chọn).
// Đổi bộ lọc / cách sắp xếp thì về trang 1; chuyển trang thì cuộn lên đầu danh sách. Thẻ hiện lại so le mỗi lần đổi (GSAP; giảm chuyển động thì hiện ngay).
// Bộ lọc, sắp xếp, trang nằm trên URL (use-list-params.ts). Không tải được dữ liệu thì hiện thông báo + nút tải lại
import { useMemo, useRef } from "react";
import { productsPage as t } from "@/content/home";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { isUpcoming, type ShopData } from "@/lib/shop";
import { cx } from "@/components/ui/primitives";
import { ProductCard } from "@/components/products/product-card";
import { Pagination } from "@/components/products/pagination";
import { SortSelect } from "@/components/products/sort-select";
import { ConceptEmpty } from "@/components/products/concept-empty";
import Link from "next/link";
import { searchProducts } from "@/lib/search";
import { useListParams } from "@/components/products/use-list-params";

const price = (p: { price: number; salePrice?: number }) => p.salePrice ?? p.price;

export function ProductBrowser({ data, contactUrl }: { data: ShopData | null; contactUrl: string | null }) {
  const { query, concept, category, sort, page, update } = useListParams(data);
  const grid = useRef<HTMLUListElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);

  // Có từ khóa (?q=) thì chỉ trong kết quả tìm kiếm — số đếm danh mục cũng theo kết quả này
  const found = useMemo(() => (query ? searchProducts(data?.products ?? [], data?.categories ?? [], query, data?.concepts) : (data?.products ?? [])), [data, query]);
  const inConcept = useMemo(() => found.filter((p) => concept === "all" || p.conceptIds.includes(concept)), [found, concept]);
  const list = useMemo(() => {
    const items = inConcept.filter((p) => category === "all" || p.categoryId === category);
    if (sort === "priceAsc") return [...items].sort((a, b) => price(a) - price(b));
    if (sort === "priceDesc") return [...items].sort((a, b) => price(b) - price(a));
    return items;
  }, [inConcept, category, sort]);

  const size = t.pageSize;
  const pages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(page, pages);
  const shown = list.slice((current - 1) * size, current * size);

  const goTo = (n: number) => {
    update({ page: n });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    toolbar.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  useGSAP(
    () => {
      if (!grid.current?.children.length) return;
      gsap.matchMedia().add(MOTION_OK, () => {
        // fromTo: bấm đổi liên tục thì hiệu ứng chạy chồng — đích luôn là hiện rõ
        gsap.fromTo(grid.current!.children, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.07, ease: "power3.out", overwrite: true });
      });
    },
    { dependencies: [concept, category, sort, current], scope: grid },
  );

  if (!data)
    return (
      <div className="mt-14 border-t border-rule py-16 text-center">
        <p className="mx-auto max-w-md text-[14px] leading-6 text-muted">{t.error}</p>
        <button type="button" onClick={() => location.reload()} className="link-sm mt-6 text-wine underline underline-offset-4">
          {t.retry}
        </button>
      </div>
    );

  const names = new Map(data.categories.map((c) => [c.id, c.name]));
  const withCount = <T extends { id: string }>(all: T[], items: typeof found, match: (p: (typeof found)[number], id: string) => boolean) =>
    [{ id: "all", name: t.all, count: items.length }, ...all.map((c) => ({ ...c, count: items.filter((p) => match(p, c.id)).length }))].filter((c) => c.id === "all" || c.count > 0);
  const tabs = withCount(data.categories, inConcept, (p, id) => p.categoryId === id);
  // Hàng concept giữ cả concept chưa có mẫu (sắp mở / chưa có mẫu) — chọn vào thì hiện đếm ngược / thông báo
  const concepts = [{ id: "all", name: t.all, count: found.length }, ...data.concepts.map((c) => ({ ...c, count: found.filter((p) => p.conceptIds.includes(c.id)).length }))];
  const emptyConcept = concept !== "all" && !inConcept.length && !query ? data.concepts.find((c) => c.id === concept) : undefined;

  return (
    <>
      <div ref={toolbar} className="scroll-mt-6">
        {concepts.length > 1 && (
          <div className="mt-12 md:mt-16">
            <p className="eyebrow">{t.byConcept}</p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {concepts.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={concept === c.id}
                    onClick={() => update({ concept: c.id, category: undefined, page: undefined })}
                    className={cx(
                      "min-h-10 border px-4 text-[11px] tracking-[0.12em] uppercase transition-colors duration-300",
                      concept === c.id ? "border-wine bg-wine text-cream" : "border-rule text-ink hover:border-wine hover:text-wine",
                    )}
                  >
                    {c.id === "all" ? t.allConcepts : c.name} <span className="tabular-nums">{!c.count && "startsOn" in c && isUpcoming(c) ? `· ${t.soon}` : `(${c.count})`}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className={cx("flex flex-col gap-4 border-rule md:flex-row md:items-end md:justify-between md:border-b", concepts.length > 1 ? "mt-8" : "mt-12 md:mt-16", emptyConcept && "hidden")}>
          {/* Danh mục: vuốt ngang trên màn hẹp */}
          <div className="-mx-5 overflow-x-auto border-b border-rule px-5 [scrollbar-width:none] md:mx-0 md:border-0 md:px-0">
            <ul className="flex gap-7 whitespace-nowrap">
              {tabs.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={category === c.id}
                    onClick={() => update({ category: c.id, page: undefined })}
                    className={cx("group relative py-4 text-[11px] tracking-[0.12em] uppercase transition-colors duration-300", category === c.id ? "text-wine" : "text-muted hover:text-ink")}
                  >
                    {c.name} <span className="tabular-nums">({c.count})</span>
                    <span className={cx("absolute inset-x-0 -bottom-px h-px origin-left bg-wine transition-transform duration-500", category === c.id ? "scale-x-100" : "scale-x-0")} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between gap-6 pb-4 md:justify-end">
            <p className="text-[11px] text-muted tabular-nums" aria-live="polite">
              {pages > 1 ? t.range((current - 1) * size + 1, (current - 1) * size + shown.length, list.length) : t.count(list.length)}
            </p>
            <SortSelect
              label={t.sort.label}
              value={sort}
              onChange={(v) => update({ sort: v, page: undefined })}
              options={[
                { value: "featured", label: t.sort.featured },
                { value: "priceAsc", label: t.sort.priceAsc },
                { value: "priceDesc", label: t.sort.priceDesc },
              ]}
            />
          </div>
        </div>
      </div>

      {query && (
        <p className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px] text-muted">
          <span className="display text-[24px] text-ink">{t.results(query)}</span>
          <Link href="/products" className="link-sm text-wine underline underline-offset-4">
            {t.clear}
          </Link>
        </p>
      )}
      {emptyConcept ? (
        <ConceptEmpty key={emptyConcept.id} concept={emptyConcept} contactUrl={contactUrl} />
      ) : list.length ? (
        <ul ref={grid} className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:mt-12 md:grid-cols-3 md:gap-x-8 md:gap-y-16">
          {shown.map((p, i) => (
            <li key={p.id} className="flex">
              <ProductCard product={p} category={names.get(p.categoryId)} contactUrl={contactUrl} eager={i < 3} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-20 text-center text-[14px] text-muted">{t.empty}</p>
      )}
      <Pagination page={current} total={pages} onChange={goTo} />
    </>
  );
}
