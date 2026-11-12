// Dữ liệu GIẢ cho trang Sản phẩm — chỉ dùng khi SHOP_MOCK=1 (fe/.env.local) để thử giao diện mà không cần chạy BE / đụng DB.
// Cùng dạng với GET /api/shop/products. Ảnh lấy từ public/images có sẵn trong fe
import type { ShopContact, ShopData, ShopProduct } from "@/lib/shop";

// SĐT giả — chỉ để nút "Liên hệ đặt nến" hiện ra khi thử giao diện
export const mockShopContact: ShopContact = { name: "2510 Candle", phone: "0901 234 567" };

const categories = [
  { id: "thu-gian", name: "Thư giãn", nameEn: "Relax" },
  { id: "go-am", name: "Gỗ ấm", nameEn: "Woody" },
  { id: "hoa-co", name: "Hoa cỏ", nameEn: "Floral" },
  { id: "trai-cay", name: "Trái cây", nameEn: "Fruity" },
];

// Concept (dịp lễ) và các mẫu thuộc từng concept — một mẫu có thể thuộc nhiều concept, nhiều mẫu không thuộc concept nào
// Noel đang trong mùa; Tết, Valentine sắp tới → mẫu chỉ thuộc Tết / Valentine đang đóng bán (ẩn), như BE; Quà tặng chưa có mẫu
const concepts = [
  { id: "noel", name: "Noel", nameEn: "Christmas", startsOn: "2026-11-01", endsOn: "2026-12-26" },
  { id: "tet", name: "Tết", nameEn: "Lunar New Year", startsOn: "2027-01-20", endsOn: "2027-02-20" },
  { id: "valentine", name: "Valentine", nameEn: "Valentine", startsOn: "2027-02-01", endsOn: "2027-02-14" },
  // Không đặt ngày, chưa gắn mẫu → web báo "chưa có mẫu"
  { id: "qua-tang", name: "Quà tặng", nameEn: "Gifts", startsOn: null, endsOn: null },
];
const today = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
const inSeason = (id: string) => {
  const c = concepts.find((x) => x.id === id)!;
  return (!c.startsOn || c.startsOn <= today) && (!c.endsOn || today <= c.endsOn);
};
const conceptOf: Record<string, string[]> = {
  "Giờ Vàng": ["noel", "tet"],
  "Hổ Phách Đêm": ["noel"],
  "Cam Quế": ["noel", "tet"],
  "Gỗ Trầm": ["noel"],
  "Tuyết Tùng": ["noel"],
  "Hoa Bưởi": ["tet"],
  "Đào Mật": ["tet"],
  "Hồng Nhung": ["valentine"],
  "Mộc Lan": ["valentine"],
  "Nhài Trắng": ["valentine"],
};

const img = (n: string) => `/images/${n}.jpg`;
// Ảnh dạng data URL (như khi BO chưa cấu hình Cloudinary) — để thử: danh sách / tìm kiếm bỏ ảnh này, trang chi tiết vẫn hiện
const DATA_IMAGE =
  "data:image/svg+xml;base64," +
  Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#650f21"/><circle cx="5" cy="5" r="3" fill="#f5f2e9"/></svg>').toString("base64");

