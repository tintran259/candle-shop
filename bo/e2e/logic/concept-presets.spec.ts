// Concept lễ tạo nhanh (lib/products/concept-presets.ts): thời gian bán gợi ý của mùa sắp tới, bỏ qua concept đã có
import { expect, test } from "@playwright/test";
import { conceptPresets, missingPresets } from "@/lib/products/concept-presets";

const seasons = (today: string) => Object.fromEntries(conceptPresets(today).map((c) => [c.id, [c.startsOn, c.endsOn]]));

test("Mùa gợi ý: trước mùa / đang mùa dùng năm nay, hết mùa chuyển năm sau; Tết theo âm lịch", () => {
  expect(seasons("2026-11-13")).toEqual({ noel: ["2026-12-01", "2026-12-26"], tet: ["2027-01-07", "2027-02-12"], valentine: ["2027-02-01", "2027-02-14"] });
  // Đang mùa Noel vẫn là năm nay; qua 26/12 thì năm sau
  expect(seasons("2026-12-20").noel).toEqual(["2026-12-01", "2026-12-26"]);
  expect(seasons("2026-12-27").noel).toEqual(["2027-12-01", "2027-12-26"]);
  // Đang Tết (mùng 3) vẫn là Tết này; qua mùng 7 thì Tết năm sau
  expect(seasons("2027-02-08").tet).toEqual(["2027-01-07", "2027-02-12"]);
  expect(seasons("2027-02-13").tet).toEqual(["2027-12-27", "2028-02-01"]);
  expect(seasons("2027-02-15").valentine).toEqual(["2028-02-01", "2028-02-14"]);
});

test("Chỉ gợi ý concept chưa có (trùng id hoặc tên, không phân biệt hoa thường)", () => {
  const existing = [
    { id: "noel", name: { vi: "Noel", en: "" }, color: "red", hidden: false },
    { id: "tet-2027", name: { vi: "tết", en: "" }, color: "gold", hidden: false },
  ];
  expect(missingPresets(existing, "2026-11-13").map((c) => c.id)).toEqual(["valentine"]);
});
