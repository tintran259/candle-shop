// Thông tin hiển thị + tiện ích cho trang cấu hình nguyên liệu Thủ công
import { formatMoney } from "@/lib/format";
import type { ContainerOption, DecorationOption, Stock } from "@/lib/craft/types";

export type OptionGroup = "containers" | "waxes" | "fragrances" | "wicks" | "colors" | "decorations";

export const optionGroups: Record<
  OptionGroup,
  { label: string; description: string; unit: Stock["unit"]; swatch: boolean }
> = {
  containers: { label: "Hũ nến", description: "Hũ đựng, kích thước hỗ trợ và nắp đi kèm.", unit: "pcs", swatch: true },
  waxes: { label: "Sáp", description: "Các loại sáp nền, tồn kho tính theo gram.", unit: "g", swatch: true },
  fragrances: { label: "Mùi hương", description: "Tinh dầu hương, tồn kho tính theo gram.", unit: "g", swatch: true },
  wicks: { label: "Bấc", description: "Bấc nến và giới hạn hũ/sáp dùng được.", unit: "pcs", swatch: false },
  colors: { label: "Màu sáp", description: "Màu nhuộm sáp, tính theo số lần pha.", unit: "pcs", swatch: true },
  decorations: { label: "Trang trí", description: "Chỉ mục đã duyệt an toàn mới hiện cho khách.", unit: "pcs", swatch: false },
};

// Thông báo đầu trang Thủ công (dùng cả trong skeleton để khung không đổi chiều cao)
export const CRAFT_PREVIEW_NOTICE =
  "Bản xem trước: thay đổi được lưu trên trình duyệt này và chưa đồng bộ lên website. Khi có API sẽ lưu về BE.";

export const optionGroupKeys = Object.keys(optionGroups) as OptionGroup[];

export const unitLabel: Record<Stock["unit"], string> = { g: "g", pcs: "cái" };

// Mục không cần đếm tồn (vd "Không mùi", "Không màu") lưu số rất lớn
export const UNLIMITED = 99999;
// Dưới ngưỡng này là "sắp hết"
export const LOW_STOCK: Record<Stock["unit"], number> = { g: 500, pcs: 10 };

export type StockLevel = "unlimited" | "out" | "low" | "ok";

export function stockLevel({ stock, unit }: Stock): StockLevel {
  if (stock >= UNLIMITED) return "unlimited";
  if (stock <= 0) return "out";
  return stock < LOW_STOCK[unit] ? "low" : "ok";
}

export const shapeLabels: Record<ContainerOption["shape"], string> = {
  tumbler: "Cốc",
  jar: "Lọ",
  tin: "Hộp thiếc",
  bowl: "Bát",
};

export const lookLabels: Record<NonNullable<DecorationOption["look"]>, string> = {
  flowers: "Hoa khô",
  pattern: "Họa tiết",
  topper: "Topping",
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
