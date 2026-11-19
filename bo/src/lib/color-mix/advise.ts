// Nên pha bằng gì (docs/pages/color-mix.md#cách-đề-xuất): với màu muốn có, tìm công thức ở cả ba loại (bột oxit, màu nước, kết hợp)
// rồi đề xuất loại tốt nhất. Chấm điểm như lúc tìm công thức (ΔE + phạt lượng màu, số màu, vượt mẫu đã đo), Kết hợp phạt thêm
// vì phải pha hai kiểu và dự đoán ghép từ hai bộ đo riêng — chỉ đề xuất khi hơn rõ
import { maxMeasured, PENALTY, solveMixCached, type MixLimit, type MixSolution } from "./model";
import { DEFAULT_PREFS, type MixMode, type MixPrefs, type MixSet, type MixView } from "./types";

const COMBO_EXTRA = 0.5;
// Lệch dưới 1 ΔE mắt khó thấy: coi như ngang nhau, khi đó cách gọn (ít màu, ít lượng, không vượt mẫu đã đo, một loại) thắng
const SEEN = 1;

// Bộ con một loại của bộ Kết hợp: chỉ màu loại đó, tính trên mẫu trắng của loại đó (giống hệt bộ gốc).
// Nhớ theo đối tượng bộ Kết hợp → cùng đối tượng mỗi lần, solveMixCached nhớ được kết quả
const parts = new WeakMap<MixSet, Partial<Record<MixMode, MixSet | null>>>();
function partOf(combo: MixSet, kind: MixMode): MixSet | null {
  let m = parts.get(combo);
  if (!m) parts.set(combo, (m = {}));
  if (m[kind] === undefined) {
    const pigments = combo.pigments.filter((p) => p.kind === kind);
    m[kind] = pigments.length ? { ...combo, base: pigments[0].base ?? combo.base, pigments, checks: [] } : null;
  }
  return m[kind];
}

// Lượng màu, số màu, % vượt mẫu đậm nhất đã đo của một công thức; điểm = ΔE + phạt (như lúc tìm công thức)
function measure(solution: MixSolution) {
  const list = Object.entries(solution.percents);
  const total = list.reduce((s, [, pct]) => s + pct, 0);
  const beyond = list.reduce((s, [id, pct]) => s + Math.max(0, pct - maxMeasured(solution.curves[id])), 0);
  const penalty = PENALTY.total * total + PENALTY.count * list.length + PENALTY.beyond * beyond;
  return { total, count: list.length, beyond, penalty };
}
const scoreOf = (s: MixSolution) => s.deltaE + measure(s).penalty;

// Công thức của một loại theo thông số đã lưu của loại đó (Kết hợp: giới hạn oxit + giới hạn màu nước riêng).
// Kết hợp: công thức chỉ một loại màu tính trên mẫu trắng của loại đó (trùng tab của loại đó); trộn hai loại thì trên mẫu trắng bộ oxit.
// Mẫu trắng hai bộ nhập lệch nhau thì trước đây Kết hợp chỉ dùng màu nước vẫn ra khác tab Màu nước một chút
export function solveView(view: MixView, set: MixSet, prefs: MixPrefs, goal: string, allowed = set.pigments.map((p) => p.id)): MixSolution {
  const maxTotal = prefs.maxTotal ?? DEFAULT_PREFS.maxTotal;
  if (view !== "combo") return solveMixCached(set, goal, allowed, Math.max(0.1, maxTotal));
  const maxLiquid = prefs.maxLiquid ?? DEFAULT_PREFS.maxLiquid;
  const ids = (kind: string) => set.pigments.filter((p) => p.kind === kind).map((p) => p.id);
  const limits: MixLimit[] = [
    { ids: ids("oxide"), max: Math.max(0, maxTotal) },
    { ids: ids("liquid"), max: Math.max(0, maxLiquid) },
  ];
  const mixed = solveMixCached(set, goal, allowed, Math.max(0.1, maxTotal + maxLiquid), limits);
  const kinds = new Set(Object.keys(mixed.percents).map((id) => set.pigments.find((p) => p.id === id)?.kind));
  const candidates = kinds.size > 1 ? [mixed] : [];
  for (const [kind, max] of [
    ["oxide", maxTotal],
    ["liquid", maxLiquid],
  ] as const) {
    const part = partOf(set, kind);
    const own = part ? allowed.filter((id) => part.pigments.some((p) => p.id === id)) : [];
    if (part && own.length && max > 0) candidates.push(solveMixCached(part, goal, own, max));
  }
  return candidates.length ? candidates.reduce((a, b) => (scoreOf(b) < scoreOf(a) - 1e-9 ? b : a)) : mixed;
}

// total: tổng % (màu nước: ml / 100 g), count: số màu, beyond: tổng % vượt mẫu đậm nhất đã đo
export type MixOption = { view: MixView; set: MixSet; solution: MixSolution; total: number; count: number; beyond: number; score: number };

export function mixOption(view: MixView, set: MixSet, solution: MixSolution): MixOption {
  const { total, count, beyond, penalty } = measure(solution);
  const score = Math.max(0, solution.deltaE - SEEN) + penalty + (view === "combo" ? COMBO_EXTRA : 0);
  return { view, set, solution, total, count, beyond, score };
}

export const bestOption = (options: MixOption[]) => options.reduce((a, b) => (b.score < a.score - 1e-9 ? b : a));

const de = (x: number) => x.toLocaleString("vi-VN", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

// Một câu giải thích vì sao đề xuất / không đề xuất
export function optionNote(o: MixOption, best: MixOption, options: MixOption[]): string {
  const d = o.solution.deltaE;
  if (!o.count && d >= 1) return "Chưa có màu nào tạo được màu này.";
  if (o === best) {
    if (d >= 5) return "Gần nhất trong ba cách nhưng vẫn khác rõ — cần thêm một màu có sắc gần màu muốn có.";
    const closest = Math.min(...options.map((x) => x.solution.deltaE));
    const why = o.beyond > 0.05 ? " Có màu vượt mẫu đã đo — nên đổ thêm mẫu để chắc." : "";
    if (d <= closest + 0.05) return `Gần màu nhất, ${o.count} màu.${why}`;
    return `Chỉ lệch hơn cách gần nhất ${de(d - closest)} ΔE (mắt khó thấy) nhưng gọn hơn, ${o.count} màu.${why}`;
  }
  if (d >= 5) return "Không pha được màu này (lệch rõ).";
  const diff = d - best.solution.deltaE;
  if (diff >= SEEN) return `Lệch hơn ${de(diff)} ΔE.`;
  const why = [o.beyond > 0.05 && "phải dùng vượt mẫu đã đo", o.view === "combo" && "phải dùng cả hai loại màu", o.count > best.count && `cần ${o.count} màu`].filter(Boolean);
  const head = diff < -0.05 ? `Gần hơn ${de(-diff)} ΔE (mắt khó thấy)` : "Lệch tương đương";
  return why.length ? `${head} nhưng ${why.join(", ")}.` : `${head} — dùng cách nào cũng được.`;
}
