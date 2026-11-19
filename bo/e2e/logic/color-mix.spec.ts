// Pha màu: dự đoán màu từ mẫu đổ thử, tìm công thức, đổi ra gram / nước / giọt (docs/pages/color-mix.md)
import { expect, test } from "@playwright/test";
import { deltaEHex, hexToLinear, linearToHex, normHex, whiteBalance, whiteRefTooDark } from "@/lib/color-mix/color";
import { comboSet } from "@/lib/color-mix/combo";
import { missingLadder, withLadder } from "@/lib/color-mix/ladder";
import { defaultColorMix, migrateColorMix } from "@/lib/color-mix/defaults";
import { buildCurve, checkResult, lighterThanBase, modelAccuracy, predictHex, solveMix } from "@/lib/color-mix/model";
import { planMix, premixText } from "@/lib/color-mix/plan";
import type { MixSet } from "@/lib/color-mix/types";

const oxide = () => defaultColorMix().sets.oxide;
const liquid = () => defaultColorMix().sets.liquid;
const ids = (s: MixSet) => s.pigments.map((p) => p.id);

test("Mã màu: chuẩn về #RRGGBB in hoa, sai định dạng trả null", () => {
  expect(normHex("#abc")).toBe("#AABBCC");
  expect(normHex("e3d3bc")).toBe("#E3D3BC");
  expect(normHex("#12345")).toBeNull();
  expect(deltaEHex("#E3D3BC", "#E3D3BC")).toBe(0);
});

test("Dự đoán đúng lại màu của chính mẫu đổ thử; 0% là mẫu trắng", () => {
  const s = oxide();
  const red = s.pigments.find((p) => p.id === "ox-red")!;
  // 0,5 g / 50 g = 1%, 1 g / 50 g = 2%
  expect(deltaEHex(predictHex(s, { "ox-red": 1 }), red.samples[0].hex)).toBeLessThan(0.5);
  expect(deltaEHex(predictHex(s, { "ox-red": 2 }), red.samples[1].hex)).toBeLessThan(0.5);
  expect(deltaEHex(predictHex(s, {}), s.base)).toBeLessThan(0.5);
});

test("Mẫu trùng nồng độ lấy trung bình, mẫu thiếu màu / thiếu gram bị bỏ qua", () => {
  const s = oxide();
  const p = {
    id: "x",
    name: "X",
    samples: [
      { plaster: 50, pigment: 0.5, hex: "#D0D0D0" },
      { plaster: 100, pigment: 1, hex: "#C0C0C0" },
      { plaster: 50, pigment: 2, hex: "" },
      { plaster: 0, pigment: 1, hex: "#000000" },
    ],
  };
  const curve = buildCurve(s, p);
  expect(curve.map((c) => c.c)).toEqual([1]);
});

