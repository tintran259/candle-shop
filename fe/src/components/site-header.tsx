"use client";
// Thanh thông báo + điều hướng (Figma: Announcement + Navigation).
// Trên hero: trong suốt, chữ sáng, đường kẻ mờ; qua hero: nền kem, chữ tối; cuộn xuống ẩn, cuộn lên hiện. Điện thoại: nút Menu mở lớp phủ.
import { useEffect, useRef, useState } from "react";
import { announcement, brand, nav } from "@/content/home";
import { gsap, MOTION_OK, MOTION_REDUCE, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { cx, Logo } from "@/components/ui/primitives";

const navLink = "group relative py-2 text-[11px] uppercase tracking-[0.09em]";
const underline = "absolute bottom-0 left-0 h-px w-full origin-right scale-x-0 bg-current transition-transform duration-500 group-hover:origin-left group-hover:scale-x-100";

export function SiteHeader() {
  const root = useRef<HTMLElement>(null);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);

  useGSAP(
    () => {
      const bar = root.current!;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo("[data-intro=nav]", { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.07, delay: 0.9, ease: "power3.out" });
        gsap.fromTo("[data-intro=nav-rule]", { autoAlpha: 1, scaleX: 0 }, { scaleX: 1, duration: 1.6, delay: 0.7, ease: "power3.inOut" });
      });
      mm.add(MOTION_REDUCE, () => gsap.set("[data-intro^=nav]", { autoAlpha: 1 }));

      // Đáy hero lên tới dưới thanh thì thành nền kem; khi đó cuộn xuống ẩn thanh, cuộn lên hiện lại
      const hero = document.getElementById("top");
      let isSolid = false;
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const next = !!hero && hero.getBoundingClientRect().bottom <= 96;
          if (next !== isSolid) setSolid((isSolid = next));
          gsap.to(bar, { yPercent: isSolid && self.direction === 1 ? -100 : 0, duration: 0.45, ease: "power2.out", overwrite: "auto" });
        },
      });
    },
    { scope: root },
  );

  // Menu điện thoại: khóa cuộn trang phía sau, liên kết trồi lên so le
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (!open) return;
    root.current?.querySelector<HTMLElement>("#mobile-menu a")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  useGSAP(() => {
    if (open) gsap.from("[data-menu-item]", { yPercent: 100, autoAlpha: 0, duration: 0.8, stagger: 0.06, ease: "power3.out" });
  }, [open]);

  const light = !solid && !open;
  const tone = light ? "text-linen" : "text-ink";
  return (
    <header ref={root} className="fixed inset-x-0 top-0 z-50">
      <p className="bg-night px-5 py-[7px] text-center text-[10px] leading-[14px] tracking-[0.1em] text-[#f8f5ee]">{announcement}</p>
      <div className={cx("transition-colors duration-500", solid && !open && "bg-cream/92 backdrop-blur")}>
        <div
          className={cx(
            "relative mx-auto grid max-w-[1440px] grid-cols-[1fr_auto] items-center px-5 transition-[height] duration-500 md:grid-cols-[1fr_auto_1fr] md:px-10 xl:px-16",
            solid ? "h-16" : "h-[72px] md:h-[100px]",
          )}
        >
          <a href="#top" data-intro="nav" aria-label="2510 Candle — về đầu trang" className={cx("justify-self-start py-2 transition-colors duration-500", light ? "text-linen" : "text-copper")}>
            <Logo className="w-[124px] md:w-[150px]" />
          </a>
          <nav aria-label="Điều hướng chính" className="hidden md:block">
            <ul className="flex gap-10">
              {nav.shop.map((n) => (
                <li key={n.label} data-intro="nav">
                  <a href={n.href} className={cx(navLink, tone)}>
                    {n.label}
                    <span className={underline} />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <ul className="hidden justify-end gap-10 md:flex">
            {nav.utility.map((n) => (
              <li key={n.label} data-intro="nav">
                <a href={n.href} className={cx(navLink, tone)}>
                  {n.label}
                  <span className={underline} />
                </a>
              </li>
            ))}
          </ul>
          <button type="button" data-intro="nav" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)} className={cx(navLink, "-mr-3 px-3 py-3 md:hidden", tone)}>
            {open ? "Đóng" : "Menu"}
          </button>
          {/* Đường kẻ dưới thanh, thụt lề như Figma */}
          <span data-intro="nav-rule" className={cx("absolute inset-x-5 bottom-0 h-px origin-left md:inset-x-10 xl:inset-x-16", light ? "bg-linen/35" : "bg-rule")} />
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="fixed inset-0 -z-10 flex flex-col bg-cream px-5 pt-36 pb-10 md:hidden">
          <ul className="space-y-1">
            {[...nav.shop, ...nav.utility].map((n) => (
              <li key={n.label} className="overflow-hidden">
                <a data-menu-item href={n.href} onClick={() => setOpen(false)} className="display block py-1.5 text-[44px] text-wine">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <p data-menu-item className="eyebrow mt-auto">
            {brand}
          </p>
        </div>
      )}
    </header>
  );
}
