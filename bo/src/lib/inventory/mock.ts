// ⚠️ DỮ LIỆU MẪU — kho nguyên liệu của xưởng (số lượng chưa phải số thật).
// Bản thật lấy từ BE: GET /api/admin/inventory (docs/inventory.md).
import dayjs from "dayjs";
import { DEFAULT_LOW_STOCK } from "@/lib/inventory/stock";
import type { Inventory, Material, StockMovement } from "@/lib/inventory/types";

const at = (days: number, hour = 9) => dayjs().subtract(days, "day").hour(hour).minute(0).second(0).toISOString();

type Seed = Omit<Material, "tracked" | "lowStock" | "updatedAt"> & { lowStock?: number; tracked?: boolean; days?: number };

// Một nguyên liệu cho mỗi dung tích: { 150: tồn, 250: tồn } → jar-ceramic-150 "Hũ gốm trụ 150ml"
const sized = (id: string, name: string, sku: string | undefined, stock: Record<number, number>, swatch?: string): Seed[] =>
  Object.entries(stock).map(([ml, n]) => ({ id: `${id}-${ml}`, name: `${name} ${ml}ml`, sku: sku && `${sku}-${ml}`, category: "vessel", unit: "pcs", stock: n, lowStock: 5, swatch }));

const seeds: Seed[] = [
  // Hũ & nắp — mỗi cỡ một mã riêng (hũ 150ml không thay được hũ 250ml)
  ...sized("jar-ceramic", "Hũ gốm trụ", "HU-GOM", { 150: 10, 200: 0, 250: 6 }, "#e4dcd0"),
  ...sized("jar-clear-glass", "Hũ thủy tinh trong", "HU-TT1", { 150: 24, 200: 18, 250: 12 }, "#dfe7e6"),
  ...sized("jar-amber-glass", "Hũ thủy tinh hổ phách", "HU-TT2", { 150: 8, 200: 14, 250: 4 }, "#9a5a26"),
  ...sized("jar-plaster", "Bát thạch cao", "HU-TC", { 200: 6, 250: 0 }, "#f1ece4"),
  ...sized("jar-tin", "Hộp thiếc", "HU-TH", { 150: 16, 200: 14 }, "#c3c6ca"),
  ...sized("lid-ceramic", "Nắp gỗ hũ gốm", undefined, { 150: 6, 200: 4, 250: 0 }),
  ...sized("lid-amber", "Nắp nhôm hũ hổ phách", undefined, { 150: 12, 200: 12, 250: 6 }),
  ...sized("lid-tin", "Nắp hộp thiếc", undefined, { 150: 16, 200: 14 }),
  // Sáp
  { id: "wax-soy", name: "Sáp đậu nành", sku: "SAP-DN", category: "wax", unit: "g", stock: 9000, lowStock: 2000, swatch: "#f6efe2", days: 2 },
  { id: "wax-coconut", name: "Sáp dừa", sku: "SAP-DUA", category: "wax", unit: "g", stock: 2400, lowStock: 1000, swatch: "#fbf7ef" },
  { id: "wax-beeswax", name: "Sáp ong", sku: "SAP-ONG", category: "wax", unit: "g", stock: 450, lowStock: 1000, swatch: "#f0d48a" },
  { id: "wax-blend", name: "Sáp pha trộn (đậu nành + dừa)", category: "wax", unit: "g", stock: 3000, lowStock: 1000, swatch: "#f8f1e6" },
  // Tinh dầu
  { id: "oil-vanilla", name: "Tinh dầu Vanilla", category: "fragrance", unit: "ml", stock: 900, swatch: "#f3d9a4", days: 5 },
  { id: "oil-lavender", name: "Tinh dầu Lavender", category: "fragrance", unit: "ml", stock: 450, swatch: "#b9a6d6" },
  { id: "oil-white-tea", name: "Tinh dầu White Tea", category: "fragrance", unit: "ml", stock: 300, swatch: "#cfd8b8" },
  { id: "oil-sandalwood", name: "Tinh dầu Sandalwood", category: "fragrance", unit: "ml", stock: 600, swatch: "#a8794f" },
  { id: "oil-rose", name: "Tinh dầu Rose", category: "fragrance", unit: "ml", stock: 0, swatch: "#d9646d", days: 1 },
  { id: "oil-citrus", name: "Tinh dầu Citrus", category: "fragrance", unit: "ml", stock: 500, swatch: "#f2b84b" },
  // Bấc
  { id: "wick-cotton", name: "Bấc cotton", category: "wick", unit: "pcs", stock: 500, lowStock: 50 },
  { id: "wick-wood", name: "Bấc gỗ", category: "wick", unit: "pcs", stock: 40, lowStock: 20 },
  // Màu nhuộm (tính theo lần pha)
  { id: "dye-cream", name: "Màu nhuộm trắng kem", category: "dye", unit: "pcs", stock: 200, swatch: "#f3ead8" },
  { id: "dye-beige", name: "Màu nhuộm be", category: "dye", unit: "pcs", stock: 120, swatch: "#e6cfae" },
  { id: "dye-sage", name: "Màu nhuộm xanh sage", category: "dye", unit: "pcs", stock: 80, swatch: "#a9b59a" },
  { id: "dye-brown", name: "Màu nhuộm nâu", category: "dye", unit: "pcs", stock: 60, swatch: "#a07c62" },
  { id: "dye-pastel-pink", name: "Màu nhuộm hồng pastel", category: "dye", unit: "pcs", stock: 0, swatch: "#f0b3a8" },
  // Trang trí
  { id: "decor-botanical", name: "Hoa khô trang trí", category: "decor", unit: "pcs", stock: 30 },
  { id: "decor-pattern", name: "Khuôn họa tiết sáp", category: "decor", unit: "pcs", stock: 50 },
  { id: "decor-topper", name: "Topping sáp tạo hình", category: "decor", unit: "pcs", stock: 12 },
  { id: "decor-glitter", name: "Kim tuyến (chưa duyệt an toàn)", category: "decor", unit: "pcs", stock: 100, note: "Chờ xưởng thử đốt, chưa bán." },
  // Bao bì — có món chưa dùng ở bước nào
  { id: "box-gift", name: "Hộp quà cứng kèm thiệp", category: "packaging", unit: "pcs", stock: 25 },
  { id: "card-printed", name: "Thiệp in sẵn", category: "packaging", unit: "pcs", stock: 120, lowStock: 30 },
  { id: "label-decal", name: "Nhãn decal in tên", category: "packaging", unit: "pcs", stock: 300, lowStock: 50 },
];

