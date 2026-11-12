"use client";
// Hộp tìm kiếm: nền tối mờ + khung nền kem trượt xuống từ trên. Gõ là ra kết quả ngay (tối đa 6, khớp không dấu); chưa gõ thì gợi ý mẫu nổi bật.
// Bàn phím: ↑ ↓ chọn, Enter mở trang chi tiết mẫu đang chọn (chưa chọn thì xem tất cả kết quả ở trang Sản phẩm), Esc đóng, Tab không thoát khỏi hộp.
// Dữ liệu: /api/products (máy chủ Next lấy từ BE), tải một lần khi mở lần đầu.
// Gắn thẳng vào <body> (portal): thanh điều hướng bị dịch chuyển khi ẩn / hiện nên không đặt hộp bên trong nó
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { search as t } from "@/content/home";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { searchProducts } from "@/lib/search";
import { cloudinary, formatPrice, productUrl, type ShopData } from "@/lib/shop";
import { Container, cx } from "@/components/ui/primitives";

let cache: Promise<ShopData | null> | null = null;
const load = () =>
  (cache ??= fetch("/api/products")
    .then((r) => (r.ok ? (r.json() as Promise<ShopData>) : null))
    .catch(() => null)
    .then((d) => {
      if (!d) cache = null; // lỗi thì lần mở sau thử lại
      return d;
    }));

const LIMIT = 6;
const resultsUrl = (q: string) => `/products?q=${encodeURIComponent(q.trim())}`;

export function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<ShopData | null | undefined>(undefined);
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const id = useId();

  useEffect(() => {
    let alive = true;
    load().then((d) => alive && setData(d));
    input.current?.focus();
    document.documentElement.style.overflow = "hidden";
    return () => {
      alive = false;
      document.documentElement.style.overflow = "";
    };
  }, []);

  const { list, total } = useMemo(() => {
    if (!data) return { list: [], total: 0 };
    if (!query.trim()) return { list: data.products.slice(0, 4), total: 0 };
    const all = searchProducts(data.products, data.categories, query, data.concepts);
    return { list: all.slice(0, LIMIT), total: all.length };
  }, [data, query]);
  const catName = useMemo(() => new Map(data?.categories.map((c) => [c.id, c.name])), [data]);

  // Mở: nền mờ dần, khung trượt xuống. Kết quả đổi thì các dòng hiện so le.
  // Chỉ đổi opacity (không autoAlpha): khung phải "visible" ngay để ô nhập nhận focus
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.from("[data-search-backdrop]", { opacity: 0, duration: 0.4 });
        gsap.from("[data-search-panel]", { yPercent: -12, opacity: 0, duration: 0.6, ease: "power3.out" });
      });
    },
    { scope: root },
  );
  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        // fromTo (không from): gõ nhanh làm hiệu ứng chạy chồng — from sẽ lấy trạng thái đang mờ dở làm đích, dòng bị kẹt mờ
        gsap.fromTo("[data-search-item]", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.04, ease: "power2.out", overwrite: true });
      });
    },
    { scope: root, dependencies: [list] },
  );

  const close = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !root.current) return onClose();
    gsap.to(root.current.querySelector("[data-search-panel]"), { yPercent: -8, opacity: 0, duration: 0.3, ease: "power2.in" });
    gsap.to(root.current.querySelector("[data-search-backdrop]"), { opacity: 0, duration: 0.3, onComplete: onClose });
  };
  const go = (href: string) => {
    router.push(href);
    onClose();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return close();
    if (e.key === "Tab") {
      // Giữ Tab trong hộp
      const items = [...root.current!.querySelectorAll<HTMLElement>("a[href], button, input")];
      const [first, last] = [items[0], items[items.length - 1]];
      const edge = e.shiftKey ? first : last;
      if (document.activeElement === edge) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
      return;
    }
    if (document.activeElement !== input.current) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (list.length) setActive((a) => (e.key === "ArrowDown" ? (a + 1) % list.length : (a - 1 + list.length) % list.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && list[active]) go(productUrl(list[active]));
      else if (query.trim()) go(resultsUrl(query));
    }
  };

  const hint = data === undefined ? t.loading : data === null ? t.error : !query.trim() ? t.suggest : total ? t.found(total) : t.none(query.trim());

  return createPortal(
    <div ref={root} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} onKeyDown={onKeyDown} className="fixed inset-0 z-[70]">
      <div data-search-backdrop aria-hidden onClick={close} className="absolute inset-0 bg-night/55 backdrop-blur-[2px]" />
      <div data-search-panel className="relative max-h-[88svh] overflow-y-auto bg-cream pt-6 pb-10 shadow-[0_30px_60px_-30px_rgb(40_39_32/0.5)] md:pt-10 md:pb-14">
        <Container>
          <div className="flex items-center justify-between">
            <p id={`${id}-title`} className="eyebrow">
              {t.title}
            </p>
            <button type="button" onClick={close} className="link-sm -mr-2 inline-flex min-h-10 items-center gap-2 px-2 text-ink uppercase transition-colors hover:text-wine">
              {t.close} <span aria-hidden>✕</span>
            </button>
          </div>

          <div className="relative mt-4 flex items-center gap-4 border-b border-ink/40 focus-within:border-wine md:mt-6">
            <svg aria-hidden viewBox="0 0 24 24" className="size-6 shrink-0 text-muted md:size-7">
              <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <input
              ref={input}
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(-1);
              }}
              placeholder={t.placeholder}
              aria-label={t.placeholder}
              role="combobox"
              aria-expanded={list.length > 0}
              aria-controls={`${id}-list`}
              aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
              autoComplete="off"
              className="display w-full min-w-0 bg-transparent py-3 text-[28px] text-ink outline-none placeholder:text-muted/60 focus-visible:outline-none md:py-4 md:text-[44px] [&::-webkit-search-cancel-button]:hidden"
            />
          </div>

          <p role="status" className="mt-6 text-[11px] tracking-[0.12em] text-muted uppercase">
            {hint}
          </p>

          {list.length > 0 && (
            <ul id={`${id}-list`} role="listbox" aria-label={t.title} className="mt-4 grid grid-cols-1 gap-x-10 md:grid-cols-2">
              {list.map((p, i) => (
                <li key={p.id} id={`${id}-opt-${i}`} role="option" aria-selected={i === active} data-search-item className="border-b border-rule/70">
                  <Link
                    href={productUrl(p)}
                    onClick={onClose}
                    onPointerEnter={() => setActive(i)}
                    tabIndex={-1}
                    className={cx("flex items-center gap-4 py-3 transition-colors duration-200", i === active && "bg-rule/20")}
                  >
                    <span className="relative size-14 shrink-0 overflow-hidden bg-rule/30">
                      {p.images[0] && <Image src={cloudinary(p.images[0], 160)} alt="" fill unoptimized sizes="56px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="display block truncate text-[20px] text-wine">{p.name}</span>
                      <span className="block truncate text-[11px] text-muted">{[catName.get(p.categoryId), p.scent].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className="shrink-0 text-[12px] text-muted tabular-nums">{formatPrice(p.salePrice ?? p.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {(total > 0 || (data && query.trim() && !total)) && (
            <Link href={total ? resultsUrl(query) : "/products"} onClick={onClose} className="link-sm group mt-8 inline-flex items-center gap-3 text-wine uppercase">
              <span className="relative">
                {total ? t.all(total) : t.browse}
                <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-current transition-transform duration-500 group-hover:scale-x-100" />
              </span>
              <span aria-hidden>→</span>
            </Link>
          )}
        </Container>
      </div>
    </div>,
    document.body,
  );
}
