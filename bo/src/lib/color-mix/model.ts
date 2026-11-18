// Dự đoán màu và tìm công thức (docs/pages/color-mix.md#cách-tính).
// Mô hình Kubelka–Munk một hằng số, tính riêng từng kênh RGB tuyến tính:
// - Mỗi màu cơ bản: từ các mẫu đổ thử (bột g, màu g, màu khô) suy ra nồng độ c% và ΔK/S so với mẫu trắng.
//   Giữa các mẫu thì nội suy tuyến tính (đi qua gốc 0), vượt mẫu đậm nhất thì ngoại suy tỷ lệ theo mẫu đó.
// - Hỗn hợp: K/S = K/S(trắng) + Σ ΔK/S của từng màu → đổi lại thành màu.
import { deltaE, hexToLab, hexToLinear, isHex, linearToHex, linearToLab, normHex, type Lab, type Rgb } from "./color";
import type { MixCheck, MixPercents, MixSet, Pigment } from "./types";

const ks = (r: number) => {
  const R = Math.min(0.998, Math.max(0.002, r));
  return ((1 - R) * (1 - R)) / (2 * R);
};
const reflect = (k: number) => {
  const K = Math.max(k, 1e-7);
  return 1 + K - Math.sqrt(K * K + 2 * K);
};

export type CurvePoint = { c: number; k: Rgb };
export type Curves = Record<string, CurvePoint[]>;

const baseKs = (set: MixSet) => hexToLinear(set.base).map(ks) as Rgb;

// Điểm đo của một màu, theo nồng độ tăng dần; mẫu trùng nồng độ thì lấy trung bình
export function buildCurve(set: MixSet, p: Pigment): CurvePoint[] {
  const b = baseKs(set);
  const groups = new Map<number, Rgb[]>();
  for (const s of p.samples) {
    if (!(s.plaster > 0 && s.pigment > 0 && isHex(s.hex))) continue;
    const c = Math.round((s.pigment / s.plaster) * 100 * 10_000) / 10_000;
    const k = hexToLinear(s.hex).map((v, i) => ks(v) - b[i]) as Rgb;
    groups.set(c, [...(groups.get(c) ?? []), k]);
  }
  return [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([c, list]) => ({ c, k: [0, 1, 2].map((i) => list.reduce((s, k) => s + k[i], 0) / list.length) as Rgb }));
}

export const buildCurves = (set: MixSet): Curves => Object.fromEntries(set.pigments.map((p) => [p.id, buildCurve(set, p)]));

// Nồng độ đậm nhất đã đo của một màu (0 = chưa có mẫu)
export const maxMeasured = (curve: CurvePoint[] | undefined) => (curve?.length ? curve[curve.length - 1].c : 0);

export function evalCurve(curve: CurvePoint[], c: number): Rgb {
  if (!curve.length || c <= 0) return [0, 0, 0];
  return [0, 1, 2].map((i) => {
    let x0 = 0;
    let y0 = 0;
    for (const p of curve) {
      if (c <= p.c) return y0 + ((p.k[i] - y0) * (c - x0)) / (p.c - x0);
      x0 = p.c;
      y0 = p.k[i];
    }
    const last = curve[curve.length - 1];
    return (last.k[i] * c) / last.c;
  }) as Rgb;
}

function mixLinear(set: MixSet, pct: MixPercents, curves: Curves): Rgb {
  const k = baseKs(set);
  for (const [id, c] of Object.entries(pct)) {
    if (!(c > 0) || !curves[id]) continue;
    const d = evalCurve(curves[id], c);
    for (let i = 0; i < 3; i++) k[i] += d[i];
  }
  return k.map(reflect) as Rgb;
}

export const predictHex = (set: MixSet, pct: MixPercents, curves = buildCurves(set)) => linearToHex(mixLinear(set, pct, curves));

// Màu đại diện của một màu cơ bản (mẫu đầu tiên có mã màu)
export const pigmentSwatch = (p: Pigment) => normHex(p.samples.find((s) => isHex(s.hex))?.hex) ?? "#CCCCCC";

