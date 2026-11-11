"use client";
// Bộ ảnh trang chi tiết: ảnh lớn vuông + hàng ảnh nhỏ (chỉ khi có từ 2 ảnh). Bấm / ← → trên ảnh nhỏ để đổi, ảnh lớn mờ dần sang ảnh mới (GSAP).
// Ảnh lỗi / chưa có ảnh thì hiện logo nhạt
import Image from "next/image";
import { useRef, useState } from "react";
import { productDetail as t } from "@/content/home";
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap";
import { cloudinary } from "@/lib/shop";
import { cx, Logo } from "@/components/ui/primitives";

export function ProductGallery({ images, name, badges }: { images: string[]; name: string; badges?: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState<string[]>([]);
  const main = useRef<HTMLDivElement>(null);
  const list = images.filter((s) => !broken.includes(s)).slice(0, 8);
  const current = list[Math.min(index, list.length - 1)];

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.fromTo("[data-gallery-main]", { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.7, ease: "power2.out", overwrite: true });
      });
    },
    { scope: main, dependencies: [current] },
  );

  const fail = (src: string) => setBroken((b) => [...b, src]);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (index + (e.key === "ArrowRight" ? 1 : -1) + list.length) % list.length;
    setIndex(next);
    (e.currentTarget.querySelectorAll("button")[next] as HTMLButtonElement | undefined)?.focus();
  };

  return (
    <div>
      <div ref={main} className="relative aspect-square overflow-hidden bg-rule/25">
        {current ? (
          <Image
            key={current}
            data-gallery-main
            src={cloudinary(current, 1400)}
            alt={list.length > 1 ? `${name} — ${t.gallery(index + 1, list.length)}` : name}
            fill
            unoptimized
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            onError={() => fail(current)}
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-rule">
            <Logo className="w-[42%]" />
          </div>
        )}
        {badges && <div className="absolute top-4 left-4 flex gap-1.5">{badges}</div>}
      </div>

      {list.length > 1 && (
        <div role="group" aria-label={name} onKeyDown={onKey} className="mt-3 grid grid-cols-5 gap-3 md:mt-4 md:grid-cols-6">
          {list.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={t.gallery(i + 1, list.length)}
              aria-current={i === index ? "true" : undefined}
              onClick={() => setIndex(i)}
              className={cx(
                "relative aspect-square overflow-hidden bg-rule/25 transition-opacity duration-300",
                i === index ? "opacity-100 ring-1 ring-wine ring-offset-2 ring-offset-cream" : "opacity-60 hover:opacity-100",
              )}
            >
              <Image src={cloudinary(src, 200)} alt="" fill unoptimized sizes="100px" onError={() => fail(src)} className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
