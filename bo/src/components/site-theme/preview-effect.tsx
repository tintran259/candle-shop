// Hiệu ứng dịp lễ trong khung xem trước — bản sao fe/src/components/effects/particles.tsx + snow-drift.tsx (sửa thì sửa cả hai).
// Khác web: bắt đầu ngay (không chờ hero mở), không có nút tắt cho khách
import { useEffect, useRef } from "react";
import type { EffectKind } from "@/lib/site-theme/blocks";
import { flowerSprite, heartSprite, lixiSprite, petalSprite, sakuraSprite, snowSprite, type Sprite } from "@/lib/site-theme/effect-sprites";

// Hình hạt: scale = cỡ so với hạt thường (lì xì to hơn hoa), flip = lật qua lại như giấy rơi
type Look = { img: Sprite; scale?: number; flip?: boolean };
type Particle = { x: number; y: number; size: number; speed: number; sway: number; phase: number; alpha: number; rot: number; spin: number; look: Look };

type Recipe = {
  density: number; // hạt / px² khung hero
  max: number;
  dir: 1 | -1; // 1 rơi xuống, -1 bay lên
  sprites: () => Look[]; // chọn ngẫu nhiên — lặp một hình để nó ra nhiều hơn
  // depth 0 xa → 1 gần
  make: (depth: number) => Pick<Particle, "size" | "speed" | "sway" | "alpha" | "spin">;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

const RECIPES: Record<EffectKind, Recipe> = {
  snow: {
    density: 1 / 11000,
    max: 130,
    dir: 1,
    sprites: () => [{ img: snowSprite() }],
    make: (d) => ({ size: (1.2 + d * d * 3.3) * 2.6, speed: 18 + d * 52, sway: rand(6, 24), alpha: 0.35 + d * 0.5, spin: 0 }),
  },
  blossom: {
    density: 1 / 30000,
    max: 44,
    dir: 1,
    // Mai vàng + đào hồng, hoa nguyên bông và cánh rời
    sprites: () =>
      [
        flowerSprite("#ffd75e", "#f0a92e", "#d9822b"),
        flowerSprite("#ffd2dc", "#f39ab0", "#c9415d"),
        petalSprite("#ffd75e", "#f0a92e"),
        petalSprite("#ffc4d2", "#ee8fa8"),
        petalSprite("#ffd2dc", "#f39ab0"),
      ].map((img) => ({ img })),
    make: (d) => ({ size: 9 + d * 12, speed: 22 + d * 30, sway: rand(18, 46), alpha: 0.6 + d * 0.35, spin: rand(-1.2, 1.2) }),
  },
  sakura: {
    density: 1 / 26000,
    max: 50,
    dir: 1,
    // Hoa anh đào hồng + mai vàng (bông + cánh rời) nhiều, phong bao lì xì ít hơn, to hơn, lật qua lại
    sprites: () => {
      const sakura = { img: sakuraSprite() };
      const mai = { img: flowerSprite("#ffd75e", "#f0a92e", "#d9822b") };
      const pink = { img: petalSprite("#ffd6e2", "#f4a3bb") };
      const yellow = { img: petalSprite("#ffd75e", "#f0a92e") };
      const lixi = { img: lixiSprite(), scale: 2.1, flip: true };
      return [sakura, sakura, sakura, mai, mai, pink, pink, yellow, lixi, lixi];
    },
    make: (d) => ({ size: 10 + d * 12, speed: 24 + d * 30, sway: rand(18, 44), alpha: 0.7 + d * 0.3, spin: rand(-1, 1) }),
  },
  hearts: {
    density: 1 / 36000,
    max: 34,
    dir: -1,
    sprites: () => [heartSprite("#8f1a32", "#c9415d"), heartSprite("#c9415d", "#f2a3b5"), heartSprite("#e7849b", "#fbd3dd")].map((img) => ({ img })),
    make: (d) => ({ size: 12 + d * 14, speed: 16 + d * 26, sway: rand(10, 26), alpha: 0.45 + d * 0.4, spin: 0 }),
  },
};

const START_DELAY = 100;

function Particles({ kind }: { kind: EffectKind }) {
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
      const look = sprites[Math.floor(Math.random() * sprites.length)];
      // Lì xì: xoay ít (lắc nhẹ) thay vì quay tròn
      const spin = look.flip ? p.spin * 0.4 : p.spin;
      return { ...p, spin, size: p.size * (look.scale ?? 1), x: rand(0, w), y, phase: rand(0, Math.PI * 2), rot: look.flip ? rand(-0.4, 0.4) : rand(0, Math.PI * 2), look };
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
        // Lật: co giãn chiều ngang theo cos → mặt giấy quay qua lại
        const f = p.look.flip ? Math.cos(t * 1.8 + p.phase) : 1;
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);
        ctx.setTransform(dpr * cos * f, dpr * sin * f, -dpr * sin, dpr * cos, dpr * x, dpr * p.y);
        ctx.drawImage(p.look.img, -p.size / 2, -p.size / 2, p.size, p.size);
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

  return <canvas ref={ref} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0, transition: "opacity 1s" }} />;
}

// Lớp tuyết đọng dưới đáy hero (chỉ khi tuyết)
function SnowDrift({ mobile }: { mobile: boolean }) {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: mobile ? 26 : 56 }}>
        <defs>
          <linearGradient id="snow-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f5f2e9" stopOpacity="0.35" />
            <stop offset="1" stopColor="#f5f2e9" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="snow-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#e6dfd0" />
          </linearGradient>
        </defs>
        <path d="M0 4 C60 2 120 14 180 24 S300 40 380 44 S560 44 700 46 S920 44 1060 44 S1220 36 1290 22 S1400 0 1440 2 L1440 60 L0 60 Z" fill="url(#snow-back)" />
        <path d="M0 12 C50 10 110 20 170 32 S290 48 380 50 S560 48 720 51 S920 48 1080 50 S1230 42 1300 30 S1400 8 1440 10 L1440 60 L0 60 Z" fill="url(#snow-front)" />
      </svg>
    </div>
  );
}

export function PreviewEffect({ kind, mobile }: { kind: EffectKind; mobile: boolean }) {
  return (
    <>
      <Particles kind={kind} />
      {kind === "snow" && <SnowDrift mobile={mobile} />}
    </>
  );
}
