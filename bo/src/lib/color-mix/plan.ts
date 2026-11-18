// Đổi công thức (% màu so với bột thạch cao) thành lượng cần cân cho một mẻ (docs/pages/color-mix.md#lượng-cần-cân).
// - "Tổng bột cho khuôn" gồm cả màu: thạch cao = tổng ÷ (1 + Σ phần khô của màu) → tổng vào khuôn đúng như nhập, mực khuôn không đổi.
// - Nước tính theo thạch cao thật (tỷ lệ nước / thạch cao giữ nguyên như mẫu đổ thử). Màu nước: trừ nước có sẵn trong màu.
// - Màu quá ít để cân chính xác (dưới 20 lần mức cân): pha loãng trước 1:9 (hoặc 1:99) với bột / nước, ghi rõ gram từng thứ.
import { maxMeasured, type MixSolution } from "./model";
import type { MixMode, MixSet } from "./types";

export type MixBatch = { plaster: number; waterPer100: number; precision: number };

// Pha loãng trước: stockPigment g màu + stockBase g bột (oxit) / nước (màu nước) → cân weigh g hỗn hợp; trong đó carried g bột / nước
// tooSmall: 1:99 vẫn dưới 20 lần mức cân → cân vẫn sai nhiều (errorPercent ≈ ± nửa mức cân ÷ lượng cân), nên tăng mẻ / dùng cân chính xác hơn
export type Premix = { factor: number; stockPigment: number; stockBase: number; weigh: number; carried: number; tooSmall: boolean; errorPercent: number };

export type PlanLine = {
  id: string;
  name: string;
  percent: number;
  grams: number;
  // Lượng màu thật vào mẻ sau khi làm tròn theo cân (cân thẳng, hoặc qua hỗn hợp pha loãng)
  rounded: number;
  drops?: number;
  // Nhỏ hơn mức cân được (và không pha loãng được)
  belowScale: boolean;
  premix?: Premix;
  // Vượt mẫu đậm nhất đã đo (> 10%): nên đổ thêm mẫu ở nồng độ này
  beyondMeasured?: number;
};

export type MixPlan = {
  lines: PlanLine[];
  totalPercent: number;
  // Tổng bột vào khuôn (như nhập), thạch cao thật trong mẻ, thạch cao cần cân (đã trừ phần nằm trong hỗn hợp pha loãng), khối lượng khô của màu
  total: number;
  plaster: number;
  plasterToWeigh: number;
  colorSolids: number;
  waterTotal: number;
  waterInColor: number;
  waterInPremix: number;
  waterToAdd: number;
  // Màu nước: nước có sẵn trong màu + dung dịch pha loãng đã vượt tổng nước cần (g) — hỗn hợp sẽ loãng hơn mẫu
  waterExcess: number;
};

const roundTo = (x: number, step: number) => Math.round(x / step) * step;

// Cân trực tiếp được nếu ≥ 20 lần mức cân (sai số ≤ 2,5%); không thì pha loãng 1:9, vẫn nhỏ thì 1:99.
// Lượng màu đem pha loãng ít nhất 1 g (dưới 1 g + 9 g bột thì khó trộn đều) và ít nhất 20 lần mức cân
function premixFor(grams: number, precision: number): Premix | undefined {
  const min = precision * 20;
  if (grams <= 0 || grams >= min) return undefined;
  const factor = grams * 10 >= min ? 10 : 100;
  const weigh = roundTo(grams * factor, precision);
  const stock = Math.max(1, min);
  return {
    factor,
    stockPigment: stock,
    stockBase: stock * (factor - 1),
    weigh,
    carried: (weigh * (factor - 1)) / factor,
    tooSmall: weigh < min,
    errorPercent: weigh > 0 ? (precision / 2 / weigh) * 100 : 100,
  };
}

