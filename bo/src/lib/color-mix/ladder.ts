// Thang nồng độ chuẩn cho mẫu đổ thử (docs/pages/color-mix.md#dữ-liệu-mẫu): 50 g thạch cao (tiết kiệm bột, cân 0,1 g vẫn đủ nhờ pha loãng trước), màu tăng gấp đôi dần 0,1 → 2%.
// Màu nhạt (be, kem, pastel) chỉ cần 0,05–0,5% mỗi màu nên đoạn đầu phải có điểm đo. Dòng thêm vào chưa có màu (hex trống) —
// mô hình bỏ qua tới khi nhập màu đo được. Nồng độ đã có (kể cả mẫu 50 g) thì không thêm trùng
import type { Pigment } from "./types";

export const LADDER = [0.1, 0.25, 0.5, 1, 2];
export const LADDER_PLASTER = 50;

const rate = (plaster: number, pigment: number) => (plaster > 0 ? Math.round((pigment / plaster) * 100 * 10_000) / 10_000 : -1);

// Các nồng độ trong thang mà màu này chưa có mẫu
export const missingLadder = (p: Pigment) => LADDER.filter((c) => !p.samples.some((s) => rate(s.plaster, s.pigment) === c));

// Thêm các dòng còn thiếu rồi xếp mẫu theo nồng độ tăng dần
export function withLadder(p: Pigment): Pigment {
  const added = missingLadder(p).map((c) => ({ plaster: LADDER_PLASTER, pigment: (LADDER_PLASTER * c) / 100, hex: "" }));
  if (!added.length) return p;
  return { ...p, samples: [...p.samples, ...added].sort((a, b) => rate(a.plaster, a.pigment) - rate(b.plaster, b.pigment)) };
}
