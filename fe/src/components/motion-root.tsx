"use client";
// Bộ điều phối hiệu ứng cuộn cho cả trang. Section chỉ gắn thuộc tính, không phải viết GSAP:
//   data-reveal="lines"  tiêu đề hiện từng dòng (chữ trồi lên khỏi mặt nạ)
//   data-reveal="chars"  từng chữ cái trồi lên so le (ATELIER, tên thương hiệu)
//   data-reveal="words"  câu trích dẫn sáng dần từng chữ theo vị trí cuộn
//   data-reveal="fade"   trồi nhẹ + hiện dần; các phần tử vào màn cùng lúc hiện so le
//   data-reveal="clip"   khung ảnh mở từ dưới lên, ảnh bên trong thu từ 1.25 về 1
//   data-reveal="line"   đường kẻ ngang chạy từ trái sang;  data-reveal="vline" vạch dọc mọc từ giữa
//   data-parallax="6"    ảnh trôi chậm hơn khi cuộn (biên độ % chiều cao)
import { useRef } from "react";
import { gsap, MOTION_OK, MOTION_REDUCE, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";

const onEnter = (el: Element, start = "top 88%") => ({ trigger: el, start, once: true });

export function MotionRoot({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = (selector: string) => gsap.utils.toArray<HTMLElement>(selector, root.current);
      const mm = gsap.matchMedia();

      mm.add(MOTION_OK, () => {
        // Tách chữ: autoSplit tách lại khi đổi font / cỡ màn, onSplit trả tween để GSAP tự dọn tween cũ
        q('[data-reveal="lines"]').forEach((el) => {
          gsap.set(el, { autoAlpha: 1 });
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (s) => gsap.from(s.lines, { yPercent: 110, duration: 1.2, stagger: 0.12, ease: "power4.out", scrollTrigger: onEnter(el) }),
          });
        });
        q('[data-reveal="chars"]').forEach((el) => {
          gsap.set(el, { autoAlpha: 1 });
          SplitText.create(el, {
            type: "chars,lines",
            mask: "lines",
            autoSplit: true,
            onSplit: (s) => gsap.from(s.chars, { yPercent: 115, duration: 1.3, stagger: 0.05, ease: "expo.out", scrollTrigger: onEnter(el) }),
          });
        });
        q('[data-reveal="words"]').forEach((el) => {
          gsap.set(el, { autoAlpha: 1 });
          SplitText.create(el, {
            type: "words",
            autoSplit: true,
            onSplit: (s) => gsap.from(s.words, { opacity: 0.12, stagger: 0.1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } }),
          });
        });

        const fades = q('[data-reveal="fade"]');
        gsap.set(fades, { autoAlpha: 0, y: 28 });
        ScrollTrigger.batch(fades, {
          start: "top 92%",
          once: true,
          onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1, ease: "power3.out", overwrite: true }),
        });

        q('[data-reveal="clip"]').forEach((el) => {
          const img = el.querySelector("img");
          const tl = gsap.timeline({ scrollTrigger: onEnter(el, "top 85%") });
          tl.fromTo(el, { autoAlpha: 1, clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut" });
          if (img) tl.from(img, { scale: 1.25, duration: 2, ease: "expo.out" }, 0.1);
        });

        q('[data-reveal="line"]').forEach((el) =>
          gsap.fromTo(el, { autoAlpha: 1, scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: 1.4, ease: "power3.inOut", scrollTrigger: onEnter(el, "top 95%") }),
        );
        q('[data-reveal="vline"]').forEach((el) => gsap.fromTo(el, { autoAlpha: 1, scaleY: 0 }, { scaleY: 1, duration: 1, delay: 0.3, ease: "power3.out", scrollTrigger: onEnter(el, "top 95%") }));

        q("[data-parallax]").forEach((el) => {
          const amount = Number(el.dataset.parallax) || 6;
          gsap.fromTo(el, { yPercent: -amount }, { yPercent: amount, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
        });
      });

      // Giảm chuyển động: hiện hết ngay, không hiệu ứng
      mm.add(MOTION_REDUCE, () => gsap.set(q("[data-reveal]"), { autoAlpha: 1 }));
    },
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}
