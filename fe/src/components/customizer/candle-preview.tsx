"use client";

import { motion } from "motion/react";
import { useId } from "react";
import type { CandleLook } from "@/lib/customizer/types";
import { cn } from "@/lib/utils";

// Mặt sáp (tâm elip, bán kính) và vị trí nhãn theo dáng hũ
const geometry = {
  tumbler: { y: 78, rx: 42, ry: 6, labelY: 145 },
  jar: { y: 96, rx: 38, ry: 5, labelY: 155 },
  bowl: { y: 133, rx: 66, ry: 9, labelY: 175 },
  tin: { y: 152, rx: 52, ry: 6, labelY: 184 },
} as const;

const vesselPath = {
  tumbler: "M55 72 L60 200 Q60 206 66 206 L134 206 Q140 206 140 200 L145 72 Z",
  jar: "M58 86 Q58 74 70 74 L130 74 Q142 74 142 86 L142 194 Q142 206 130 206 L70 206 Q58 206 58 194 Z",
  bowl: "M30 133 Q30 206 100 206 Q170 206 170 133 Z",
  tin: "M45 157 Q45 150 52 150 L148 150 Q155 150 155 157 L155 197 Q155 204 148 204 L52 204 Q45 204 45 197 Z",
} as const;

/**
 * Hình MINH HỌA ngọn nến theo lựa chọn (không phải ảnh chụp sản phẩm thật).
 * Vẽ bằng SVG để đổi màu/dáng tức thì mà không cần tải ảnh mới.
 */
export function CandlePreview({
  look,
  animated = true,
  lit = true,
  className,
}: {
  look: CandleLook;
  animated?: boolean;
  lit?: boolean;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const g = geometry[look.shape];
  const wickTip = g.y - (look.wick === "wood" ? 12 : 14);

  return (
    <svg viewBox="0 0 200 220" aria-hidden className={cn("h-auto w-full", className)}>
      <defs>
        <radialGradient id={`glow-${id}`}>
          <stop offset="0%" stopColor="#ffd27a" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffd27a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`shade-${id}`} x1="0" x2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0.1" />
          <stop offset="35%" stopColor="#fff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.16" />
        </linearGradient>
      </defs>

      <ellipse cx="100" cy="209" rx={look.shape === "bowl" ? 74 : 58} ry="6" fill="#3b2a1a" opacity="0.08" />

      {/* Thủy tinh: thấy sáp bên trong */}
      {look.translucent && (
        <rect x="63" y={g.y} width="74" height={202 - g.y} rx="8" fill={look.waxColor} opacity="0.95" />
      )}
      <path d={vesselPath[look.shape]} fill={look.vesselColor} opacity={look.translucent ? 0.45 : 1} />
      <path d={vesselPath[look.shape]} fill={`url(#shade-${id})`} />
      {look.translucent && <rect x="66" y="84" width="5" height="104" rx="2.5" fill="#fff" opacity="0.4" />}

      {/* Mặt sáp */}
      <ellipse cx="100" cy={g.y} rx={g.rx} ry={g.ry} fill={look.waxColor} />
      <ellipse cx="100" cy={g.y} rx={g.rx} ry={g.ry} fill="#3b2a1a" opacity="0.05" />
      <Decoration look={look} g={g} />

      {look.wick === "wood" ? (
        <rect x="93" y={wickTip} width="14" height={g.y - wickTip} rx="1" fill="#8a6a4a" />
      ) : (
        <line x1="100" y1={g.y} x2="100" y2={wickTip} stroke="#3d3e44" strokeWidth="2" strokeLinecap="round" />
      )}

      {lit && (
        <>
          <circle cx="100" cy={wickTip - 12} r="22" fill={`url(#glow-${id})`} />
          <motion.path
            d={`M100 ${wickTip - 26} C 108 ${wickTip - 14}, 106 ${wickTip}, 100 ${wickTip} C 94 ${wickTip}, 92 ${wickTip - 14}, 100 ${wickTip - 26} Z`}
            fill="#f6b04a"
            style={{ transformOrigin: `100px ${wickTip}px` }}
            animate={animated ? { scaleY: [1, 1.12, 0.96, 1.05, 1], scaleX: [1, 0.94, 1.04, 0.98, 1] } : undefined}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <path
            d={`M100 ${wickTip - 14} C 103 ${wickTip - 8}, 103 ${wickTip - 2}, 100 ${wickTip - 2} C 97 ${wickTip - 2}, 97 ${wickTip - 8}, 100 ${wickTip - 14} Z`}
            fill="#fff3d6"
          />
        </>
      )}

      {look.label && (
        <g>
          {!look.translucent && (
            <rect x="72" y={g.labelY - 13} width="56" height="20" rx="2" fill="#fbf8f0" opacity="0.9" />
          )}
          <text
            x="100"
            y={g.labelY}
            textAnchor="middle"
            fontSize="8"
            letterSpacing="1"
            fill={look.translucent ? "#fff" : "#3b2a1a"}
          >
            {look.label.slice(0, 14).toUpperCase()}
          </text>
        </g>
      )}
    </svg>
  );
}

function Decoration({ look, g }: { look: CandleLook; g: { y: number; rx: number; ry: number } }) {
  if (look.decoration === "flowers") {
    const dots: [number, string, number][] = [
      [-0.85, "#d9a3a8", 4],
      [-0.6, "#c98a5a", 3],
      [0.62, "#e3c27a", 3.5],
      [0.86, "#b9a6d6", 4],
    ];
    return (
      <g>
        {dots.map(([dx, color, r], i) => (
          <circle key={i} cx={100 + dx * g.rx} cy={g.y + (i % 2 ? 1 : -1)} r={r} fill={color} />
        ))}
      </g>
    );
  }
  if (look.decoration === "pattern") {
    return (
      <ellipse cx="100" cy={g.y} rx={g.rx * 0.65} ry={g.ry * 0.6} fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />
    );
  }
  if (look.decoration === "topper") {
    return (
      <g fill="#f0d9cf" stroke="#d8b7a6" strokeWidth="0.6">
        <ellipse cx={100 - g.rx * 0.5} cy={g.y - 2} rx="6" ry="4" />
        <ellipse cx={100 - g.rx * 0.5 + 4} cy={g.y - 4} rx="4" ry="3" />
      </g>
    );
  }
  return null;
}
