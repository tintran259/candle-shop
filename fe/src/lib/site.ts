// Địa chỉ chính của web (SITE_URL, vd https://2510candle.vn) — dùng cho link tuyệt đối: metadataBase (ảnh chia sẻ link), sitemap.xml, robots.txt.
// Chưa đặt thì dùng máy dev
export const SITE_URL = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
