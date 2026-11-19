// Đổi công thức (% màu so với bột thạch cao) thành lượng cần cân cho một mẻ (docs/pages/color-mix.md#lượng-cần-cân).
// - "Tổng bột cho khuôn" gồm cả màu: thạch cao = tổng ÷ (1 + Σ phần khô của màu) → tổng vào khuôn đúng như nhập, mực khuôn không đổi.
// - Nước tính theo tổng bột vào khuôn (220 g × 37% = 81,4 g), cùng chuẩn với lúc đổ mẫu. Màu nước: trừ nước có sẵn trong màu.
// - Kết hợp: mỗi dòng theo loại của màu đó (oxit pha loãng với bột, màu nước pha loãng với nước và quy ra giọt).
// - Màu quá ít để cân chính xác (dưới 20 lần mức cân): pha loãng trước 1:9 (hoặc 1:99) với bột / nước, ghi rõ gram từng thứ.
import { maxMeasured, type MixSolution } from "./model";
import { MODE_LABEL, type MixMode, type MixSet, type MixView } from "./types";

export type MixBatch = { plaster: number; waterPer100: number; precision: number };

// Pha loãng trước theo lọ A / lọ B (giống hướng dẫn ở tab Dữ liệu mẫu, components/color-mix/collect-guide.tsx):
// lọ A (10%) = stockPigment g màu + stockBase g bột (oxit) / nước (màu nước); lọ B (1%, factor 100) = stockPigment g lọ A + stockBase g bột / nước.
// Mỗi lọ chỉ 10 × stockPigment (vd 20 g) — không trộn 2 g màu + 198 g bột. Cân weigh g lọ A / B; trong đó carried g bột / nước
// tooSmall: 1:99 vẫn dưới 20 lần mức cân → cân vẫn sai nhiều (errorPercent ≈ ± nửa mức cân ÷ lượng cân), nên tăng mẻ / dùng cân chính xác hơn
export type Premix = { factor: number; stockPigment: number; stockBase: number; weigh: number; carried: number; tooSmall: boolean; errorPercent: number };

export type PlanLine = {
  id: string;
  name: string;
  kind: MixMode;
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
  // Màu nước: nước có sẵn trong màu + dung dịch pha loãng đã vượt tổng nước cần (ml) — hỗn hợp sẽ loãng hơn mẫu
  waterExcess: number;
};

const roundTo = (x: number, step: number) => Math.round(x / step) * step;

// Cân trực tiếp được nếu ≥ 20 lần mức cân (sai số ≤ 2,5%); không thì lấy từ lọ A (10%), vẫn nhỏ thì lọ B (1%).
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
    stockBase: stock * 9,
    weigh,
    carried: (weigh * (factor - 1)) / factor,
    tooSmall: weigh < min,
    errorPercent: weigh > 0 ? (precision / 2 / weigh) * 100 : 100,
  };
}

export function planMix(view: MixView, set: MixSet, solution: MixSolution, batch: MixBatch): MixPlan {
  const { precision } = batch;
  const kindOf = (id: string): MixMode => (view === "combo" ? (set.pigments.find((p) => p.id === id)?.kind ?? "oxide") : view);
  const shareOf = (kind: MixMode) => (kind === "liquid" ? (set.waterContent ?? 0) / 100 : 0);
  const drop = set.dropGrams ?? 0;
  const entries = Object.entries(solution.percents).filter(([id]) => set.pigments.some((p) => p.id === id));
  const totalPercent = entries.reduce((s, [, pct]) => s + pct, 0);
  // Phần khô của màu (oxit: cả màu; màu nước: phần không phải nước) cộng vào tổng bột
  const dryPercent = entries.reduce((s, [id, pct]) => s + pct * (1 - shareOf(kindOf(id))), 0);
  const plaster = batch.plaster / (1 + dryPercent / 100);

  let waterInColor = 0;
  let colorSolids = 0;
  let carriedPlaster = 0;
  let carriedWater = 0;
  const lines: PlanLine[] = entries.map(([id, percent]) => {
    const kind = kindOf(id);
    const share = shareOf(kind);
    const name = set.pigments.find((x) => x.id === id)!.name;
    const grams = (plaster * percent) / 100;
    const premix = premixFor(grams, precision);
    const rounded = premix ? premix.weigh / premix.factor : roundTo(grams, precision);
    waterInColor += rounded * share;
    colorSolids += rounded * (1 - share);
    if (premix && kind === "liquid") carriedWater += premix.carried;
    else if (premix) carriedPlaster += premix.carried;
    const measured = maxMeasured(solution.curves[id]);
    return {
      id,
      name,
      kind,
      percent,
      grams,
      rounded,
      drops: kind === "liquid" && drop > 0 ? grams / drop : undefined,
      belowScale: grams > 0 && rounded <= 0,
      premix,
      beyondMeasured: measured > 0 && percent > measured * 1.1 ? measured : undefined,
    };
  });
  const waterTotal = (batch.plaster * batch.waterPer100) / 100;
  return {
    lines,
    totalPercent,
    total: batch.plaster,
    plaster,
    plasterToWeigh: Math.max(0, plaster - carriedPlaster),
    colorSolids,
    waterTotal,
    waterInColor,
    waterInPremix: carriedWater,
    waterToAdd: Math.max(0, waterTotal - waterInColor - carriedWater),
    waterExcess: Math.max(0, waterInColor + carriedWater - waterTotal),
  };
}

