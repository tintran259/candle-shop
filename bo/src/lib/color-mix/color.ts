// Đổi mã màu (hex sRGB) ↔ RGB tuyến tính ↔ CIE Lab, và độ lệch màu ΔE2000 (docs/pages/color-mix.md#cách-tính)
export type Rgb = [number, number, number];
export type Lab = [number, number, number];

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

// "#abc", "abc123", "#ABC123" → [0..1]; sai định dạng → null
export function hexToRgb(hex: string | undefined | null): Rgb | null {
  let h = (hex ?? "").trim().replace(/^#/, "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as Rgb;
}

export const rgbToHex = (c: number[]) =>
  "#" +
  c
    .map((v) =>
      Math.round(clamp(v, 0, 1) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase();

// Chuẩn về "#RRGGBB" in hoa; sai định dạng → null
export const normHex = (hex: string | undefined | null) => {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHex(rgb) : null;
};
export const isHex = (hex: string | undefined | null) => hexToRgb(hex) !== null;

export const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
export const toSrgb = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
export const hexToLinear = (hex: string) => (hexToRgb(hex) ?? [1, 1, 1]).map(toLinear) as Rgb;
export const linearToHex = (c: number[]) => rgbToHex(c.map(toSrgb));

// RGB tuyến tính → Lab (nguồn sáng D65)
export function linearToLab([r, g, b]: number[]): Lab {
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
export const hexToLab = (hex: string) => linearToLab(hexToLinear(hex));

// CIEDE2000 — dưới 1 mắt thường gần như không phân biệt được
export function deltaE([L1, a1, b1]: Lab, [L2, a2, b2]: Lab) {
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const hue = (x: number, y: number) => {
    if (x === 0 && y === 0) return 0;
    const t = Math.atan2(y, x) / rad;
    return t < 0 ? t + 360 : t;
  };
  const h1p = hue(a1p, b1);
  const h2p = hue(a2p, b2);
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * rad) / 2);
  const Lbp = (L1 + L2) / 2;
  const Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p !== 0) hbp = Math.abs(h1p - h2p) > 180 ? (h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2) : (h1p + h2p) / 2;
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const dTh = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp;
  const Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTh * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}
export const deltaEHex = (a: string, b: string) => deltaE(hexToLab(a), hexToLab(b));

// Nhãn cho người đọc: màu tag antd + câu mô tả
export function deltaELabel(d: number): { text: string; color: string } {
  if (d < 1) return { text: "Gần như trùng khớp", color: "green" };
  if (d < 2.5) return { text: "Rất gần", color: "green" };
  if (d < 5) return { text: "Khác nhẹ", color: "gold" };
  return { text: "Khác rõ, bộ màu khó đạt", color: "default" };
}

// Hiệu chỉnh màu ảnh theo mẫu trắng chụp cùng ảnh (cân bằng trắng von Kries trên RGB tuyến tính):
// màu thật ≈ màu trong ảnh × (mẫu trắng đã lưu ÷ mẫu trắng trong ảnh), từng kênh. Đèn vàng / tối / sáng của ảnh nào hiệu chỉnh theo ảnh đó
export function whiteBalance(measured: number[], whiteInPhoto: number[], whiteTrue: number[]): Rgb {
  return [0, 1, 2].map((i) => clamp((measured[i] * whiteTrue[i]) / Math.max(whiteInPhoto[i], 1e-4), 0, 1)) as Rgb;
}

// Chỗ bấm làm mẫu trắng có hợp lý không: tối quá (L* < 40) thì gần như chắc bấm nhầm — hiệu chỉnh sẽ làm sai cả ảnh
export const whiteRefTooDark = (whiteInPhoto: number[]) => linearToLab(whiteInPhoto)[0] < 40;
