// ⚠️ DỮ LIỆU MẪU — cấu hình mặc định của trình dựng Thủ công (giá/tồn kho chưa phải số thật).
// BE dùng đúng nội dung này làm bản ghi đầu tiên khi chưa có cấu hình (xem docs/craft-builder.md).
// materialId trỏ tới nguyên liệu trong lib/inventory/mock.ts; mục không gắn kho = không theo dõi tồn.
import { DEFAULT_INTENSITY } from "@/lib/craft/steps";
import type { CraftConfig } from "@/lib/craft/types";

const all = ["s150", "s200", "s250"];

// Mã hũ (+ nắp) trong Kho cho từng cỡ: jar-ceramic-150, lid-ceramic-150…
const perSize = (jar: string, sizes: string[], lid?: string) =>
  Object.fromEntries(sizes.map((id) => [id, { materialId: `${jar}-${id.slice(1)}`, lidMaterialId: lid && `${lid}-${id.slice(1)}` }]));

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
        { id: "s150", ml: 150, grams: 120, burnHours: 25, basePrice: 400_000, available: true },
        { id: "s200", ml: 200, grams: 160, burnHours: 35, basePrice: 500_000, available: true },
        { id: "s250", ml: 250, grams: 200, burnHours: 45, basePrice: 650_000, available: true },
      ],
      options: [
        { id: "ceramic", name: { vi: "Hũ gốm", en: "Ceramic" }, priceDelta: 100_000, available: true, swatch: "#e4dcd0", shape: "tumbler", supportedSizeIds: all, sizeMaterials: perSize("jar-ceramic", all, "lid-ceramic"), lid: { priceDelta: 25_000 } },
        { id: "clear-glass", name: { vi: "Thủy tinh trong", en: "Clear glass" }, priceDelta: 25_000, available: true, swatch: "#dfe7e6", shape: "jar", translucent: true, supportedSizeIds: all, sizeMaterials: perSize("jar-clear-glass", all), lid: null },
        { id: "amber-glass", name: { vi: "Thủy tinh hổ phách", en: "Amber glass" }, priceDelta: 50_000, available: true, swatch: "#9a5a26", shape: "jar", translucent: true, supportedSizeIds: all, sizeMaterials: perSize("jar-amber-glass", all, "lid-amber"), lid: { priceDelta: 25_000 } },
        { id: "plaster", name: { vi: "Hũ thạch cao", en: "Plaster" }, priceDelta: 75_000, available: true, swatch: "#f1ece4", shape: "bowl", supportedSizeIds: ["s200", "s250"], sizeMaterials: perSize("jar-plaster", ["s200", "s250"]), lid: null },
        { id: "tin", name: { vi: "Hũ thiếc", en: "Tin" }, priceDelta: 25_000, available: true, swatch: "#c3c6ca", shape: "tin", supportedSizeIds: ["s150", "s200"], sizeMaterials: perSize("jar-tin", ["s150", "s200"], "lid-tin"), lid: { priceDelta: 0 } },
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
      // Sáp tính theo gram: mỗi gram nến cần 1 gram sáp
      gramsPerGram: 1,
      options: [
        { id: "soy", name: { vi: "Sáp đậu nành", en: "Soy wax" }, description: { vi: "Tiêu chuẩn, cháy sạch", en: "Standard, clean burn" }, priceDelta: 0, available: true, materialId: "wax-soy", swatch: "#f6efe2" },
        { id: "coconut", name: { vi: "Sáp dừa", en: "Coconut wax" }, description: { vi: "Tỏa hương mạnh, mặt sáp mịn", en: "Strong throw, creamy top" }, priceDelta: 25_000, available: true, materialId: "wax-coconut", swatch: "#fbf7ef" },
        { id: "beeswax", name: { vi: "Sáp ong", en: "Beeswax" }, description: { vi: "Mùi mật nhẹ, màu vàng tự nhiên", en: "Light honey note, natural gold" }, priceDelta: 50_000, available: true, materialId: "wax-beeswax", swatch: "#f0d48a" },
        { id: "blend", name: { vi: "Sáp pha trộn", en: "Wax blend" }, description: { vi: "Đậu nành + dừa", en: "Soy + coconut" }, priceDelta: 10_000, available: true, materialId: "wax-blend", swatch: "#f8f1e6" },
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
      options: [
        { id: "vanilla", name: { vi: "Vanilla", en: "Vanilla" }, priceDelta: 0, available: true, materialId: "oil-vanilla", swatch: "#f3d9a4" },
        { id: "lavender", name: { vi: "Lavender", en: "Lavender" }, priceDelta: 0, available: true, materialId: "oil-lavender", swatch: "#b9a6d6" },
        { id: "white-tea", name: { vi: "White Tea", en: "White Tea" }, priceDelta: 10_000, available: true, materialId: "oil-white-tea", swatch: "#cfd8b8" },
        { id: "sandalwood", name: { vi: "Sandalwood", en: "Sandalwood" }, priceDelta: 25_000, available: true, materialId: "oil-sandalwood", swatch: "#a8794f" },
        { id: "rose", name: { vi: "Rose", en: "Rose" }, priceDelta: 0, available: true, materialId: "oil-rose", swatch: "#d9646d" },
        { id: "citrus", name: { vi: "Citrus", en: "Citrus" }, priceDelta: 0, available: true, materialId: "oil-citrus", swatch: "#f2b84b" },
        { id: "none", name: { vi: "Không mùi", en: "Unscented" }, priceDelta: 0, available: true, exclusive: true },
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
      options: [
        { id: "cotton", name: { vi: "Bấc cotton", en: "Cotton wick" }, description: { vi: "Lửa êm, ổn định", en: "Calm, steady flame" }, priceDelta: 0, available: true, materialId: "wick-cotton", look: "cotton" },
        // Bấc gỗ: không hợp hũ thiếc (miệng hẹp) và sáp ong (cháy không đều)
        {
          id: "wood",
          name: { vi: "Bấc gỗ", en: "Wooden wick" },
          description: { vi: "Tiếng lách tách như lò sưởi", en: "Crackles like a fireplace" },
          priceDelta: 40_000,
          available: true,
          materialId: "wick-wood",
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
      options: [
        // Không có màu = giữ màu tự nhiên của sáp (ảnh minh họa dùng màu của bước Sáp)
        { id: "natural", name: { vi: "Không màu", en: "Undyed" }, priceDelta: 0, available: true },
        { id: "cream", name: { vi: "Trắng kem", en: "Cream" }, priceDelta: 0, available: true, materialId: "dye-cream", swatch: "#f3ead8" },
        { id: "beige", name: { vi: "Be", en: "Beige" }, priceDelta: 10_000, available: true, materialId: "dye-beige", swatch: "#e6cfae" },
        { id: "sage", name: { vi: "Xanh sage", en: "Sage" }, priceDelta: 10_000, available: true, materialId: "dye-sage", swatch: "#a9b59a" },
        { id: "brown", name: { vi: "Nâu", en: "Brown" }, priceDelta: 10_000, available: true, materialId: "dye-brown", swatch: "#a07c62" },
        { id: "pastel-pink", name: { vi: "Hồng pastel", en: "Pastel pink" }, priceDelta: 10_000, available: true, materialId: "dye-pastel-pink", swatch: "#f0b3a8" },
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
      options: [
        { id: "none", name: { vi: "Không trang trí", en: "No decoration" }, priceDelta: 0, available: true },
        { id: "botanical", name: { vi: "Hoa khô quanh thành hũ", en: "Botanical rim" }, description: { vi: "Đặt sát thành, cách xa ngọn lửa", en: "Set at the rim, away from the flame" }, priceDelta: 75_000, available: true, materialId: "decor-botanical", look: "flowers" },
        { id: "wax-pattern", name: { vi: "Họa tiết sáp", en: "Wax pattern" }, priceDelta: 50_000, available: true, materialId: "decor-pattern", look: "pattern" },
        { id: "wax-topper", name: { vi: "Topping sáp tạo hình", en: "Sculpted wax topper" }, priceDelta: 90_000, available: true, materialId: "decor-topper", look: "topper" },
        // Chưa được duyệt an toàn — tạm ẩn với khách
        { id: "glitter", name: { vi: "Kim tuyến", en: "Glitter" }, priceDelta: 50_000, available: false, materialId: "decor-glitter" },
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
        { id: "giftBox", name: { vi: "Hộp quà", en: "Gift box" }, description: { vi: "Hộp cứng kèm thiệp", en: "Rigid box with a card" }, priceDelta: 75_000, available: true, enabled: true, materialId: "box-gift" },
      ],
    },
  ],
};
