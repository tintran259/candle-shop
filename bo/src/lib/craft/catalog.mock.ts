// ⚠️ DỮ LIỆU MẪU cho môi trường phát triển — KHÔNG phải giá/tồn kho thật.
// Bản thật sẽ lưu về BE và web đọc qua GET /api/shop-config.

import type { CustomizerCatalog } from "@/lib/craft/types";

const all = ["s100", "s150", "s200"];

export const mockCatalog: CustomizerCatalog = {
  containers: [
    { id: "ceramic", name: { vi: "Hũ gốm / Ceramic", en: "Ceramic" }, priceDelta: 100_000, available: true, stock: 18, unit: "pcs", swatch: "#e4dcd0", shape: "tumbler", supportedSizeIds: all, lid: { priceDelta: 25_000, stock: 10, unit: "pcs" } },
    { id: "clear-glass", name: { vi: "Thủy tinh trong", en: "Clear glass" }, priceDelta: 25_000, available: true, stock: 40, unit: "pcs", swatch: "#dfe7e6", shape: "jar", translucent: true, supportedSizeIds: all, lid: null },
    { id: "amber-glass", name: { vi: "Thủy tinh hổ phách", en: "Amber glass" }, priceDelta: 50_000, available: true, stock: 24, unit: "pcs", swatch: "#9a5a26", shape: "jar", translucent: true, supportedSizeIds: all, lid: { priceDelta: 25_000, stock: 24, unit: "pcs" } },
    { id: "plaster", name: { vi: "Hũ thạch cao", en: "Plaster" }, priceDelta: 75_000, available: true, stock: 6, unit: "pcs", swatch: "#f1ece4", shape: "bowl", supportedSizeIds: ["s150", "s200"], lid: null },
    { id: "tin", name: { vi: "Hũ thiếc", en: "Tin" }, priceDelta: 25_000, available: true, stock: 30, unit: "pcs", swatch: "#c3c6ca", shape: "tin", supportedSizeIds: ["s100", "s150"], lid: { priceDelta: 0, stock: 30, unit: "pcs" } },
  ],
  sizes: [
    { id: "s100", grams: 100, burnHours: 20, basePrice: 400_000, available: true },
    { id: "s150", grams: 150, burnHours: 35, basePrice: 500_000, available: true },
    { id: "s200", grams: 200, burnHours: 50, basePrice: 650_000, available: true },
  ],
  waxes: [
    { id: "soy", name: { vi: "Sáp đậu nành", en: "Soy wax" }, description: { vi: "Tiêu chuẩn, cháy sạch", en: "Standard, clean burn" }, priceDelta: 0, available: true, stock: 9000, unit: "g", swatch: "#f6efe2" },
    { id: "coconut", name: { vi: "Sáp dừa", en: "Coconut wax" }, description: { vi: "Tỏa hương mạnh, mặt sáp mịn", en: "Strong throw, creamy top" }, priceDelta: 25_000, available: true, stock: 2400, unit: "g", swatch: "#fbf7ef" },
    { id: "beeswax", name: { vi: "Sáp ong", en: "Beeswax" }, description: { vi: "Mùi mật nhẹ, màu vàng tự nhiên", en: "Light honey note, natural gold" }, priceDelta: 50_000, available: true, stock: 450, unit: "g", swatch: "#f0d48a" },
    { id: "blend", name: { vi: "Sáp pha trộn", en: "Wax blend" }, description: { vi: "Đậu nành + dừa", en: "Soy + coconut" }, priceDelta: 10_000, available: true, stock: 3000, unit: "g", swatch: "#f8f1e6" },
  ],
  fragrances: [
    { id: "vanilla", name: { vi: "Vanilla", en: "Vanilla" }, priceDelta: 0, available: true, stock: 900, unit: "g", swatch: "#f3d9a4" },
    { id: "lavender", name: { vi: "Lavender", en: "Lavender" }, priceDelta: 0, available: true, stock: 450, unit: "g", swatch: "#b9a6d6" },
    { id: "white-tea", name: { vi: "White Tea", en: "White Tea" }, priceDelta: 10_000, available: true, stock: 300, unit: "g", swatch: "#cfd8b8" },
    { id: "sandalwood", name: { vi: "Sandalwood", en: "Sandalwood" }, priceDelta: 25_000, available: true, stock: 600, unit: "g", swatch: "#a8794f" },
    { id: "rose", name: { vi: "Rose", en: "Rose" }, priceDelta: 0, available: true, stock: 0, unit: "g", swatch: "#d9646d" },
    { id: "citrus", name: { vi: "Citrus", en: "Citrus" }, priceDelta: 0, available: true, stock: 500, unit: "g", swatch: "#f2b84b" },
    { id: "none", name: { vi: "Không mùi", en: "Unscented" }, priceDelta: 0, available: true, stock: 99999, unit: "g", unscented: true },
  ],
  wicks: [
    { id: "cotton", name: { vi: "Bấc cotton", en: "Cotton wick" }, description: { vi: "Lửa êm, ổn định", en: "Calm, steady flame" }, priceDelta: 0, available: true, stock: 500, unit: "pcs" },
    // Bấc gỗ: không hợp hũ thiếc (miệng hẹp) và sáp ong (cháy không đều)
    { id: "wood", name: { vi: "Bấc gỗ", en: "Wooden wick" }, description: { vi: "Tiếng lách tách như lò sưởi", en: "Crackles like a fireplace" }, priceDelta: 40_000, available: true, stock: 40, unit: "pcs", containerIds: ["ceramic", "clear-glass", "amber-glass", "plaster"], waxIds: ["soy", "coconut", "blend"] },
  ],
  colors: [
    { id: "natural", name: { vi: "Không màu", en: "Undyed" }, priceDelta: 0, available: true, stock: 99999, unit: "pcs", natural: true },
    { id: "cream", name: { vi: "Trắng kem", en: "Cream" }, priceDelta: 0, available: true, stock: 200, unit: "pcs", swatch: "#f3ead8" },
    { id: "beige", name: { vi: "Be", en: "Beige" }, priceDelta: 10_000, available: true, stock: 120, unit: "pcs", swatch: "#e6cfae" },
    { id: "sage", name: { vi: "Xanh sage", en: "Sage" }, priceDelta: 10_000, available: true, stock: 80, unit: "pcs", swatch: "#a9b59a" },
    { id: "brown", name: { vi: "Nâu", en: "Brown" }, priceDelta: 10_000, available: true, stock: 60, unit: "pcs", swatch: "#a07c62" },
    { id: "pastel-pink", name: { vi: "Hồng pastel", en: "Pastel pink" }, priceDelta: 10_000, available: true, stock: 0, unit: "pcs", swatch: "#f0b3a8" },
  ],
  decorations: [
    { id: "none", name: { vi: "Không trang trí", en: "No decoration" }, priceDelta: 0, available: true, stock: 99999, unit: "pcs", approved: true },
    { id: "botanical", name: { vi: "Hoa khô quanh thành hũ", en: "Botanical rim" }, description: { vi: "Đặt sát thành, cách xa ngọn lửa", en: "Set at the rim, away from the flame" }, priceDelta: 75_000, available: true, stock: 30, unit: "pcs", approved: true, look: "flowers" },
    { id: "wax-pattern", name: { vi: "Họa tiết sáp", en: "Wax pattern" }, priceDelta: 50_000, available: true, stock: 50, unit: "pcs", approved: true, look: "pattern" },
    { id: "wax-topper", name: { vi: "Topping sáp tạo hình", en: "Sculpted wax topper" }, priceDelta: 90_000, available: true, stock: 12, unit: "pcs", approved: true, look: "topper" },
    // Chưa được duyệt an toàn — không hiển thị cho khách
    { id: "glitter", name: { vi: "Kim tuyến", en: "Glitter" }, priceDelta: 50_000, available: true, stock: 100, unit: "pcs", approved: false },
  ],
  personalization: {
    labelText: { enabled: true, maxLength: 24, priceDelta: 25_000 },
    recipientName: { enabled: true, maxLength: 20, priceDelta: 0 },
    giftMessage: { enabled: true, maxLength: 150, priceDelta: 0 },
    giftBox: { enabled: true, priceDelta: 75_000, available: true, stock: 25, unit: "pcs" },
  },
  maxFragrances: 3,
  intensity: {
    priceDelta: { light: 0, medium: 0, strong: 10_000 },
    load: { light: 0.06, medium: 0.08, strong: 0.1 },
  },
};
