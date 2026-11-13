"use client";
// Nút về đầu trang: hiện khi đã cuộn qua một màn hình, vòng tròn quanh nút chạy theo tiến độ cuộn cả trang.
// Bấm: cuộn mượt lên đầu (giảm chuyển động thì nhảy thẳng), đưa focus về logo để người dùng bàn phím tiếp tục từ đầu
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

const R = 22;
const C = 2 * Math.PI * R;

export function BackToTop() {
  const root = useRef<HTMLButtonElement>(null);

  useGSAP(
    () => {
      const btn = root.current!;
      gsap.set(btn, { autoAlpha: 0, y: 16 });
      ScrollTrigger.create({
        start: () => window.innerHeight,
        end: "max",
        onToggle: (self) => gsap.to(btn, { autoAlpha: self.isActive ? 1 : 0, y: self.isActive ? 0 : 16, duration: 0.4, ease: "power2.out", overwrite: true }),
      });
      gsap.fromTo("[data-progress]", { strokeDashoffset: C }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });
    },
    { scope: root },
  );

  const toTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    document.querySelector<HTMLElement>("header a")?.focus({ preventScroll: true });
  };

  return (
    <button
      ref={root}
      type="button"
      onClick={toTop}
      aria-label="Về đầu trang"
      className="group invisible fixed right-[calc(1rem+var(--lock-gap,0px))] bottom-4 z-40 grid size-12 place-items-center rounded-full bg-night/85 text-linen backdrop-blur transition-colors duration-300 hover:bg-wine md:right-[calc(2rem+var(--lock-gap,0px))] md:bottom-8 md:size-14"
    >
      <svg aria-hidden viewBox="0 0 52 52" className="absolute inset-0 size-full -rotate-90">
        <circle cx="26" cy="26" r={R} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
        <circle data-progress cx="26" cy="26" r={R} fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray={C} strokeDashoffset={C} strokeLinecap="round" />
      </svg>
      <span aria-hidden className="text-[15px] leading-none transition-transform duration-500 group-hover:-translate-y-0.5">
        ↑
      </span>
    </button>
  );
}
