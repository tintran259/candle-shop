"use client";
// Hạt trên hero theo dịp lễ: tuyết rơi (Noel), hoa mai / đào rơi xoay (Tết), tim bay lên (Valentine).
// Canvas phủ hero, không chặn bấm, trình đọc màn hình bỏ qua. Nhẹ: bắt đầu sau khi hero mở xong, ít hạt (điện thoại một nửa),
// dừng khi hero ra khỏi màn hình / đổi tab, tắt khi bật "giảm chuyển động". Hạt gần to hơn, nhanh hơn, rõ hơn → có chiều sâu
import { useEffect, useRef } from "react";
import type { EffectKind } from "@/lib/blocks";
import { flowerSprite, heartSprite, petalSprite, snowSprite, type Sprite } from "./sprites";

type Particle = { x: number; y: number; size: number; speed: number; sway: number; phase: number; alpha: number; rot: number; spin: number; sprite: Sprite };

type Recipe = {
  density: number; // hạt / px² khung hero
  max: number;
  dir: 1 | -1; // 1 rơi xuống, -1 bay lên
  sprites: () => Sprite[];
  // depth 0 xa → 1 gần
  make: (depth: number) => Pick<Particle, "size" | "speed" | "sway" | "alpha" | "spin">;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

const RECIPES: Record<EffectKind, Recipe> = {
  snow: {
    density: 1 / 11000,
    max: 130,
    dir: 1,
    sprites: () => [snowSprite()],
    make: (d) => ({ size: (1.2 + d * d * 3.3) * 2.6, speed: 18 + d * 52, sway: rand(6, 24), alpha: 0.35 + d * 0.5, spin: 0 }),
  },
  blossom: {
    density: 1 / 30000,
    max: 44,
    dir: 1,
    // Mai vàng + đào hồng, hoa nguyên bông và cánh rời
    sprites: () => [
      flowerSprite("#ffd75e", "#f0a92e", "#d9822b"),
      flowerSprite("#ffd2dc", "#f39ab0", "#c9415d"),
      petalSprite("#ffd75e", "#f0a92e"),
      petalSprite("#ffc4d2", "#ee8fa8"),
      petalSprite("#ffd2dc", "#f39ab0"),
    ],
    make: (d) => ({ size: 9 + d * 12, speed: 22 + d * 30, sway: rand(18, 46), alpha: 0.6 + d * 0.35, spin: rand(-1.2, 1.2) }),
  },
  hearts: {
    density: 1 / 36000,
    max: 34,
    dir: -1,
    sprites: () => [heartSprite("#8f1a32", "#c9415d"), heartSprite("#c9415d", "#f2a3b5"), heartSprite("#e7849b", "#fbd3dd")],
    make: (d) => ({ size: 12 + d * 14, speed: 16 + d * 26, sway: rand(10, 26), alpha: 0.45 + d * 0.4, spin: 0 }),
  },
};

const START_DELAY = 1200; // ms — để hero (ảnh + chữ) mở xong trước

export function Particles({ kind }: { kind: EffectKind }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const recipe = RECIPES[kind];
    const sprites = recipe.sprites();
    let parts: Particle[] = [];
    let w = 0;
    let h = 0;
    let frame = 0;
    let last = 0;
    let visible = true;
    let started = false;

    // edge: sinh ở mép vào (trên khi rơi, dưới khi bay lên); không thì rải khắp khung
    const spawn = (edge: boolean): Particle => {
      const p = recipe.make(Math.random());
      const y = edge ? (recipe.dir > 0 ? -p.size - rand(0, 40) : h + p.size + rand(0, 40)) : rand(0, h);
      return { ...p, x: rand(0, w), y, phase: rand(0, Math.PI * 2), rot: rand(0, Math.PI * 2), sprite: sprites[Math.floor(Math.random() * sprites.length)] };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(recipe.max, Math.round(w * h * recipe.density * (w < 768 ? 0.5 : 1)));
      parts = parts.slice(0, count);
      while (parts.length < count) parts.push(spawn(false));
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05); // đổi tab về không nhảy cóc
      last = now;
      const t = now / 1000;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = canvas.width / (w || 1);
      for (const p of parts) {
        p.y += p.speed * dt * recipe.dir;
        p.rot += p.spin * dt;
        if (recipe.dir > 0 ? p.y - p.size > h : p.y + p.size < 0) Object.assign(p, spawn(true));
        const x = p.x + Math.sin(t * 0.6 + p.phase) * p.sway;
        // Tim bay lên chỉ lắc nhẹ; hoa xoay tròn
        const rot = p.spin ? p.rot : kind === "hearts" ? Math.sin(t * 0.9 + p.phase) * 0.25 : 0;
        ctx.globalAlpha = p.alpha;
        ctx.setTransform(dpr * Math.cos(rot), dpr * Math.sin(rot), -dpr * Math.sin(rot), dpr * Math.cos(rot), dpr * x, dpr * p.y);
        ctx.drawImage(p.sprite, -p.size / 2, -p.size / 2, p.size, p.size);
      }
      frame = requestAnimationFrame(tick);
    };

    const run = () => {
      cancelAnimationFrame(frame);
      if (started && visible && !document.hidden) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      run();
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", run);
    const timer = window.setTimeout(() => {
      started = true;
      canvas.style.opacity = "1";
      run();
    }, START_DELAY);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", run);
    };
  }, [kind]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-0 transition-opacity duration-[2000ms]" />;
}