// [tên, danh mục, giá, giá giảm, mức hương, cỡ, giờ cháy, nốt hương, ảnh, mới, nổi bật]
type Row = [string, string, number, number | null, ShopProduct["aromaLevel"], ShopProduct["size"], number, string, string[], boolean, boolean];
const rows: Row[] = [
  ["Sáng Chủ Nhật", "thu-gian", 320000, null, "soft", "medium", 45, "Cam bergamot, trà trắng, xạ hương nhẹ", ["sunday-morning", "story"], true, true],
  ["Giờ Vàng", "go-am", 340000, 299000, "medium", "medium", 45, "Hổ phách, đàn hương, vani", ["golden-hour", "care"], false, true],
  ["Vào Rừng", "go-am", 340000, null, "strong", "medium", 45, "Tuyết tùng, lá sung, đất ẩm", ["into-the-woods", "footer"], false, true],
  ["Hồng Nhung", "hoa-co", 360000, null, "medium", "medium", 40, "Hoa hồng Damask, quả mọng", ["golden-hour"], true, false],
  ["Trà Chiều", "thu-gian", 290000, 249000, "soft", "small", 25, "Trà đen, sữa, mật ong", ["sunday-morning"], false, false],
  ["Hổ Phách Đêm", "go-am", 420000, null, "strong", "big", 60, "Hổ phách, khói gỗ, da thuộc", ["story", "into-the-woods"], false, false],
  ["Cam Quế", "trai-cay", 280000, null, "medium", "small", 25, "Cam ngọt, quế, đinh hương", ["care"], false, false],
  ["Nhài Trắng", "hoa-co", 330000, null, "soft", "medium", 40, "Hoa nhài, xạ hương trắng", ["newsletter", "sunday-morning"], true, false],
  ["Biển Muối", "thu-gian", 350000, 315000, "medium", "medium", 45, "Muối biển, xô thơm, bergamot", ["footer"], false, false],
  ["Gỗ Trầm", "go-am", 450000, null, "strong", "big", 60, "Trầm hương, gỗ tuyết tùng, vani", ["into-the-woods"], false, false],
  ["Đào Mật", "trai-cay", 300000, 259000, "soft", "small", 25, "Đào, mật ong, hoa mộc lan", ["sunday-morning", "golden-hour"], false, false],
  ["Oải Hương", "thu-gian", 310000, null, "soft", "medium", 40, "Oải hương, cỏ xạ hương, gỗ trắng", ["care", "newsletter"], true, false],
  ["Lá Sung Xanh", "hoa-co", 340000, null, "medium", "medium", 40, "Lá sung, cam chanh, gỗ xanh", ["into-the-woods"], false, false],
  ["Chanh Sả", "trai-cay", 270000, null, "medium", "small", 25, "Chanh vàng, sả, gừng", ["footer", "care"], false, false],
  ["Mộc Lan", "hoa-co", 380000, 342000, "medium", "big", 55, "Mộc lan, phong lữ, xạ hương", ["golden-hour"], false, false],
  ["Cà Phê Sữa", "go-am", 320000, null, "strong", "medium", 45, "Cà phê rang, sữa, hạt dẻ", ["story"], false, false],
  ["Tuyết Tùng", "go-am", 360000, null, "medium", "medium", 45, "Tuyết tùng, cỏ hương bài, tiêu hồng", ["into-the-woods", "story"], false, false],
  ["Dừa Vani", "trai-cay", 290000, null, "soft", "small", 25, "Dừa, vani, đường nâu", ["sunday-morning"], true, false],
  ["Hoa Bưởi", "hoa-co", 320000, 279000, "soft", "medium", 40, "Hoa bưởi, vỏ bưởi, trà xanh", ["newsletter"], false, false],
  ["Đêm Yên", "thu-gian", 400000, null, "medium", "big", 60, "Hoa cúc La Mã, gỗ đàn hương, vani", ["care", "golden-hour"], false, false],
];

const descriptions: Record<string, string> = {
  "Sáng Chủ Nhật":
    "Như một buổi sáng không vội: ánh nắng qua rèm, ấm trà vừa pha và tiếng nhạc nhỏ. Cam bergamot mở đầu tươi sáng, trà trắng ở giữa dịu dàng, xạ hương nhẹ lưu lại trên chăn gối.\n\nĐổ tay từ sáp đậu nành, bấc cotton cháy êm, hũ gốm đen viền đồng dùng lại được sau khi nến cháy hết.",
  "Giờ Vàng": "Hổ phách ấm, đàn hương và vani — mùi của buổi chiều muộn.",
  "Hổ Phách Đêm": "Mùi hương đậm cho những tối dài: hổ phách, khói gỗ và da thuộc quyện nhau, lan rộng trong phòng lớn. Hợp phòng khách, phòng đọc sách hay những buổi tối cuối tuần bên bạn bè.",
};

const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

const allProducts = rows
  .map(([name, categoryId, price, sale, aromaLevel, size, burnTime, scent, images, isNew, isFeatured]) => ({
    id: slug(name),
    name,
    slug: slug(name),
    price,
    ...(sale && { salePrice: sale }),
    description: descriptions[name] ?? `${name} mang hương ${scent.toLowerCase()}, đổ tay từ sáp đậu nành và bấc cotton. Một hũ nến nhỏ cho những khoảnh khắc bạn muốn chậm lại.`,
    images: [...images.map(img), ...(name === "Đêm Yên" ? [DATA_IMAGE] : [])],
    categoryId,
    conceptIds: conceptOf[name] ?? [],
    aromaLevel,
    size,
    scent,
    waxType: "Sáp đậu nành",
    burnTime,
    isNew,
    isFeatured,
    rating: 0,
    reviewCount: 0,
  }))
  .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));

// Như BE: bán khi không có concept hoặc có concept đang trong mùa; conceptIds chỉ giữ concept đang trong mùa
const products = allProducts.filter((p) => !p.conceptIds.length || p.conceptIds.some(inSeason)).map((p) => ({ ...p, conceptIds: p.conceptIds.filter(inSeason) }));

export const mockShopData: ShopData = {
  categories,
  // Như BE: mọi concept chưa kết thúc (Tết, Valentine sắp tới → web đếm ngược)
  concepts: concepts.filter((c) => !c.endsOn || today <= c.endsOn),
  products,
};

// Trang chủ giả (như GET /shop/home): giao diện mặc định có thanh thông báo riêng, 3 mẫu đầu (nổi bật trước)
const featured = products.slice(0, 3);
export const mockHome = {
  theme: { conceptId: null, announcementOn: true, announcement: "Dữ liệu giả · Mỗi hũ nến được đổ tay theo đơn của bạn", logo: {}, hero: {} },
  featured,
  categories: categories.filter((c) => featured.some((p) => p.categoryId === c.id)),
};
