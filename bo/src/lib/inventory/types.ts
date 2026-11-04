// Kho nguyên liệu của xưởng — nơi DUY NHẤT giữ số tồn. Lựa chọn trên trang Thủ công chỉ trỏ tới
// nguyên liệu qua materialId (xem docs/inventory.md).
import type { Unit } from "@/lib/craft/types";
import type { RecipeLine } from "@/lib/products/types";

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
  // Giá nhập bình quân cho 1 đơn vị (1 g, 1 ml, 1 cái), VNĐ. Chưa nhập giá thì không có
  unitCost?: number;
  // Xưởng tự sản xuất (vd hũ gốm): định mức nguyên liệu cho 1 đơn vị. Không có = nguyên liệu mua về
  recipe?: RecipeLine[];
  swatch?: string;
  note?: string;
  updatedAt: string;
  // Chỉ có ở BO, không lưu vào Kho: nguyên liệu vừa tạo từ trang Thủ công, chờ bấm Lưu mới thật sự vào Kho
  draft?: boolean;
};

// in = nhập thêm, out = xuất (hỏng, dùng thử…), adjust = kiểm kê đặt lại số thực tế, order = trừ theo đơn,
// cost = sửa tay giá nhập bình quân (không đổi số tồn), make = sản xuất (thành phẩm +, nguyên liệu dùng làm −)
export type MovementType = "in" | "out" | "adjust" | "order" | "cost" | "make";

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
  // Phiếu nhập có ghi tiền: tổng tiền lô (0 = hàng không mất tiền) và giá mỗi đơn vị suy ra (tổng ÷ lượng nhập).
  // Phiếu sửa giá: unitCost là giá mới, previousCost là giá trước khi sửa
  totalCost?: number;
  unitCost?: number;
  previousCost?: number;
  // Mã mẻ sản xuất — chung cho phiếu thành phẩm và các phiếu trừ nguyên liệu của mẻ đó
  batch?: string;
  by: string;
  at: string;
};

export type Inventory = { materials: Material[]; movements: StockMovement[] };
