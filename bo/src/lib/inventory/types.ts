// Kho nguyên liệu của xưởng — nơi DUY NHẤT giữ số tồn. Lựa chọn trên trang Thủ công chỉ trỏ tới
// nguyên liệu qua materialId (xem docs/inventory.md).
import type { Unit } from "@/lib/craft/types";

export const materialCategories = ["vessel", "wax", "fragrance", "wick", "dye", "decor", "packaging", "other"] as const;
export type MaterialCategory = (typeof materialCategories)[number];

export type Material = {
  // Duy nhất, dạng slug — cố định sau khi tạo (lựa chọn & lịch sử kho trỏ tới)
  id: string;
  name: string;
  // Mã nội bộ / mã nhà cung cấp
  sku?: string;
  category: MaterialCategory;
  // "g" cho sáp, tinh dầu; "pcs" cho hũ, bấc, phụ kiện
  unit: Unit;
  // false = không đếm tồn (vd "Không mùi") — luôn coi là còn hàng
  tracked: boolean;
  stock: number;
  // Dưới ngưỡng này là "sắp hết"
  lowStock: number;
  swatch?: string;
  note?: string;
  updatedAt: string;
  // Chỉ có ở BO, không lưu vào Kho: nguyên liệu vừa tạo từ trang Thủ công, chờ bấm Lưu mới thật sự vào Kho
  draft?: boolean;
};

// in = nhập thêm, out = xuất (hỏng, dùng thử…), adjust = kiểm kê đặt lại số thực tế, order = trừ theo đơn
export type MovementType = "in" | "out" | "adjust" | "order";

export type StockMovement = {
  id: string;
  materialId: string;
  type: MovementType;
  // Lượng thay đổi (+ nhập, − xuất)
  change: number;
  after: number;
  note?: string;
  // Đơn hàng gây ra thay đổi (type = order)
  orderCode?: string;
  by: string;
  at: string;
};

export type Inventory = { materials: Material[]; movements: StockMovement[] };