// Số chữ số thập phân theo độ chính xác của cân (0,01 g → 2)
export const decimalsOf = (precision: number) => Math.max(0, Math.round(-Math.log10(precision)));

const num = (x: number, d: number) => x.toLocaleString("vi-VN", { minimumFractionDigits: d, maximumFractionDigits: d });
// Đơn vị: bột (thạch cao, oxit) g; nước và màu nước ml (coi 1 ml ≈ 1 g, như nước) — số giữ nguyên, chỉ đổi đơn vị
export const unitOf = (kind: MixMode) => (kind === "liquid" ? "ml" : "g");
export const formatGrams = (x: number, d: number, unit = "g") => `${num(x, d)} ${unit}`;
// Lượng màu nhỏ (qua pha loãng): ít nhất d + 1 chữ số thập phân và 2 chữ số có nghĩa (0,0044 g, không ra "0,00 g")
export const formatSmallGrams = (x: number, d: number, unit = "g") => formatGrams(x, x > 0 ? Math.max(d + 1, Math.ceil(-Math.log10(x)) + 1) : d, unit);
export const formatPercent = (x: number) => `${x.toLocaleString("vi-VN", { maximumFractionDigits: 3 })}%`;
// Nồng độ: oxit % so với thạch cao; màu nước ml / 100 g thạch cao (cùng con số)
export const formatRate = (x: number, kind: MixMode) => (kind === "liquid" ? `${x.toLocaleString("vi-VN", { maximumFractionDigits: 3 })} ml / 100 g` : formatPercent(x));

// Pha loãng: lấy từ lọ nào, bao nhiêu ("Cân 5,9 g lọ B") và cách pha từng lọ, mỗi lọ một dòng
export const premixJar = (l: PlanLine) => (l.premix!.factor === 100 ? "B" : "A");
export function premixWeigh(l: PlanLine, d: number) {
  const liquid = l.kind === "liquid";
  return `${liquid ? "Lấy" : "Cân"} ${formatGrams(l.premix!.weigh, d, unitOf(l.kind))} lọ ${premixJar(l)} ${l.name}`;
}
export function premixSteps(l: PlanLine, d: number) {
  const p = l.premix!;
  const u = unitOf(l.kind);
  const base = l.kind === "liquid" ? "nước" : "bột thạch cao";
  const steps = [`Lọ A (10%) = ${formatGrams(p.stockPigment, d, u)} ${l.name} + ${formatGrams(p.stockBase, d, u)} ${base}`];
  if (p.factor === 100) steps.push(`Lọ B (1%) = ${formatGrams(p.stockPigment, d, u)} lọ A + ${formatGrams(p.stockBase, d, u)} ${base}`);
  return steps;
}
// Một câu (sao chép, test): "Cân 5,9 g lọ B Đỏ oxit. Lọ A (10%) = …; Lọ B (1%) = … — trộn thật đều, phần thừa cất dùng lần sau."
export const premixText = (l: PlanLine, d: number) => `${premixWeigh(l, d)}. ${premixSteps(l, d).join("; ")} — trộn thật đều, phần thừa cất dùng lần sau.`;

// Văn bản để sao chép (gửi Zalo, dán ghi chú) — theo đúng thứ tự cân
export function planText(view: MixView, target: string, solution: MixSolution, plan: MixPlan, batch: MixBatch) {
  const d = decimalsOf(batch.precision);
  const pd = Math.min(d, 1);
  return [
    `[${MODE_LABEL[view]}] Màu ${target} (dự đoán ${solution.hex}, ΔE ${solution.deltaE.toFixed(1)})`,
    `Tổng bột vào khuôn: ${formatGrams(plan.total, 0)}`,
    ...plan.lines.map((l) =>
      l.premix
        ? `- ${l.name}: ${formatSmallGrams(l.rounded, d, unitOf(l.kind))} → ${premixText(l, d)}`
        : `- ${l.name}: ${formatGrams(l.rounded, d, unitOf(l.kind))}${l.drops !== undefined ? ` (≈ ${num(l.drops, 1)} giọt)` : ""}`,
    ),
    `- Bột thạch cao: ${formatGrams(plan.plasterToWeigh, pd)}`,
    `- Nước cần thêm: ${formatGrams(plan.waterToAdd, view === "oxide" ? 0 : 1, "ml")}`,
  ].join("\n");
}
