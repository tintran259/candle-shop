"use client";
// Duyệt sản phẩm: thanh danh mục (Tất cả + từng danh mục, kèm số mẫu), sắp xếp (Nổi bật / giá), lưới thẻ, phân trang (tối đa 9 mẫu / trang).
// Đổi danh mục / cách sắp xếp thì về trang 1; chuyển trang thì cuộn lên đầu danh sách. Thẻ hiện lại so le mỗi lần đổi (GSAP; giảm chuyển động thì hiện ngay).
// Không tải được dữ liệu thì hiện thông báo + nút tải lại
import { useMemo, useRef, useState } from "react";
import { productsPage as t } from "@/content/home";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import type { ShopData } from "@/lib/shop";
import { cx } from "@/components/ui/primitives";
import { ProductCard } from "@/components/products/product-card";
import { Pagination } from "@/components/products/pagination";
import { SortSelect } from "@/components/products/sort-select";
import Link from "next/link";
import { searchProducts } from "@/lib/search";

type Sort = "featured" | "priceAsc" | "priceDesc";
const price = (p: { price: number; salePrice?: number }) => p.salePrice ?? p.price;

export function ProductBrowser({ data, contactUrl, query = "", initialCategory }: { data: ShopData | null; contactUrl: string | null; query?: string; initialCategory?: string }) {
  const [category, setCategory] = useState(initialCategory && data?.categories.some((c) => c.id === initialCategory) ? initialCategory : "all");
  const [sort, setSort] = useState<Sort>("featured");
  const [page, setPage] = useState(1);
  const grid = useRef<HTMLUListElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);

  // Có từ khóa (?q=) thì chỉ trong kết quả tìm kiếm — số đếm danh mục cũng theo kết quả này
  const found = useMemo(() => (query ? searchProducts(data?.products ?? [], data?.categories ?? [], query) : (data?.products ?? [])), [data, query]);
  const list = useMemo(() => {
    const items = found.filter((p) => category === "all" || p.categoryId === category);
    if (sort === "priceAsc") return [...items].sort((a, b) => price(a) - price(b));
    if (sort === "priceDesc") return [...items].sort((a, b) => price(b) - price(a));
    return items;
  }, [found, category, sort]);

  const size = t.pageSize;
  const pages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(page, pages);
  const shown = list.slice((current - 1) * size, current * size);

  const goTo = (n: number) => {
    setPage(n);
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
    { dependencies: [category, sort, current], scope: grid },
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
  const tabs = [{ id: "all", name: t.all, count: found.length }, ...data.categories.map((c) => ({ ...c, count: found.filter((p) => p.categoryId === c.id).length }))].filter(
    (c) => c.id === "all" || c.count > 0,
  );

  return (
    <>
      <div ref={toolbar} className="mt-12 flex scroll-mt-6 flex-col gap-4 border-rule md:mt-16 md:flex-row md:items-end md:justify-between md:border-b">
        {/* Danh mục: vuốt ngang trên màn hẹp */}
        <div className="-mx-5 overflow-x-auto border-b border-rule px-5 [scrollbar-width:none] md:mx-0 md:border-0 md:px-0">
          <ul className="flex gap-7 whitespace-nowrap">
            {tabs.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  aria-pressed={category === c.id}
                  onClick={() => {
                    setCategory(c.id);
                    setPage(1);
                  }}
                  className={cx("group relative py-4 text-[11px] tracking-[0.12em] uppercase transition-colors duration-300", category === c.id ? "text-wine" : "text-muted hover:text-ink")}
                >
                  {c.name} <span className="tabular-nums opacity-60">({c.count})</span>
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
            onChange={(v) => {
              setSort(v);
              setPage(1);
            }}
            options={[
              { value: "featured", label: t.sort.featured },
              { value: "priceAsc", label: t.sort.priceAsc },
              { value: "priceDesc", label: t.sort.priceDesc },
            ]}
          />
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
      {list.length ? (
        <ul ref={grid} className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:mt-12 md:grid-cols-3 md:gap-x-8 md:gap-y-16">
          {shown.map((p) => (
            <li key={p.id} className="flex">
              <ProductCard product={p} category={names.get(p.categoryId)} contactUrl={contactUrl} />
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