const materials: Material[] = seeds.map(({ lowStock, tracked, days = 7, ...m }) => ({
  ...m,
  tracked: tracked ?? true,
  lowStock: lowStock ?? DEFAULT_LOW_STOCK[m.unit],
  updatedAt: at(days, 10),
}));

const movements: StockMovement[] = [
  { id: "mv-1", materialId: "wax-soy", type: "in", change: 5000, after: 9000, note: "Nhập lô tháng này — NCC Hạt Mộc", by: "Admin 2510", at: at(2, 10) },
  { id: "mv-2", materialId: "oil-rose", type: "order", change: -60, after: 0, orderCode: "SC261029002", by: "Hệ thống", at: at(1, 15) },
  { id: "mv-3", materialId: "oil-vanilla", type: "adjust", change: -40, after: 900, note: "Kiểm kê cuối tuần", by: "Admin 2510", at: at(5, 17) },
  { id: "mv-4", materialId: "jar-plaster-250", type: "out", change: -2, after: 0, note: "Vỡ khi vận chuyển", by: "Admin 2510", at: at(3, 11) },
  { id: "mv-5", materialId: "wick-wood", type: "in", change: 30, after: 40, by: "Admin 2510", at: at(6, 9) },
];

export const mockInventory: Inventory = { materials, movements };
