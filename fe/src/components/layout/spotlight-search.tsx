"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Command } from "cmdk";
import {
  ArrowRightIcon,
  ClockIcon,
  FileTextIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { StarRating } from "@/components/product/star-rating";
import { useRouter } from "@/i18n/navigation";
import { formatPrice, products, type Product } from "@/lib/data";
import { clearRecent, matches, normalize, readRecent, saveRecent } from "@/lib/search";
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/stores/search-store";

const pages = [
  { key: "home", href: "/" },
  { key: "shop", href: "/shop" },
  { key: "newArrivals", href: "/shop?sort=newest" },
  { key: "sale", href: "/shop?sale=1" },
  { key: "about", href: "/about" },
  { key: "checkout", href: "/checkout" },
  { key: "login", href: "/login" },
  { key: "register", href: "/register" },
] as const;

const suggestions = ["Vanilla", "Moon", "Parfum"];

const itemClass =
  "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-ink outline-none data-[selected=true]:bg-peanut data-[selected=true]:text-white";

export function SpotlightSearch() {
  const t = useTranslations("Search");
  const tProduct = useTranslations("Product");
  const tShop = useTranslations("Shop");
  const router = useRouter();
  const { open, setOpen } = useSearchStore();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  // ⌘K / Ctrl+K hoặc "/" để mở từ bất kỳ đâu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, [contenteditable=true]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(!useSearchStore.getState().open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setRecent(readRecent());
      setQuery("");
    }
  };

  // Chuỗi để tìm: tên + mô tả ngắn + loại hương + độ thơm (đã dịch)
  const haystack = (p: Product) =>
    [
      p.name,
      tProduct(`taglines.${p.id}`),
      tShop(`types.${p.aromaType}`),
      tShop(`levels.${p.aromaLevel}`),
      tShop(`sizes.${p.size}`),
    ].join(" ");

  const q = query.trim();
  const productResults = q ? products.filter((p) => matches(haystack(p), q)) : products.slice(0, 4);
  const pageResults = q ? pages.filter((p) => matches(t(`pageNames.${p.key}`), q)) : [];

  const go = (href: string, remember = true) => {
    if (remember && q) saveRecent(q);
    setOpen(false);
    router.push(href);
  };

  // Mục đang chọn không phải sản phẩm → xem trước sản phẩm đầu tiên trong kết quả
  const preview = products.find((p) => `product:${p.id}` === active) ?? productResults[0];
  const nothing = q && productResults.length === 0 && pageResults.length === 0;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[60] bg-ink/25 backdrop-blur-[6px] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          className="fixed top-[10vh] left-1/2 z-[60] w-[calc(100vw-24px)] max-w-[760px] -translate-x-1/2 overflow-hidden rounded-[22px] border border-white/60 bg-cream/90 shadow-[0_30px_80px_-20px_rgba(12,13,18,0.45)] backdrop-blur-2xl transition-[opacity,transform,scale] duration-200 ease-out outline-none data-ending-style:scale-[0.97] data-ending-style:opacity-0 data-starting-style:scale-[0.97] data-starting-style:opacity-0"
          data-lenis-prevent
        >
          <Dialog.Title className="sr-only">{t("open")}</Dialog.Title>
          <Command
            shouldFilter={false}
            loop
            value={active}
            onValueChange={setActive}
            label={t("open")}
            className="flex flex-col"
          >
            {/* Ô nhập */}
            <div className="flex items-center gap-3 px-5">
              <SearchIcon className="size-6 shrink-0 text-dark-300" />
              <Command.Input
                autoFocus
                value={query}
                onValueChange={setQuery}
                placeholder={t("placeholder")}
                className="h-16 flex-1 bg-transparent text-xl text-ink outline-none placeholder:text-dark-50 md:text-2xl"
              />
            </div>

            <div className="flex border-t border-brand-100">
              <Command.List className="scrollbar-soft max-h-[min(60vh,440px)] flex-1 overflow-y-auto overscroll-contain p-2 md:max-w-[60%] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-dark-300 [&_[cmdk-group-heading]]:uppercase">
                {nothing && (
                  <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                    <p className="text-lg text-ink">{t("empty", { query: q })}</p>
                    <p className="text-sm text-dark-300">{t("emptyHint")}</p>
                  </div>
                )}

                {!q && recent.length > 0 && (
                  <Command.Group
                    heading={
                      <span className="flex items-center justify-between">
                        {t("recent")}
                        <button
                          type="button"
                          onClick={() => {
                            clearRecent();
                            setRecent([]);
                          }}
                          className="cursor-pointer text-xs font-normal tracking-normal normal-case hover:text-ink"
                        >
                          {t("clearRecent")}
                        </button>
                      </span>
                    }
                  >
                    {recent.map((r) => (
                      <Command.Item key={r} value={`recent:${r}`} onSelect={() => setQuery(r)} className={itemClass}>
                        <ClockIcon className="size-4 opacity-60" />
                        <span className="flex-1 truncate">{r}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {!q && recent.length === 0 && (
                  <Command.Group heading={t("suggestions")}>
                    {suggestions.map((s) => (
                      <Command.Item key={s} value={`suggest:${s}`} onSelect={() => setQuery(s)} className={itemClass}>
                        <SparklesIcon className="size-4 opacity-60" />
                        <span className="flex-1">{s}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {productResults.length > 0 && (
                  <Command.Group heading={t("products")}>
                    {productResults.map((p) => (
                      <Command.Item
                        key={p.id}
                        value={`product:${p.id}`}
                        onSelect={() => go(`/products/${p.slug}`)}
                        className={itemClass}
                      >
                        <span className="relative size-10 shrink-0 overflow-hidden rounded-lg">
                          <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-base font-semibold">
                            <Highlight text={p.name} query={q} />
                          </span>
                          <span className="truncate text-xs opacity-70">{tProduct(`taglines.${p.id}`)}</span>
                        </span>
                        <span className="text-sm">{formatPrice(p.salePrice ?? p.price)}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {pageResults.length > 0 && (
                  <Command.Group heading={t("pages")}>
                    {pageResults.map((p) => (
                      <Command.Item key={p.key} value={`page:${p.key}`} onSelect={() => go(p.href)} className={itemClass}>
                        <FileTextIcon className="size-4 opacity-60" />
                        <span className="flex-1">
                          <Highlight text={t(`pageNames.${p.key}`)} query={q} />
                        </span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {q && productResults.length > 0 && (
                  <Command.Item
                    value="view-all"
                    onSelect={() => go(`/shop?q=${encodeURIComponent(q)}`)}
                    className={cn(itemClass, "mt-1")}
                  >
                    <ArrowRightIcon className="size-4 opacity-60" />
                    <span className="flex-1 truncate">{t("viewAll", { query: q })}</span>
                  </Command.Item>
                )}
              </Command.List>

              {/* Xem trước kiểu Spotlight */}
              <div className="hidden w-[40%] border-l border-brand-100 md:block">
                <AnimatePresence mode="wait">
                  {preview && (
                    <motion.div
                      key={preview.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="flex flex-col items-center gap-4 p-6 text-center"
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-[0_12px_30px_-12px_rgba(12,13,18,0.35)]">
                        <Image src={preview.image} alt={preview.name} fill sizes="280px" className="object-cover" />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <p className="text-xl font-semibold text-ink">{preview.name}</p>
                        <p className="text-sm text-dark-300">{tProduct(`taglines.${preview.id}`)}</p>
                        <StarRating value={preview.rating} starClassName="size-4" className="mt-1" />
                        <p className="mt-2 flex items-baseline gap-2 text-lg text-ink">
                          {formatPrice(preview.salePrice ?? preview.price)}
                          {preview.salePrice && (
                            <span className="text-sm text-dark-50 line-through">{formatPrice(preview.price)}</span>
                          )}
                        </p>
                        <p className="text-xs text-dark-300">
                          {tShop(`types.${preview.aromaType}`)} · {tShop(`levels.${preview.aromaLevel}`)}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </Command>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Tô đậm phần khớp với từ khóa (không phân biệt dấu) */
function Highlight({ text, query }: { text: string; query: string }) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return <>{text}</>;
  const base = normalize(text);
  const marks = Array<boolean>(text.length).fill(false);
  for (const w of words) {
    let i = base.indexOf(w);
    while (i !== -1) {
      for (let k = i; k < i + w.length; k++) marks[k] = true;
      i = base.indexOf(w, i + w.length);
    }
  }
  return (
    <>
      {[...text].map((ch, i) => (
        <span key={i} className={marks[i] ? "underline decoration-2 underline-offset-2" : undefined}>
          {ch}
        </span>
      ))}
    </>
  );
}