test("Tìm công thức cho màu tạo được: lệch dưới 1 và tìm lại được công thức đã biết", () => {
  const s = oxide();
  const known = predictHex(s, { "ox-red": 1.2, "ox-yellow": 0.7 });
  const r = solveMix(s, known, ids(s), 6);
  expect(r.deltaE).toBeLessThan(1);
  expect(Object.values(r.percents).reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(6);
});

test("Chỉ dùng màu được bật, tổng không vượt giới hạn", () => {
  const s = oxide();
  const r = solveMix(s, "#7A5A48", ["ox-black", "ox-yellow"], 2);
  expect(Object.keys(r.percents).every((id) => ["ox-black", "ox-yellow"].includes(id))).toBe(true);
  expect(Object.values(r.percents).reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(2.001);
});

test("Màu sáng hơn mẫu trắng: báo không đạt được", () => {
  expect(lighterThanBase(oxide(), "#FFFFFF")).toBe(true);
  expect(lighterThanBase(oxide(), "#E3D3BC")).toBe(false);
});

test("Bột oxit: tổng bột vào khuôn giữ đúng như nhập (đã gồm màu), nước theo tổng bột", () => {
  const s = oxide();
  const sol = { percents: { "ox-red": 1, "ox-black": 0.02 }, hex: "#000000", deltaE: 0, curves: {} };
  const plan = planMix("oxide", s, sol, { plaster: 220, waterPer100: 70, precision: 0.01 });
  const red = plan.lines.find((l) => l.id === "ox-red")!;
  // Thạch cao = 220 ÷ 1,0102; màu tính trên thạch cao như mẫu đổ thử
  expect(plan.plaster).toBeCloseTo(217.778, 2);
  expect(red.grams).toBeCloseTo(2.178, 2);
  expect(red.rounded).toBeCloseTo(2.18);
  expect(red.premix).toBeUndefined();
  expect(red.drops).toBeUndefined();
  expect(plan.plaster + plan.colorSolids).toBeCloseTo(220, 1);
  // Nước = tổng bột 220 g × 70%, không phải thạch cao 217,8 g × 70%
  expect(plan.waterToAdd).toBeCloseTo(154, 1);
});

test("Pha loãng trước: ghi rõ gram màu + gram bột, cân hỗn hợp, trừ thạch cao nằm trong hỗn hợp", () => {
  const s = oxide();
  const sol = { percents: { "ox-red": 1, "ox-black": 0.02 }, hex: "#000000", deltaE: 0, curves: {} };
  const plan = planMix("oxide", s, sol, { plaster: 220, waterPer100: 70, precision: 0.01 });
  const black = plan.lines.find((l) => l.id === "ox-black")!;
  // 0,0436 g < 20 × 0,01 → trộn 1 g đen + 9 g bột (ít nhất 1 g cho dễ trộn đều), cân 0,44 g hỗn hợp (= 0,044 g đen, 0,396 g thạch cao)
  expect(black.premix).toMatchObject({ factor: 10, stockPigment: 1, stockBase: 9, tooSmall: false });
  expect(black.premix!.weigh).toBeCloseTo(0.44);
  expect(black.rounded).toBeCloseTo(0.044);
  expect(plan.plaster - plan.plasterToWeigh).toBeCloseTo(0.396);
  expect(premixText(black, 2)).toBe("Cân 0,44 g lọ A Đen oxit. Lọ A (10%) = 1,00 g Đen oxit + 9,00 g bột thạch cao — trộn thật đều, phần thừa cất dùng lần sau.");
  // Rất ít (cân 0,1 g, cần 0,15 g): 1:9 vẫn dưới 2 g → 1:99
  const tiny = planMix("oxide", s, { ...sol, percents: { "ox-red": 0.15 } }, { plaster: 100, waterPer100: 70, precision: 0.1 }).lines[0];
  // Lọ B pha từ lọ A (2 g lọ A + 18 g bột), không trộn 2 g màu + 198 g bột
  expect(tiny.premix).toMatchObject({ factor: 100, stockPigment: 2, stockBase: 18 });
  expect(premixText(tiny, 1)).toBe(
    "Cân 15,0 g lọ B Đỏ oxit. Lọ A (10%) = 2,0 g Đỏ oxit + 18,0 g bột thạch cao; Lọ B (1%) = 2,0 g lọ A + 18,0 g bột thạch cao — trộn thật đều, phần thừa cất dùng lần sau.",
  );
  expect(tiny.premix!.weigh).toBeCloseTo(15);
  expect(tiny.premix!.tooSmall).toBe(false);
  // Mẻ quá nhỏ: 1:99 vẫn chỉ cân 1 g trên cân 0,1 g → báo, sai khoảng ±5%
  const tooSmall = planMix("oxide", s, { ...sol, percents: { "ox-red": 0.05 } }, { plaster: 20, waterPer100: 70, precision: 0.1 }).lines[0];
  expect(tooSmall.premix).toMatchObject({ factor: 100, tooSmall: true });
  expect(tooSmall.premix!.errorPercent).toBeCloseTo(5);
});

test("Màu nước: phần khô của màu tính vào tổng bột, trừ nước có sẵn trong màu, quy ra số giọt", () => {
  const s = liquid(); // 50% nước, 0,05 g / giọt
  const sol = { percents: { "lq-red": 2 }, hex: "#000000", deltaE: 0, curves: {} };
  const plan = planMix("liquid", s, sol, { plaster: 100, waterPer100: 70, precision: 0.01 });
  expect(plan.plaster).toBeCloseTo(99.01, 2);
  expect(plan.lines[0].grams).toBeCloseTo(1.98, 2);
  expect(plan.lines[0].drops).toBeCloseTo(39.6, 1);
  expect(plan.waterInColor).toBeCloseTo(0.99, 2);
  expect(plan.plaster + plan.colorSolids).toBeCloseTo(100, 1);
  expect(plan.waterToAdd).toBeCloseTo(70 - 0.99, 1);
});

test("Vượt mẫu đậm nhất đã đo thì đánh dấu", () => {
  const s = oxide();
  const sol = solveMix(s, "#5A4036", ids(s), 6);
  const plan = planMix("oxide", s, sol, { plaster: 100, waterPer100: 70, precision: 0.01 });
  expect(plan.lines.some((l) => l.beyondMeasured === 2)).toBe(true);
});

test("Kiểm chứng: so màu thật với dự đoán, sai số trung bình", () => {
  const s = oxide();
  const exact = predictHex(s, { "ox-red": 1 });
  s.checks = [
    { id: "a", name: "A", plaster: 50, grams: { "ox-red": 0.5 }, hex: exact },
    { id: "b", name: "B", plaster: 50, grams: { "ox-red": 0.5 }, hex: "" },
  ];
  expect(checkResult(s, s.checks[0])!.deltaE).toBeLessThan(0.5);
  expect(checkResult(s, s.checks[1])).toBeNull();
  expect(modelAccuracy(s)).toMatchObject({ count: 1 });
});

test("Bản lưu thiếu bộ màu nước thì bù dữ liệu minh họa", () => {
  const d = migrateColorMix({ version: 1, sets: { oxide: { ...oxide(), demo: false } } } as never);
  expect(d.sets.oxide.demo).toBe(false);
  expect(d.sets.liquid.pigments.length).toBeGreaterThan(0);
});

test("Hiệu chỉnh theo mẫu trắng chụp cùng ảnh: bỏ được ánh đèn vàng / tối", () => {
  const whiteTrue = hexToLinear("#F2EFE9");
  const sample = hexToLinear("#C9786B");
  // Ảnh chụp dưới đèn vàng, thiếu sáng: mỗi kênh nhân một hệ số
  const light = [0.8, 0.62, 0.38];
  const shot = (c: number[]) => c.map((v, i) => v * light[i]);
  const fixed = linearToHex(whiteBalance(shot(sample), shot(whiteTrue), whiteTrue));
  expect(deltaEHex(linearToHex(shot(sample)), "#C9786B")).toBeGreaterThan(10);
  expect(deltaEHex(fixed, "#C9786B")).toBeLessThan(0.5);
  // Bấm nhầm vào chỗ tối thì không nhận làm mẫu trắng
  expect(whiteRefTooDark(hexToLinear("#3A3A3A"))).toBe(true);
  expect(whiteRefTooDark(shot(whiteTrue))).toBe(false);
});

test("Dữ liệu cũ chưa có tỷ lệ nước khi đổ mẫu thì mặc định 37", () => {
  const old: Partial<MixSet> = oxide();
  delete old.waterPer100;
  const d = migrateColorMix({ version: 1, sets: { oxide: { ...old, demo: false }, liquid: liquid() } } as never);
  expect(d.sets.oxide.waterPer100).toBe(37);
  expect(d.sets.oxide.demo).toBe(false);
  // Bản 1 lưu sẵn 70 (mặc định cũ) → 37; bản 2 người dùng tự chọn 70 thì giữ
  const v1 = migrateColorMix({ version: 1, sets: { oxide: { ...oxide(), waterPer100: 70 }, liquid: { ...liquid(), waterPer100: 45 } } });
  expect(v1.sets.oxide.waterPer100).toBe(37);
  expect(v1.sets.liquid.waterPer100).toBe(45);
  expect(migrateColorMix({ version: 2, sets: { oxide: { ...oxide(), waterPer100: 70 } } }).sets.oxide.waterPer100).toBe(70);
});

test("Màu nước: nước trong màu vượt tổng nước cần thì báo", () => {
  const s = liquid();
  const plan = planMix("liquid", s, { percents: { "lq-red": 20 }, hex: "#000000", deltaE: 0, curves: {} }, { plaster: 100, waterPer100: 5, precision: 0.01 });
  expect(plan.waterToAdd).toBe(0);
  expect(plan.waterExcess).toBeGreaterThan(0);
});

test("Kết hợp: dùng màu của cả hai bộ, giới hạn oxit / màu nước riêng, màu nước tính ml", () => {
  const data = defaultColorMix();
  data.comboChecks = [{ id: "c", name: "C", plaster: 50, grams: { "ox-red": 0.5 }, hex: "" }];
  const s = comboSet(data);
  expect(s.pigments.filter((p) => p.kind === "oxide").length).toBe(data.sets.oxide.pigments.length);
  expect(s.pigments.filter((p) => p.kind === "liquid").length).toBe(data.sets.liquid.pigments.length);
  expect(s.checks).toHaveLength(1);
  // Mỗi màu vẫn đúng màu mẫu đổ thử của bộ chứa nó
  const lqRed = data.sets.liquid.pigments.find((p) => p.id === "lq-red")!;
  expect(deltaEHex(predictHex(s, { "lq-red": 1 }), lqRed.samples[0].hex)).toBeLessThan(1);
  // Giới hạn riêng: oxit 0% → chỉ được dùng màu nước
  const oxIds = s.pigments.filter((p) => p.kind === "oxide").map((p) => p.id);
  const lqIds = s.pigments.filter((p) => p.kind === "liquid").map((p) => p.id);
  const sol = solveMix(s, "#C9A07A", ids(s), 6, [
    { ids: oxIds, max: 0 },
    { ids: lqIds, max: 6 },
  ]);
  expect(Object.keys(sol.percents).every((id) => lqIds.includes(id))).toBe(true);
  // Mẻ trộn: oxit g, màu nước ml + giọt, nước trừ phần có sẵn trong màu nước
  const plan = planMix("combo", s, { percents: { "ox-red": 1, "lq-yellow": 2 }, hex: "#000000", deltaE: 0, curves: {} }, { plaster: 100, waterPer100: 37, precision: 0.01 });
  const [ox, lq] = plan.lines;
  expect(ox.kind).toBe("oxide");
  expect(lq.kind).toBe("liquid");
  expect(lq.drops).toBeCloseTo(lq.grams / 0.05, 5);
  expect(ox.drops).toBeUndefined();
  expect(plan.plaster + plan.colorSolids).toBeCloseTo(100, 1);
  expect(plan.waterInColor).toBeCloseTo(lq.rounded * 0.5, 5);
  expect(premixText({ ...lq, premix: { factor: 10, stockPigment: 1, stockBase: 9, weigh: 0.44, carried: 0.396, tooSmall: false, errorPercent: 1 } }, 2)).toBe(
    "Lấy 0,44 ml lọ A Vàng. Lọ A (10%) = 1,00 ml Vàng + 9,00 ml nước — trộn thật đều, phần thừa cất dùng lần sau.",
  );
});

test("Thông số tab Pha màu (nước, cân, tổng màu tối đa) giữ qua bản lưu, bản cũ chưa có thì rỗng", () => {
  const prefs = { oxide: { water: 40, precision: 0.1, maxTotal: 4 }, combo: { maxLiquid: 3 } };
  expect(migrateColorMix({ version: 2, sets: { oxide: oxide(), liquid: liquid() }, prefs }).prefs).toEqual(prefs);
  expect(migrateColorMix({ version: 2, sets: { oxide: oxide(), liquid: liquid() } }).prefs).toEqual({});
});

test("Thang chuẩn: thêm nồng độ còn thiếu trên 50 g, bỏ qua nồng độ đã có, xếp tăng dần", () => {
  const red = oxide().pigments.find((p) => p.id === "ox-red")!; // đã có 1% và 2% (mẫu 50 g)
  expect(missingLadder(red)).toEqual([0.1, 0.25, 0.5]);
  const next = withLadder(red);
  expect(next.samples.map((s) => (s.pigment / s.plaster) * 100)).toEqual([0.1, 0.25, 0.5, 1, 2]);
  expect(next.samples[0]).toEqual({ plaster: 50, pigment: 0.05, hex: "" });
  expect(withLadder(next)).toBe(next);
  // Dòng chưa có màu không làm đổi dự đoán
  const s = oxide();
  const before = predictHex(s, { "ox-red": 0.3 });
  s.pigments = s.pigments.map(withLadder);
  expect(predictHex(s, { "ox-red": 0.3 })).toBe(before);
});

// Từ đậm tới nhạt, cả 3 loại và 2 loại cân: tổng bột giữ 220 g, nước tổng (thêm + trong màu + trong lọ) = 37 ml / 100 g tổng bột,
// tổng màu không vượt giới hạn, lượng màu thật lệch lý thuyết ≤ nửa mức cân (qua lọ: ÷ 10 / ÷ 100), lọ A khi < 20 × mức cân, lọ B khi lọ A vẫn < 20 × mức cân
test("Công thức từ màu đậm tới màu nhạt: tổng bột, nước, giới hạn màu, làm tròn, chọn lọ pha loãng", () => {
  const targets = ["#4A4643", "#6E5446", "#8E8B87", "#B97A62", "#C8A98E", "#C9CFBF", "#D9D6D0", "#E3D3BC", "#E8C9C0", "#EFE8DC"];
  const d = defaultColorMix();
  const combo = comboSet(d);
  const kindIds = (kind: string) => combo.pigments.filter((p) => p.kind === kind).map((p) => p.id);
  const cases = [
    ["oxide", d.sets.oxide, 0.1],
    ["oxide", d.sets.oxide, 0.01],
    ["liquid", d.sets.liquid, 0.1],
    ["combo", combo, 0.1],
  ] as const;
  for (const [view, s, precision] of cases)
    for (const hex of targets) {
      const limits =
        view === "combo"
          ? [
              { ids: kindIds("oxide"), max: 6 },
              { ids: kindIds("liquid"), max: 6 },
            ]
          : [];
      const sol = solveMix(s, hex, ids(s), view === "combo" ? 12 : 6, limits);
      const plan = planMix(view, s, sol, { plaster: 220, waterPer100: 37, precision });
      const at = `${view} ${precision} ${hex}`;
      expect(plan.plaster + plan.colorSolids, at).toBeCloseTo(220, 0);
      if (!plan.waterExcess) expect(plan.waterToAdd + plan.waterInColor + plan.waterInPremix, at).toBeCloseTo(81.4, 5);
      if (view !== "combo") expect(plan.totalPercent, at).toBeLessThanOrEqual(6 + 1e-6);
      for (const l of plan.lines) {
        expect(Math.abs(l.rounded - l.grams), `${at} ${l.name}`).toBeLessThanOrEqual((l.premix ? precision / l.premix.factor : precision) / 2 + 1e-9);
        if (l.grams >= precision * 20) expect(l.premix, `${at} ${l.name}`).toBeUndefined();
        else expect(l.premix?.factor, `${at} ${l.name}`).toBe(l.grams * 10 >= precision * 20 ? 10 : 100);
      }
      expect(plan.plasterToWeigh, at).toBeCloseTo(plan.plaster - plan.lines.reduce((a, l) => a + (l.premix && l.kind === "oxide" ? l.premix.carried : 0), 0), 5);
    }
});