export function planMix(mode: MixMode, set: MixSet, solution: MixSolution, batch: MixBatch): MixPlan {
  const { precision } = batch;
  const waterShare = mode === "liquid" ? (set.waterContent ?? 0) / 100 : 0;
  const drop = mode === "liquid" ? (set.dropGrams ?? 0) : 0;
  const entries = Object.entries(solution.percents).filter(([id]) => set.pigments.some((p) => p.id === id));
  const totalPercent = entries.reduce((s, [, pct]) => s + pct, 0);
  // Phần khô của màu (oxit: cả màu; màu nước: phần không phải nước) cộng vào tổng bột
  const plaster = batch.plaster / (1 + (totalPercent / 100) * (1 - waterShare));

  let waterInColor = 0;
  let carriedBase = 0;
  const lines: PlanLine[] = entries.map(([id, percent]) => {
    const name = set.pigments.find((x) => x.id === id)!.name;
    const grams = (plaster * percent) / 100;
    const premix = premixFor(grams, precision);
    const rounded = premix ? premix.weigh / premix.factor : roundTo(grams, precision);
    waterInColor += rounded * waterShare;
    if (premix) carriedBase += premix.carried;
    const measured = maxMeasured(solution.curves[id]);
    return {
      id,
      name,
      percent,
      grams,
      rounded,
      drops: drop > 0 ? grams / drop : undefined,
      belowScale: grams > 0 && rounded <= 0,
      premix,
      beyondMeasured: measured > 0 && percent > measured * 1.1 ? measured : undefined,
    };
  });
  const colorSolids = lines.reduce((s, l) => s + l.rounded, 0) * (1 - waterShare);
  const waterTotal = (plaster * batch.waterPer100) / 100;
  const waterInPremix = mode === "liquid" ? carriedBase : 0;
  return {
    lines,
    totalPercent,
    total: batch.plaster,
    plaster,
    plasterToWeigh: Math.max(0, plaster - (mode === "oxide" ? carriedBase : 0)),
    colorSolids,
    waterTotal,
    waterInColor,
    waterInPremix,
    waterToAdd: Math.max(0, waterTotal - waterInColor - waterInPremix),
    waterExcess: Math.max(0, waterInColor + waterInPremix - waterTotal),
  };
}

// Số chữ số thập phân theo độ chính xác của cân (0,01 g → 2)
export const decimalsOf = (precision: number) => Math.max(0, Math.round(-Math.log10(precision)));

const num = (x: number, d: number) => x.toLocaleString("vi-VN", { minimumFractionDigits: d, maximumFractionDigits: d });
export const formatGrams = (x: number, d: number) => `${num(x, d)} g`;
// Lượng màu nhỏ (qua pha loãng): ít nhất d + 1 chữ số thập phân và 2 chữ số có nghĩa (0,0044 g, không ra "0,00 g")
export const formatSmallGrams = (x: number, d: number) => formatGrams(x, x > 0 ? Math.max(d + 1, Math.ceil(-Math.log10(x)) + 1) : d);
export const formatPercent = (x: number) => `${x.toLocaleString("vi-VN", { maximumFractionDigits: 3 })}%`;

// Câu hướng dẫn pha loãng, ghi rõ gram: "Trộn 2 g Đỏ oxit + 18 g bột thạch cao cho thật đều, rồi cân 1,6 g hỗn hợp này."
export function premixText(mode: MixMode, l: PlanLine, d: number) {
  const p = l.premix!;
  const base = mode === "liquid" ? "nước" : "bột thạch cao";
  const what = mode === "liquid" ? "dung dịch" : "hỗn hợp";
  return `${mode === "liquid" ? "Pha" : "Trộn"} ${formatGrams(p.stockPigment, d)} ${l.name} + ${formatGrams(p.stockBase, d)} ${base} cho thật đều, rồi cân ${formatGrams(p.weigh, d)} ${what} này (phần thừa cất dùng lần sau).`;
}

// Văn bản để sao chép (gửi Zalo, dán ghi chú) — theo đúng thứ tự cân
export function planText(mode: MixMode, target: string, solution: MixSolution, plan: MixPlan, batch: MixBatch) {
  const d = decimalsOf(batch.precision);
  const pd = Math.min(d, 1);
  return [
    `[${mode === "oxide" ? "Bột oxit" : "Màu nước"}] Màu ${target} (dự đoán ${solution.hex}, ΔE ${solution.deltaE.toFixed(1)})`,
    `Tổng bột vào khuôn: ${formatGrams(plan.total, 0)}`,
    ...plan.lines.map((l) =>
      l.premix
        ? `- ${l.name}: ${premixText(mode, l, d)} (= ${formatSmallGrams(l.rounded, d)} ${l.name})`
        : `- ${l.name}: ${formatGrams(l.rounded, d)}${l.drops !== undefined ? ` (≈ ${num(l.drops, 1)} giọt)` : ""}`,
    ),
    `- Bột thạch cao: ${formatGrams(plan.plasterToWeigh, pd)}`,
    `- Nước cần thêm: ${formatGrams(plan.waterToAdd, mode === "liquid" ? 1 : 0)}`,
  ].join("\n");
}
