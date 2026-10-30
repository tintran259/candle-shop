// ⚠️ DỮ LIỆU MẪU — cấu hình mặc định của trình dựng Thủ công (giá/tồn kho chưa phải số thật).
// BE dùng đúng nội dung này làm bản ghi đầu tiên khi chưa có cấu hình (xem docs/craft-builder.md).
import { UNLIMITED } from "@/lib/craft/groups";
import { DEFAULT_INTENSITY } from "@/lib/craft/steps";
import type { CraftConfig } from "@/lib/craft/types";

const all = ["s100", "s150", "s200"];

export const defaultCraftConfig: CraftConfig = {
  version: 1,
  currency: "VND",
  steps: [
    {
      id: "container",
      kind: "vessel",
      title: { vi: "Hũ nến", en: "Vessel" },
      hint: { vi: "Chọn hũ, nắp và kích thước", en: "Pick a vessel, lid and size" },
      icon: "vessel",
      enabled: true,
      required: true,
      sizes: [
        { id: "s100", grams: 100, burnHours: 20, basePrice: 400_000, available: true },
        { id: "s150", grams: 150, burnHours: 35, basePrice: 500_000, available: true },
        { id: "s200", grams: 200, burnHours: 50, basePrice: 650_000, available: true },
      ],
      options: [
        { id: "ceramic", name: { vi: "Hũ gốm", en: "Ceramic" }, priceDelta: 100_000, available: true, stock: 18, unit: "pcs", swatch: "#e4dcd0", shape: "tumbler", supportedSizeIds: all, lid: { priceDelta: 25_000, stock: 10, unit: "pcs" } },
        { id: "clear-glass", name: { vi: "Thủy tinh trong", en: "Clear glass" }, priceDelta: 25_000, available: true, stock: 40, unit: "pcs", swatch: "#dfe7e6", shape: "jar", translucent: true, supportedSizeIds: all, lid: null },
        { id: "amber-glass", name: { vi: "Thủy tinh hổ phách", en: "Amber glass" }, priceDelta: 50_000, available: true, stock: 24, unit: "pcs", swatch: "#9a5a26", shape: "jar", translucent: true, supportedSizeIds: all, lid: { priceDelta: 25_000, stock: 24, unit: "pcs" } },
        { id: "plaster", name: { vi: "Hũ thạch cao", en: "Plaster" }, priceDelta: 75_000, available: true, stock: 6, unit: "pcs", swatch: "#f1ece4", shape: "bowl", supportedSizeIds: ["s150", "s200"], lid: null },
        { id: "tin", name: { vi: "Hũ thiếc", en: "Tin" }, priceDelta: 25_000, available: true, stock: 30, unit: "pcs", swatch: "#c3c6ca", shape: "tin", supportedSizeIds: ["s100", "s150"], lid: { priceDelta: 0, stock: 30, unit: "pcs" } },
      ],
    },
    {
      id: "wax",
      kind: "cards",
      title: { vi: "Sáp", en: "Wax" },
      hint: { vi: "Loại sáp nền quyết định độ tỏa hương", en: "The base wax shapes the scent throw" },
      icon: "layers",
      enabled: true,
      required: true,
      multiple: false,
      previewRole: "waxColor",
      unit: "g",
      // Mỗi gram nến cần 1 gram sáp
      gramsPerGram: 1,
      options: [
        { id: "soy", name: { vi: "Sáp đậu nành", en: "Soy wax" }, description: { vi: "Tiêu chuẩn, cháy sạch", en: "Standard, clean burn" }, priceDelta: 0, available: true, stock: 9000, unit: "g", swatch: "#f6efe2" },
        { id: "coconut", name: { vi: "Sáp dừa", en: "Coconut wax" }, description: { vi: "Tỏa hương mạnh, mặt sáp mịn", en: "Strong throw, creamy top" }, priceDelta: 25_000, available: true, stock: 2400, unit: "g", swatch: "#fbf7ef" },
        { id: "beeswax", name: { vi: "Sáp ong", en: "Beeswax" }, description: { vi: "Mùi mật nhẹ, màu vàng tự nhiên", en: "Light honey note, natural gold" }, priceDelta: 50_000, available: true, stock: 450, unit: "g", swatch: "#f0d48a" },
        { id: "blend", name: { vi: "Sáp pha trộn", en: "Wax blend" }, description: { vi: "Đậu nành + dừa", en: "Soy + coconut" }, priceDelta: 10_000, available: true, stock: 3000, unit: "g", swatch: "#f8f1e6" },
      ],
    },
    {
      id: "fragrance",
      kind: "blend",
      title: { vi: "Mùi hương", en: "Fragrance" },
      hint: { vi: "Phối tối đa 3 mùi và chỉnh tỉ lệ", en: "Blend up to 3 scents and tune the ratio" },
      icon: "flower",
      enabled: true,
      required: true,
      maxBlend: 3,
      intensity: DEFAULT_INTENSITY,
      unit: "g",
      options: [
        { id: "vanilla", name: { vi: "Vanilla", en: "Vanilla" }, priceDelta: 0, available: true, stock: 900, unit: "g", swatch: "#f3d9a4" },
        { id: "lavender", name: { vi: "Lavender", en: "Lavender" }, priceDelta: 0, available: true, stock: 450, unit: "g", swatch: "#b9a6d6" },
        { id: "white-tea", name: { vi: "White Tea", en: "White Tea" }, priceDelta: 10_000, available: true, stock: 300, unit: "g", swatch: "#cfd8b8" },
        { id: "sandalwood", name: { vi: "Sandalwood", en: "Sandalwood" }, priceDelta: 25_000, available: true, stock: 600, unit: "g", swatch: "#a8794f" },
        { id: "rose", name: { vi: "Rose", en: "Rose" }, priceDelta: 0, available: true, stock: 0, unit: "g", swatch: "#d9646d" },
        { id: "citrus", name: { vi: "Citrus", en: "Citrus" }, priceDelta: 0, available: true, stock: 500, unit: "g", swatch: "#f2b84b" },
        { id: "none", name: { vi: "Không mùi", en: "Unscented" }, priceDelta: 0, available: true, stock: UNLIMITED, unit: "g", exclusive: true },
      ],
    },
    {
      id: "wick",
      kind: "cards",
      title: { vi: "Bấc", en: "Wick" },
      hint: { vi: "Chỉ hiện bấc hợp với hũ, sáp và kích thước đã chọn", en: "Only wicks that suit your vessel, wax and size" },
      icon: "flame",
      enabled: true,
      required: true,
      multiple: false,
      previewRole: "wick",
      unit: "pcs",
      options: [
        { id: "cotton", name: { vi: "Bấc cotton", en: "Cotton wick" }, description: { vi: "Lửa êm, ổn định", en: "Calm, steady flame" }, priceDelta: 0, available: true, stock: 500, unit: "pcs", look: "cotton" },
        // Bấc gỗ: không hợp hũ thiếc (miệng hẹp) và sáp ong (cháy không đều)
        {
          id: "wood",
          name: { vi: "Bấc gỗ", en: "Wooden wick" },
          description: { vi: "Tiếng lách tách như lò sưởi", en: "Crackles like a fireplace" },
          priceDelta: 40_000,
          available: true,
          stock: 40,
          unit: "pcs",
          look: "wood",
          onlyWith: { container: ["ceramic", "clear-glass", "amber-glass", "plaster"], wax: ["soy", "coconut", "blend"] },
        },
      ],
    },
    {
      id: "color",
      kind: "swatches",
      title: { vi: "Màu sáp", en: "Wax colour" },
      hint: { vi: "Màu nhuộm cho phần sáp", en: "Dye for the wax" },
      icon: "palette",
      enabled: true,
      required: true,
      previewRole: "waxColor",
      unit: "pcs",
      options: [
        // Không có màu = giữ màu tự nhiên của sáp (ảnh minh họa dùng màu của bước Sáp)
        { id: "natural", name: { vi: "Không màu", en: "Undyed" }, priceDelta: 0, available: true, stock: UNLIMITED, unit: "pcs" },
        { id: "cream", name: { vi: "Trắng kem", en: "Cream" }, priceDelta: 0, available: true, stock: 200, unit: "pcs", swatch: "#f3ead8" },
        { id: "beige", name: { vi: "Be", en: "Beige" }, priceDelta: 10_000, available: true, stock: 120, unit: "pcs", swatch: "#e6cfae" },
        { id: "sage", name: { vi: "Xanh sage", en: "Sage" }, priceDelta: 10_000, available: true, stock: 80, unit: "pcs", swatch: "#a9b59a" },
        { id: "brown", name: { vi: "Nâu", en: "Brown" }, priceDelta: 10_000, available: true, stock: 60, unit: "pcs", swatch: "#a07c62" },
        { id: "pastel-pink", name: { vi: "Hồng pastel", en: "Pastel pink" }, priceDelta: 10_000, available: true, stock: 0, unit: "pcs", swatch: "#f0b3a8" },
      ],
    },
    {
      id: "decoration",
      kind: "cards",
      title: { vi: "Trang trí", en: "Decoration" },
      hint: { vi: "Chỉ gồm các mục xưởng đã duyệt an toàn khi đốt", en: "Only burn-safe, workshop-approved pieces" },
      icon: "sparkles",
      enabled: true,
      required: false,
      multiple: false,
      previewRole: "decoration",
      unit: "pcs",
      options: [
        { id: "none", name: { vi: "Không trang trí", en: "No decoration" }, priceDelta: 0, available: true, stock: UNLIMITED, unit: "pcs" },
        { id: "botanical", name: { vi: "Hoa khô quanh thành hũ", en: "Botanical rim" }, description: { vi: "Đặt sát thành, cách xa ngọn lửa", en: "Set at the rim, away from the flame" }, priceDelta: 75_000, available: true, stock: 30, unit: "pcs", look: "flowers" },
        { id: "wax-pattern", name: { vi: "Họa tiết sáp", en: "Wax pattern" }, priceDelta: 50_000, available: true, stock: 50, unit: "pcs", look: "pattern" },
        { id: "wax-topper", name: { vi: "Topping sáp tạo hình", en: "Sculpted wax topper" }, priceDelta: 90_000, available: true, stock: 12, unit: "pcs", look: "topper" },
        // Chưa được duyệt an toàn — tạm ẩn với khách
        { id: "glitter", name: { vi: "Kim tuyến", en: "Glitter" }, priceDelta: 50_000, available: false, stock: 100, unit: "pcs" },
      ],
    },
    {
      id: "personalization",
      kind: "inputs",
      title: { vi: "Cá nhân hóa", en: "Personalise" },
      hint: { vi: "Không bắt buộc — in tên, lời nhắn, thêm hộp quà", en: "Optional — names, a note, a gift box" },
      icon: "pen",
      enabled: true,
      required: false,
      fields: [
        { id: "labelText", label: { vi: "Chữ in trên nhãn", en: "Label text" }, placeholder: { vi: "VD: Ngọc ♥", en: "e.g. For Mai" }, maxLength: 24, priceDelta: 25_000, enabled: true, onLabel: true },
        { id: "recipientName", label: { vi: "Tên người nhận", en: "Recipient name" }, maxLength: 20, priceDelta: 0, enabled: true },
        { id: "giftMessage", label: { vi: "Lời nhắn kèm quà", en: "Gift message" }, maxLength: 150, priceDelta: 0, enabled: true, multiline: true },
      ],
      addons: [
        { id: "giftBox", name: { vi: "Hộp quà", en: "Gift box" }, description: { vi: "Hộp cứng kèm thiệp", en: "Rigid box with a card" }, priceDelta: 75_000, available: true, enabled: true, stock: 25, unit: "pcs" },
      ],
    },
  ],
};
