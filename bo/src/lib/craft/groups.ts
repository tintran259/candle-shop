// Tiện ích chung cho trình dựng Thủ công (nhãn, tồn kho, định dạng)
import { formatMoney } from "@/lib/format";
import type { SizeOption, Unit, VesselShape } from "@/lib/craft/types";

// Thông báo đầu trang Thủ công (dùng cả trong skeleton để khung không đổi chiều cao)
export const CRAFT_PREVIEW_NOTICE =
  "Sửa trên bản nháp — bấm “Lưu thay đổi” thì web mới dùng cấu hình mới. Chưa có BE nên bản đã lưu vẫn nằm trên trình duyệt này. Tồn kho quản lý ở trang Kho nguyên liệu.";

export const unitLabel: Record<Unit, string> = { g: "g", ml: "ml", pcs: "cái" };
// Tên đầy đủ cho ô chọn đơn vị
export const unitNames: Record<Unit, string> = { pcs: "Cái", g: "Gram", ml: "Mililít" };

// Tên cỡ khách thấy: dung tích hũ (vd "150ml"); full = kèm lượng sáp
export const sizeLabel = (s: Pick<SizeOption, "ml" | "grams">, full = false) => (full ? `${s.ml}ml · ${s.grams}g sáp` : `${s.ml}ml`);

export const shapeLabels: Record<VesselShape, string> = {
  tumbler: "Cốc",
  jar: "Lọ",
  tin: "Hộp thiếc",
  bowl: "Bát",
};

// Phụ thu hiển thị dạng "+25.000 ₫", 0 thì "—"
export const formatDelta = (vnd: number) => (vnd ? `+${formatMoney(vnd)}` : "—");

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
