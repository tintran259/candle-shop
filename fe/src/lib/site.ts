// Địa chỉ chính của web (SITE_URL, vd https://2510candle.vn) — dùng cho link tuyệt đối: metadataBase (ảnh chia sẻ link), sitemap.xml, robots.txt.
// Chưa đặt thì dùng máy dev
export const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

// Phần Open Graph chung (layout + trang chi tiết): trang nào khai báo openGraph riêng thì Next thay hẳn, không gộp — nên trang con phải trải lại phần này
export const OG_BASE = { type: "website", locale: "vi_VN", siteName: "2510 Candle" } as const;
// Ảnh chia sẻ mặc định 1200×630 (trang chủ, trang Sản phẩm; trang chi tiết khi mẫu chưa có ảnh https): logo 2510 màu đồng trên nền kem + slogan
// "Nến chăm chút. Nghi thức ấm áp." — ảnh tĩnh public/brand/og-2510.png. Đổi ảnh: đặt tên file mới (Zalo / Facebook lưu đệm theo đường dẫn)
export const OG_IMAGE = { url: "/brand/og-2510.png", width: 1200, height: 630, alt: "2510 Candle — Nến chăm chút. Nghi thức ấm áp." };
export const SITE_DESCRIPTION = "Nến thơm đổ tay theo đơn trong 2–3 ngày, dành cho những khoảnh khắc bạn muốn chậm lại.";
