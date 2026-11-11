"use client";
// Hero (Figma 2:5): ảnh chiến dịch toàn khung + lớp tối nhẹ, khối chữ trái (nhãn, tiêu đề 2 dòng, đoạn văn, nút viền, ghi chú), tên thương hiệu cỡ lớn ở đáy.
// Mở trang: ảnh thu nhỏ dần + sáng lên, tiêu đề trồi từng dòng, chữ thương hiệu trồi từng chữ cái. Cuộn: ảnh trôi chậm, chữ lớn trôi ngược và mờ dần
import Image from "next/image";
import { useRef } from "react";
import { brand, hero } from "@/content/home";
import { gsap, MOTION_OK, MOTION_REDUCE, SplitText, useGSAP } from "@/lib/gsap";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const title = SplitText.create("[data-intro=title]", { type: "lines", mask: "lines" });
        const mark = SplitText.create("[data-intro=mark]", { type: "chars", mask: "chars" });
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .fromTo("[data-intro=photo]", { autoAlpha: 0, scale: 1.15 }, { autoAlpha: 1, scale: 1, duration: 2.6, ease: "power2.out" })
          .set(["[data-intro=title]", "[data-intro=mark]"], { autoAlpha: 1 }, 0.3)
          // Chữ thương hiệu lớn: từng chữ cái trồi lên so le
          .from(mark.chars, { yPercent: 105, duration: 1.5, stagger: 0.045, ease: "expo.out" }, 0.35)
          .fromTo("[data-intro=eyebrow]", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 1 }, 0.7)
          .from(title.lines, { yPercent: 110, duration: 1.3, stagger: 0.14, ease: "power4.out" }, 0.8)
          .fromTo("[data-intro=copy]", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12 }, 1.2);

        const scroll = { trigger: root.current, start: "top top", end: "bottom top", scrub: true };
        gsap.to("[data-hero-parallax]", { yPercent: 16, ease: "none", scrollTrigger: scroll });
        gsap.to("[data-intro=mark]", { yPercent: -35, opacity: 0.15, ease: "none", scrollTrigger: scroll });
        return () => {
          title.revert();
          mark.revert();
        };
      });
      mm.add(MOTION_REDUCE, () => gsap.set("[data-intro]", { autoAlpha: 1 }));
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" aria-label={brand} className="relative h-[max(640px,min(100svh,948px))] overflow-hidden bg-smoke text-linen md:h-[max(720px,min(100svh,948px))]">
      <div data-hero-parallax className="absolute inset-0">
        <div data-intro="photo" className="absolute inset-0">
          <Image src={hero.photo.src} alt={hero.photo.alt} fill priority sizes="100vw" className="object-cover object-[62%_center]" />
        </div>
      </div>
      {/* Lớp tối như Figma (17%) + đậm thêm phía trái / đáy trên màn hẹp để chữ sáng luôn đọc được */}
      <div aria-hidden className="absolute inset-0 bg-[rgb(17_17_14/0.17)]" />
      <div aria-hidden className="absolute inset-0 bg-[linear-gradient(90deg,rgb(17_17_14/0.45),transparent_60%)] md:bg-[linear-gradient(90deg,rgb(17_17_14/0.25),transparent_45%)]" />

      <div className="relative mx-auto flex h-full max-w-[1440px] flex-col px-5 pt-[150px] md:px-10 md:pt-[30vh] xl:px-16 xl:pt-[304px]">
        <p data-intro="eyebrow" className="text-[11px] tracking-[0.16em] text-sand uppercase">
          {hero.eyebrow}
        </p>
        <h1 data-intro="title" className="display mt-6 text-[clamp(40px,4.4vw,54px)] leading-[1.06] text-linen">
          {hero.title.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </h1>
        <p data-intro="copy" className="mt-7 max-w-[420px] pl-[3px] text-[14px] leading-[23px] text-mist">
          {hero.text}
        </p>
        <div data-intro="copy" className="mt-14 pl-[3px]">
          <a
            href={hero.cta.href}
            className="group relative isolate inline-flex h-11 w-[242px] items-center overflow-hidden border-[0.6px] border-[#e5dac1] px-4 text-[11px] tracking-[0.07em] text-linen transition-colors duration-500 hover:text-night"
          >
            <span aria-hidden className="absolute inset-0 -z-10 origin-bottom scale-y-0 bg-linen transition-transform duration-500 group-hover:scale-y-100" />
            {hero.cta.label}
            <span aria-hidden className="ml-4 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              ↗
            </span>
          </a>
        </div>
        <p data-intro="copy" className="mt-11 pl-[3px] text-[10px] tracking-[0.04em] text-[#ded9cb]">
          {hero.footnote.join("  /  ")}
        </p>

        {/* Câu lớn ở dải tối dưới ảnh (vị trí chữ thương hiệu 148px trong Figma), chữ có chân màu sáng */}
        <p data-intro="mark" className="display mt-auto pb-5 text-center text-[clamp(20px,7.9vw,116px)] leading-none tracking-[0.01em] whitespace-nowrap text-linen">
          {hero.mark}
        </p>
      </div>
    </section>
  );
}
