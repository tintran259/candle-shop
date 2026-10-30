// Tiện ích chung cho trình dựng Thủ công (nhãn, tồn kho, định dạng)
import { formatMoney } from "@/lib/format";
import type { Stock, Unit, VesselShape } from "@/lib/craft/types";

// Thông báo đầu trang Thủ công (dùng cả trong skeleton để khung không đổi chiều cao)
export const CRAFT_PREVIEW_NOTICE =
  "Bản xem trước: thay đổi được lưu trên trình duyệt này và chưa đồng bộ lên website. Khi có API sẽ lưu về BE (xem docs/craft-builder.md).";

export const unitLabel: Record<Unit, string> = { g: "g", pcs: "cái" };

// Mục không cần đếm tồn (vd "Không mùi", "Không màu") lưu số rất lớn
export const UNLIMITED = 99999;
// Dưới ngưỡng này là "sắp hết"
export const LOW_STOCK: Record<Unit, number> = { g: 500, pcs: 10 };

export type StockLevel = "unlimited" | "out" | "low" | "ok";

export function stockLevel({ stock, unit }: Stock): StockLevel {
  if (stock >= UNLIMITED) return "unlimited";
  if (stock <= 0) return "out";
  return stock < LOW_STOCK[unit] ? "low" : "ok";
}

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
