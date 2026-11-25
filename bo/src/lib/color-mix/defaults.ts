// Dữ liệu minh họa cho trang Pha màu — chưa phải màu đo thật, trang hiện cảnh báo tới khi chủ shop sửa (demo = false)
import { DEFAULT_WATER, type ColorMixData, type MixPrefs, type MixSet } from "./types";

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

export const defaultColorMix = (): ColorMixData => ({ version: 3, sets: { oxide: oxide(), liquid: liquid() }, comboChecks: [] });

// Bản lưu thiếu bộ nào thì bù bằng dữ liệu minh họa của bộ đó
// Tỷ lệ nước còn là mặc định cũ thì đổi thành mặc định mới (35 ml nước / 100 g tổng bột): bản 1 lưu 70, bản 1–2 lưu 37.
// Ô nước ở tab Pha màu (prefs.water) còn 37 thì bỏ — theo tỷ lệ lúc đổ mẫu
export function migrateColorMix(saved: { version?: number; sets?: Partial<Record<"oxide" | "liquid", MixSet>>; comboChecks?: unknown; prefs?: unknown } | null | undefined): ColorMixData {
  const base = defaultColorMix();
  if (!saved?.sets) return base;
  const version = saved.version ?? 1;
  const oldDefault = (w: number | undefined) => (version < 2 && w === 70) || (version < 3 && w === 37);
  const fix = (s: MixSet | undefined, d: MixSet): MixSet => {
    if (!(s && typeof s.base === "string" && Array.isArray(s.pigments))) return d;
    const water = oldDefault(s.waterPer100) ? DEFAULT_WATER : s.waterPer100;
    return { ...d, ...s, waterPer100: water ?? DEFAULT_WATER, checks: s.checks ?? [] };
  };
  const comboChecks = Array.isArray(saved.comboChecks) ? (saved.comboChecks as ColorMixData["comboChecks"]) : [];
  const prefs: NonNullable<ColorMixData["prefs"]> = saved.prefs && typeof saved.prefs === "object" ? { ...(saved.prefs as ColorMixData["prefs"]) } : {};
  for (const [view, p] of Object.entries(prefs) as [keyof typeof prefs, MixPrefs][])
    if (p && oldDefault(p.water)) prefs[view] = { ...p, water: undefined };
  return { version: 3, sets: { oxide: fix(saved.sets.oxide, base.sets.oxide), liquid: fix(saved.sets.liquid, base.sets.liquid) }, comboChecks, prefs };
}