export type MixSolution = { percents: MixPercents; hex: string; deltaE: number; curves: Curves };

// Tìm % từng màu (trong các màu được phép) cho màu gần target nhất, tổng không quá maxTotal %.
// Tìm theo từng tọa độ, bước giảm dần, từ nhiều điểm xuất phát. Phạt nhẹ tổng lượng màu và số màu dùng — cùng độ giống thì ưu tiên công thức gọn
export function solveMix(set: MixSet, target: string, allowed: string[], maxTotal: number): MixSolution {
  const curves = buildCurves(set);
  const ids = allowed.filter((id) => curves[id]?.length);
  const goal: Lab = hexToLab(target);
  const b = baseKs(set);
  const n = ids.length;
  const score = (c: number[]) => {
    const k = [...b];
    for (let j = 0; j < n; j++) {
      if (c[j] <= 0) continue;
      const d = evalCurve(curves[ids[j]], c[j]);
      for (let i = 0; i < 3; i++) k[i] += d[i];
    }
    const total = c.reduce((s, x) => s + x, 0);
    return deltaE(goal, linearToLab(k.map(reflect))) + 0.01 * total + 0.12 * c.filter((x) => x > 0.004).length;
  };
  const starts: number[][] = [Array(n).fill(0), Array(n).fill(Math.min(0.2, maxTotal / Math.max(n, 1)))];
  for (let j = 0; j < n; j++)
    for (const v of [0.2, 1, 3]) {
      const s = Array(n).fill(0);
      s[j] = Math.min(v, maxTotal);
      starts.push(s);
    }
  let best: number[] = Array(n).fill(0);
  let bestScore = Infinity;
  for (const start of starts) {
    let c = [...start];
    let f = score(c);
    let step = 1;
    while (step > 0.0005) {
      let improved = false;
      for (let j = 0; j < n; j++)
        for (const s of [step, -step]) {
          const next = [...c];
          next[j] = Math.max(0, next[j] + s);
          if (next.reduce((a, x) => a + x, 0) > maxTotal + 1e-9) continue;
          const g = score(next);
          if (g < f - 1e-9) {
            c = next;
            f = g;
            improved = true;
          }
        }
      if (!improved) step /= 2;
    }
    if (f < bestScore) {
      bestScore = f;
      best = c;
    }
  }
  const percents: MixPercents = {};
  ids.forEach((id, j) => {
    const v = Math.round(best[j] * 1000) / 1000;
    if (v >= 0.01) percents[id] = v;
  });
  const hex = predictHex(set, percents, curves);
  return { percents, hex, deltaE: deltaE(goal, hexToLab(hex)), curves };
}

// Màu mục tiêu sáng hơn mẫu trắng: màu chỉ làm tối đi, không đạt được nếu không có bột trắng
export const lighterThanBase = (set: MixSet, target: string) => hexToLab(target)[0] > hexToLab(set.base)[0] + 1;

// So màu thật của mẫu kiểm chứng với màu dự đoán
export function checkResult(set: MixSet, check: MixCheck, curves = buildCurves(set)) {
  if (!(check.plaster > 0) || !isHex(check.hex)) return null;
  const pct: MixPercents = {};
  for (const [id, g] of Object.entries(check.grams)) if (g > 0) pct[id] = (g / check.plaster) * 100;
  const predicted = predictHex(set, pct, curves);
  return { predicted, deltaE: deltaE(hexToLab(predicted), hexToLab(check.hex)) };
}

// Sai số trung bình / lớn nhất của mô hình trên các mẫu kiểm chứng đã đo
export function modelAccuracy(set: MixSet) {
  const curves = buildCurves(set);
  const list = set.checks.map((c) => checkResult(set, c, curves)).filter((r) => r !== null);
  if (!list.length) return null;
  return { count: list.length, mean: list.reduce((s, r) => s + r.deltaE, 0) / list.length, max: Math.max(...list.map((r) => r.deltaE)) };
}
