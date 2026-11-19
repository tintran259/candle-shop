// Pha màu: tìm công thức gọn (bỏ bớt màu, phạt vượt mẫu đã đo) và chọn cách đề xuất trên nút loại (docs/pages/color-mix.md#cách-đề-xuất)
import { expect, test } from "@playwright/test";
import { bestOption, mixOption, optionNote, solveView } from "@/lib/color-mix/advise";
import { comboSet } from "@/lib/color-mix/combo";
import { defaultColorMix } from "@/lib/color-mix/defaults";
import { solveMix } from "@/lib/color-mix/model";
import { MIX_VIEWS, type MixSet, type MixView } from "@/lib/color-mix/types";

const data = defaultColorMix();
const sets: Record<MixView, MixSet> = { oxide: data.sets.oxide, liquid: data.sets.liquid, combo: comboSet(data) };
const advise = (goal: string) => {
  const options = MIX_VIEWS.map((v) => mixOption(v, sets[v], solveView(v, sets[v], {}, goal)));
  return { options, best: bestOption(options) };
};

test("Tìm công thức: thử bỏ từng màu — đen chỉ cần một màu, không kẹt ở công thức 3 màu lệch hơn", () => {
  const set = sets.oxide;
  const r = solveMix(
    set,
    "#2B2B2B",
    set.pigments.map((p) => p.id),
    6,
  );
  expect(Object.keys(r.percents)).toEqual(["ox-black"]);
  expect(r.deltaE).toBeLessThan(9.5);
  // Tổng không vượt giới hạn sau khi làm tròn
  expect(Object.values(r.percents).reduce((s, x) => s + x, 0)).toBeLessThanOrEqual(6);
});

test("Đề xuất: lệch dưới 1 ΔE coi như ngang → chọn cách ít màu; màu đậm chỉ Kết hợp tới gần được → chọn Kết hợp", () => {
  const light = advise("#E8DCC8");
  // Màu nước ΔE 0 nhưng 3 màu; oxit ΔE 0,5 (mắt khó thấy) chỉ 2 màu
  expect(light.best.view).toBe("oxide");
  expect(optionNote(light.options[1], light.best, light.options)).toMatch(/^Gần hơn 0,5 ΔE \(mắt khó thấy\) nhưng cần 3 màu\.$/);
  expect(optionNote(light.options[2], light.best, light.options)).toContain("phải dùng cả hai loại màu");

  const dark = advise("#3A3330");
  expect(dark.best.view).toBe("combo");
  expect(optionNote(dark.options[0], dark.best, dark.options)).toBe("Không pha được màu này (lệch rõ).");
  expect(optionNote(dark.best, dark.best, dark.options)).toContain("Có màu vượt mẫu đã đo");
});
