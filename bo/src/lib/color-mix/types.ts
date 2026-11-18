// Dữ liệu Pha màu (docs/pages/color-mix.md). Hai bộ riêng: bột oxit và màu nước — mỗi bộ có mẫu trắng, màu cơ bản, mẫu kiểm chứng riêng
export type MixMode = "oxide" | "liquid";

// Một mẫu đổ thử: plaster g bột thạch cao + pigment g màu → màu đo được khi đã khô
export type MixSample = { plaster: number; pigment: number; hex: string };

export const DEFAULT_WATER = 37;

export type Pigment = { id: string; name: string; samples: MixSample[] };

// Mẫu kiểm chứng: pha theo công thức nhiều màu rồi đo màu thật, so với màu dự đoán
export type MixCheck = { id: string; name: string; plaster: number; grams: Record<string, number>; hex: string };

export type MixSet = {
  // true = còn dữ liệu minh họa, chưa sửa lần nào
  demo: boolean;
  // Màu mẫu trắng (bột + nước, không màu, đã khô)
  base: string;
  pigments: Pigment[];
  checks: MixCheck[];
  // Tỷ lệ nước khi đổ các mẫu (g / 100 g tổng bột) — pha khác tỷ lệ này thì màu khô sáng / tối khác dự đoán. Bản cũ chưa có: 37 (100 g tổng bột : 37 g nước)
  waterPer100?: number;
  // Chỉ màu nước: % nước có sẵn trong màu (trừ vào nước cần thêm) và khối lượng 1 giọt (g)
  waterContent?: number;
  dropGrams?: number;
};

// version 2: tỷ lệ nước mặc định 37 (bản 1 từng lưu sẵn 70 — mặc định cũ, chưa ai chọn — được đổi thành 37)
export type ColorMixData = { version: 2; sets: Record<MixMode, MixSet> };

// % màu so với khối lượng bột, theo id màu
export type MixPercents = Record<string, number>;

export const MODE_LABEL: Record<MixMode, string> = { oxide: "Bột oxit", liquid: "Màu nước" };
