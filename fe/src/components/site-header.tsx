"use client";
// Thanh thông báo + điều hướng (Figma: Announcement + Navigation). Chữ thông báo, logo sáng / tối từ BO › Giao diện web (chrome).
// overHero (trang chủ): trong suốt trên hero, chữ sáng; qua hero: nền kem, chữ tối. Trang khác: luôn nền kem. Cuộn xuống ẩn, cuộn lên hiện.
// Mục đang xem có gạch chân. Nút Tìm kiếm (hoặc Ctrl / ⌘ + K) mở hộp tìm kiếm. Điện thoại: nút kính lúp + nút Menu mở lớp phủ.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { brand, nav } from "@/content/home";
import type { Chrome } from "@/lib/home";
import { gsap, MOTION_OK, MOTION_REDUCE, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { BrandLogo, cx } from "@/components/ui/primitives";
import { SearchDialog } from "@/components/search/search-dialog";
import { lockScroll } from "@/lib/scroll-lock";

const SearchIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" className="size-[15px]">
    <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

const navLink = "group relative py-2 text-[11px] uppercase tracking-[0.09em]";
const underline = "absolute bottom-0 left-0 h-px w-full origin-right scale-x-0 bg-current transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100";

export function SiteHeader({ overHero = false, chrome }: { overHero?: boolean; chrome: Chrome }) {
  const root = useRef<HTMLElement>(null);
  // Lớp trượt lên / xuống khi cuộn (thanh thông báo + thanh điều hướng). Không đặt transform lên <header>: lớp menu điện thoại
  // (fixed inset-0) nằm trong header sẽ bị tính theo khung header thay vì cả màn hình — sau khi cuộn chỉ phủ phần trên
  const bar = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const [solid, setSolid] = useState(!overHero);
  // open: menu điện thoại đang (hoặc sắp) mở; shown: lớp menu còn trên trang — giữ thêm lúc đóng cho hiệu ứng kéo rèm lên chạy xong
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const toggleMenu = () => {
    if (open) return setOpen(false);
    setShown(true);
    setOpen(true);
  };
  const [searching, setSearching] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const openSearch = (from: HTMLElement | null) => {
    trigger.current = from;
    setOpen(false);
    setSearching(true);
  };
  const closeSearch = () => {
    setSearching(false);
    trigger.current?.focus();
  };

  // Ctrl / ⌘ + K mở tìm kiếm ở mọi trang
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch(document.activeElement as HTMLElement);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo("[data-intro=nav]", { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.07, delay: 0.9, ease: "power3.out" });
        gsap.fromTo("[data-intro=nav-rule]", { autoAlpha: 1, scaleX: 0 }, { scaleX: 1, duration: 1.6, delay: 0.7, ease: "power3.inOut" });
      });
      mm.add(MOTION_REDUCE, () => gsap.set("[data-intro^=nav]", { autoAlpha: 1 }));

      // Đáy hero lên tới dưới thanh thì thành nền kem; khi đó cuộn xuống ẩn thanh, cuộn lên hiện lại
      const hero = overHero ? document.getElementById("top") : null;
      let isSolid = !overHero;
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const next = !hero || hero.getBoundingClientRect().bottom <= 96;
          if (next !== isSolid) setSolid((isSolid = next));
          gsap.to(bar.current, { yPercent: isSolid && self.direction === 1 ? -100 : 0, duration: 0.45, ease: "power2.out", overwrite: "auto" });
        },
      });
    },
    { scope: root },
  );

  // Menu điện thoại: khóa cuộn trang phía sau (tới khi rèm kéo lên xong)
  useEffect(() => (shown ? lockScroll() : undefined), [shown]);
  useEffect(() => {
    if (!open) return;
    // Mở menu lúc thanh đang ẩn (vừa cuộn xuống): kéo thanh về để thấy nút Đóng
    gsap.set(bar.current, { yPercent: 0 });
    root.current?.querySelector<HTMLElement>("#mobile-menu a")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  // Hiệu ứng nền menu như tấm rèm: mở — nền kem buông từ mép trên xuống (clip-path), đường kẻ đồng chạy ngang, rồi các mục trồi lên so le;
  // đóng — các mục trôi lên mờ đi, rèm kéo ngược lên, xong mới bỏ lớp menu. Giảm chuyển động: hiện / ẩn ngay
  useGSAP(
    () => {
      const el = panel.current;
      if (!el) return;
      const items = el.querySelectorAll("[data-menu-item]");
      const rule = el.querySelector("[data-menu-rule]");
      if (window.matchMedia(MOTION_REDUCE).matches) {
        if (!open) setShown(false);
        return;
      }
      const tl = gsap.timeline({ defaults: { overwrite: "auto" } });
      if (open) {
        tl.fromTo(el, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.75, ease: "power4.inOut" })
          .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.inOut" }, 0.35)
          .fromTo(items, { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.8, stagger: 0.06, ease: "power3.out" }, 0.4);
      } else {
        tl.to(items, { yPercent: -40, autoAlpha: 0, duration: 0.3, stagger: 0.03, ease: "power2.in" })
          .to(rule, { scaleX: 0, transformOrigin: "right", duration: 0.35, ease: "power2.in" }, 0)
          .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.6, ease: "power4.inOut" }, 0.15)
          .call(() => setShown(false));
      }
    },
    { dependencies: [open, shown] },
  );

  const light = !solid && !shown;
  const tone = light ? "text-linen" : "text-ink";
  return (
    // header không nhận chuột (thanh trượt lên vẫn để lại khung trống); thanh và menu nhận lại
    <header ref={root} className="pointer-events-none fixed top-0 right-(--lock-gap,0px) left-0 z-50">
      <div ref={bar} className="pointer-events-auto">
        {chrome.announcement && <p className="bg-night px-5 py-[7px] text-center text-[10px] leading-[14px] tracking-[0.1em] text-[#f8f5ee]">{chrome.announcement}</p>}
        <div className={cx("transition-colors duration-500", solid && !shown && "bg-cream/92 backdrop-blur")}>
          <div
            className={cx(
              "relative mx-auto grid max-w-[1440px] grid-cols-[1fr_auto] items-center px-5 transition-[height] duration-500 md:grid-cols-[1fr_auto_1fr] md:px-10 xl:px-16",
              solid ? "h-16" : "h-[72px] md:h-[100px]",
            )}
          >
            <Link href="/" data-intro="nav" aria-label="2510 Candle — về trang chủ" className={cx("justify-self-start py-2 transition-colors duration-500", light ? "text-linen" : "text-copper")}>
              <BrandLogo src={light ? chrome.logo.light : chrome.logo.dark} className="w-[124px] md:w-[150px]" />
            </Link>
            <nav aria-label="Điều hướng chính" className="hidden md:block">
              <ul className="flex gap-10">
                {nav.shop.map((n) => (
                  <li key={n.label} data-intro="nav">
                    <Link href={n.href} aria-current={n.href === path ? "page" : undefined} className={cx(navLink, tone)}>
                      {n.label}
                      <span className={cx(underline, n.href === path && "scale-x-100")} />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="flex items-center justify-end">
              <button
                type="button"
                data-intro="nav"
                aria-haspopup="dialog"
                aria-keyshortcuts="Control+K Meta+K"
                onClick={(e) => openSearch(e.currentTarget)}
                className={cx(navLink, "flex items-center gap-2.5 max-md:hidden", tone)}
              >
                <SearchIcon />
                {nav.search}
                <span className={underline} />
              </button>
              <button
                type="button"
                data-intro="nav"
                aria-label={nav.search}
                aria-haspopup="dialog"
                onClick={(e) => openSearch(e.currentTarget)}
                className={cx("grid size-11 place-items-center md:hidden", tone)}
              >
                <SearchIcon />
              </button>
              <button type="button" data-intro="nav" aria-expanded={open} aria-controls="mobile-menu" onClick={toggleMenu} className={cx(navLink, "-mr-3 px-3 py-3 md:hidden", tone)}>
                {open ? "Đóng" : "Menu"}
              </button>
            </div>
            {/* Đường kẻ dưới thanh, thụt lề như Figma */}
            <span data-intro="nav-rule" className={cx("absolute inset-x-5 bottom-0 h-px origin-left md:inset-x-10 xl:inset-x-16", light ? "bg-linen/35" : "bg-rule")} />
          </div>
        </div>
      </div>

      {shown && (
        <div ref={panel} id="mobile-menu" className="pointer-events-auto fixed inset-0 -z-10 flex flex-col bg-cream px-5 pt-36 pb-10 md:hidden">
          <ul className="space-y-1">
            {nav.shop.map((n) => (
              <li key={n.label} className="overflow-hidden">
                <Link data-menu-item href={n.href} onClick={() => setOpen(false)} className="display block py-1.5 text-[44px] text-wine">
                  {n.label}
                </Link>
              </li>
            ))}
            <li className="overflow-hidden">
              <button data-menu-item type="button" onClick={() => openSearch(null)} className="display block py-1.5 text-[44px] text-wine">
                {nav.search}
              </button>
            </li>
          </ul>
          <span data-menu-rule aria-hidden className="mt-auto mb-5 block h-px origin-left bg-copper/50" />
          <p data-menu-item className="eyebrow">
            {brand}
          </p>
        </div>
      )}
      {searching && <SearchDialog onClose={closeSearch} />}
    </header>
  );
}
