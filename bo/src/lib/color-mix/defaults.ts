// Dữ liệu minh họa cho trang Pha màu — chưa phải màu đo thật, trang hiện cảnh báo tới khi chủ shop sửa (demo = false)
import { DEFAULT_WATER, type ColorMixData, type MixSet } from "./types";

// Mỗi màu hai mẫu: 50 g bột + 0,5 g màu, 50 g bột + 1 g màu
const pigment = (id: string, name: string, light: string, dark: string) => ({
  id,
  name,
  samples: [
    { plaster: 50, pigment: 0.5, hex: light },
    { plaster: 50, pigment: 1, hex: dark },
  ],
});

const oxide = (): MixSet => ({
  demo: true,
  waterPer100: DEFAULT_WATER,
  base: "#F2EFE9",
  pigments: [
    pigment("ox-red", "Đỏ oxit", "#D8958A", "#C9786B"),
    pigment("ox-yellow", "Vàng oxit", "#E9D29E", "#E2C37E"),
    pigment("ox-black", "Đen oxit", "#8F8D8A", "#6E6C69"),
    pigment("ox-brown", "Nâu oxit", "#C6A691", "#AE8A73"),
    pigment("ox-green", "Xanh lá oxit crom", "#B6C6A9", "#9DB18D"),
    pigment("ox-blue", "Xanh dương coban", "#A9B9D8", "#8CA0C9"),
  ],
  checks: [],
});

const liquid = (): MixSet => ({
  demo: true,
  waterPer100: DEFAULT_WATER,
  base: "#F2EFE9",
  waterContent: 50,
  dropGrams: 0.05,
  pigments: [
    pigment("lq-red", "Đỏ", "#E0A093", "#D08070"),
    pigment("lq-yellow", "Vàng", "#EEDCA6", "#E8CD84"),
    pigment("lq-black", "Đen", "#A3A19E", "#83817E"),
    pigment("lq-blue", "Xanh dương", "#AFC0E0", "#8FA6D3"),
    pigment("lq-green", "Xanh lá", "#B3CCAE", "#97B98F"),
  ],
  checks: [],
});

export const defaultColorMix = (): ColorMixData => ({ version: 2, sets: { oxide: oxide(), liquid: liquid() } });
export const defaultMixSet = (mode: "oxide" | "liquid") => (mode === "oxide" ? oxide() : liquid());

// Bản lưu thiếu bộ nào thì bù bằng dữ liệu minh họa của bộ đó
// Bản 1 lưu tỷ lệ nước 70 = mặc định cũ → đổi thành mặc định mới (37 g nước / 100 g thạch cao)
export function migrateColorMix(saved: { version?: number; sets?: Partial<Record<"oxide" | "liquid", MixSet>> } | null | undefined): ColorMixData {
  const base = defaultColorMix();
  if (!saved?.sets) return base;
  const old = (saved.version ?? 1) < 2;
  const fix = (s: MixSet | undefined, d: MixSet): MixSet => {
    if (!(s && typeof s.base === "string" && Array.isArray(s.pigments))) return d;
    const water = old && s.waterPer100 === 70 ? DEFAULT_WATER : s.waterPer100;
    return { ...d, ...s, waterPer100: water ?? DEFAULT_WATER, checks: s.checks ?? [] };
  };
  return { version: 2, sets: { oxide: fix(saved.sets.oxide, base.sets.oxide), liquid: fix(saved.sets.liquid, base.sets.liquid) } };
}
