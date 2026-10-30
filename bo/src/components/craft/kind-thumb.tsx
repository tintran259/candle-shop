import type { StepKind } from "@/lib/craft/types";

const line = "#d9cfc6";
const accent = "#b5652e";

// Hình minh họa nhỏ của từng component — giúp admin hình dung trước khi chọn
export function KindThumb({ kind }: { kind: StepKind }) {
  return (
    <svg viewBox="0 0 120 64" aria-hidden width="100%" height={64} style={{ display: "block" }}>
      <rect width="120" height="64" rx="10" fill="#f6f6f3" />
      {kind === "vessel" && (
        <>
          {[18, 50, 82].map((x, i) => (
            <g key={x}>
              <rect x={x} y="12" width="22" height="26" rx="4" fill="#fff" stroke={i === 0 ? accent : line} strokeWidth={i === 0 ? 2 : 1} />
              <path d={`M${x + 5} 22 h12 v12 q0 2 -2 2 h-8 q-2 0 -2 -2z`} fill={["#e4dcd0", "#dfe7e6", "#9a5a26"][i]} />
            </g>
          ))}
          {[18, 46, 74].map((x, i) => (
            <rect key={x} x={x} y="44" width="24" height="10" rx="5" fill="#fff" stroke={i === 1 ? accent : line} />
          ))}
        </>
      )}
      {kind === "cards" &&
        [10, 46, 82].map((x, i) => (
          <g key={x}>
            <rect x={x} y="10" width="28" height="44" rx="6" fill="#fff" stroke={i === 0 ? accent : line} strokeWidth={i === 0 ? 2 : 1} />
            <rect x={x + 6} y="16" width="16" height="16" rx="4" fill={["#f6efe2", "#fbf7ef", "#f0d48a"][i]} />
            <rect x={x + 5} y="38" width="18" height="4" rx="2" fill={line} />
            <rect x={x + 8} y="46" width="12" height="3" rx="1.5" fill={line} />
          </g>
        ))}
      {kind === "swatches" &&
        ["#f3ead8", "#e6cfae", "#a9b59a", "#a07c62", "#f0b3a8"].map((c, i) => (
          <circle key={c} cx={18 + i * 21} cy="32" r="8" fill={c} stroke={i === 2 ? accent : line} strokeWidth={i === 2 ? 2.5 : 1} />
        ))}
      {kind === "blend" && (
        <>
          <rect x="12" y="14" width="96" height="8" rx="4" fill="#ececea" />
          <rect x="12" y="14" width="50" height="8" rx="4" fill="#f3d9a4" />
          <rect x="62" y="14" width="30" height="8" fill="#b9a6d6" />
          <rect x="92" y="14" width="16" height="8" rx="4" fill="#a8794f" />
          {[32, 46].map((y, i) => (
            <g key={y}>
              <rect x="12" y={y} width="22" height="5" rx="2.5" fill={line} />
              <rect x="40" y={y + 1} width="56" height="3" rx="1.5" fill="#ececea" />
              <circle cx={i === 0 ? 74 : 58} cy={y + 2.5} r="4" fill="#fff" stroke={accent} strokeWidth="2" />
            </g>
          ))}
        </>
      )}
      {kind === "inputs" && (
        <>
          <rect x="12" y="10" width="96" height="14" rx="4" fill="#fff" stroke={line} />
          <rect x="18" y="15" width="34" height="4" rx="2" fill={line} />
          <rect x="12" y="28" width="96" height="14" rx="4" fill="#fff" stroke={line} />
          <rect x="12" y="47" width="10" height="10" rx="3" fill={accent} />
          <path d="M14.5 52 l2.5 2.5 l4 -5" stroke="#fff" strokeWidth="1.6" fill="none" />
          <rect x="27" y="50" width="34" height="4" rx="2" fill={line} />
        </>
      )}
    </svg>
  );
}
