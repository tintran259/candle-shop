// Pha màu: dự đoán màu từ mẫu đổ thử, tìm công thức, đổi ra gram / nước / giọt (docs/pages/color-mix.md)
import { expect, test } from "@playwright/test";
import { deltaEHex, hexToLinear, linearToHex, normHex, whiteBalance, whiteRefTooDark } from "@/lib/color-mix/color";
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

test("Bột oxit: tổng bột vào khuôn giữ đúng như nhập (đã gồm màu), nước theo thạch cao thật", () => {
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
  expect(plan.waterToAdd).toBeCloseTo(152.44, 1);
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
  expect(premixText("oxide", black, 2)).toBe("Trộn 1,00 g Đen oxit + 9,00 g bột thạch cao cho thật đều, rồi cân 0,44 g hỗn hợp này (phần thừa cất dùng lần sau).");
  // Rất ít (cân 0,1 g, cần 0,15 g): 1:9 vẫn dưới 2 g → 1:99
  const tiny = planMix("oxide", s, { ...sol, percents: { "ox-red": 0.15 } }, { plaster: 100, waterPer100: 70, precision: 0.1 }).lines[0];
  expect(tiny.premix).toMatchObject({ factor: 100, stockPigment: 2, stockBase: 198 });
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
  expect(plan.waterToAdd).toBeCloseTo(69.31 - 0.99, 1);
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
