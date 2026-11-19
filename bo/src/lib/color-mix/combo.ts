// Tab Kết hợp (docs/pages/color-mix.md#kết-hợp): bột oxit + màu nước trong cùng một mẻ.
// Không có dữ liệu riêng — ghép hai bộ lúc chạy: mỗi màu giữ đường cong đo ở bộ của nó (so với mẫu trắng của bộ đó),
// hỗn hợp tính trên mẫu trắng của bộ oxit; tỷ lệ nước lấy theo bộ oxit, nước trong màu / khối lượng giọt theo bộ màu nước.
// Chưa có mẫu đổ thử trộn chung nên dự đoán kém chắc hơn từng bộ — lưu mẫu kiểm chứng riêng (comboChecks) để biết lệch bao nhiêu
import { DEFAULT_WATER, type ColorMixData, type MixSet } from "./types";

export function comboSet(data: ColorMixData): MixSet {
  const { oxide, liquid } = data.sets;
  return {
    demo: oxide.demo || liquid.demo,
    base: oxide.base,
    waterPer100: oxide.waterPer100 ?? DEFAULT_WATER,
    waterContent: liquid.waterContent,
    dropGrams: liquid.dropGrams,
    pigments: [...oxide.pigments.map((p) => ({ ...p, kind: "oxide" as const, base: oxide.base })), ...liquid.pigments.map((p) => ({ ...p, kind: "liquid" as const, base: liquid.base }))],
    checks: data.comboChecks ?? [],
  };
}
