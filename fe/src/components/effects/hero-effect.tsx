"use client";
// Hiệu ứng dịp lễ trên hero (BO › Giao diện web › Hiệu ứng): hạt (tuyết / hoa / tim) + lớp tuyết đọng khi là tuyết,
// kèm nút tròn ở góc phải (trên dòng câu lớn) để khách tắt / bật — trình duyệt nhớ lựa chọn (localStorage), mặc định bật
import { useEffect, useState } from "react";
import type { EffectKind } from "@/lib/blocks";
import { Particles } from "./particles";
import { SnowDrift } from "./snow-drift";

const KEY = "2510-hieu-ung";
const NAMES: Record<EffectKind, string> = { snow: "tuyết rơi", blossom: "hoa rơi", hearts: "tim bay" };

function Icon({ kind }: { kind: EffectKind }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  if (kind === "snow")
    return (
      <g {...common}>
        <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />
        <path d="M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5" />
      </g>
    );
  if (kind === "blossom")
    return (
      <g {...common}>
        {[0, 72, 144, 216, 288].map((a) => (
          <ellipse key={a} cx="12" cy="7.2" rx="2.8" ry="4" transform={`rotate(${a} 12 12)`} />
        ))}
        <circle cx="12" cy="12" r="1.4" />
      </g>
    );
  return <path {...common} d="M12 19.5s-7-4.3-7-9.3A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.2c0 5-7 9.3-7 9.3Z" />;
}

export function HeroEffect({ kind }: { kind: EffectKind }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    try {
      // Đọc sau khi gắn (trang dựng sẵn ở máy chủ không biết lựa chọn của khách)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem(KEY) === "off") setOn(false);
    } catch {}
  }, []);

  const toggle = () => {
    setOn(!on);
    try {
      localStorage.setItem(KEY, on ? "off" : "on");
    } catch {}
  };

  return (
    <div className="pointer-events-none absolute inset-0">
      {on && (
        <>
          <Particles kind={kind} />
          {kind === "snow" && (
            <div className="snow-in">
              <SnowDrift />
            </div>
          )}
        </>
      )}
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label={`Hiệu ứng ${NAMES[kind]}`}
        title={on ? `Tắt hiệu ứng ${NAMES[kind]}` : `Bật hiệu ứng ${NAMES[kind]}`}
        className="snow-in pointer-events-auto absolute right-4 bottom-[calc(clamp(20px,7.9vw,116px)+36px)] z-10 grid size-11 place-items-center rounded-full border-[0.6px] border-[#e5dac1]/70 bg-[rgb(17_17_14/0.25)] text-linen backdrop-blur-sm transition-colors duration-300 hover:bg-linen hover:text-night focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-linen md:right-10 xl:right-16"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <Icon kind={kind} />
          {!on && <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />}
        </svg>
      </button>
    </div>
  );
}
