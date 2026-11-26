import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { OG_BASE, OG_IMAGE, SITE_DESCRIPTION, SITE_URL } from "@/lib/site";

const cormorant = Cormorant_Garamond({ subsets: ["latin", "vietnamese"], weight: ["400"], variable: "--font-cormorant", display: "swap" });
const inter = Inter({ subsets: ["latin", "vietnamese"], weight: ["400"], variable: "--font-inter", display: "swap" });

const description = SITE_DESCRIPTION;
// metadataBase: link ảnh chia sẻ (Zalo, Facebook) thành tuyệt đối theo SITE_URL. Ảnh chia sẻ mặc định = ảnh hero; trang chi tiết dùng ảnh mẫu nến
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "2510 Candle — Nến thơm thủ công",
  description,
  openGraph: { ...OG_BASE, title: "2510 Candle — Nến thơm thủ công", description, images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", title: "2510 Candle — Nến thơm thủ công", description, images: [OG_IMAGE.url] },
  alternates: { canonical: "/" },
  // Thêm vào màn hình chính trên iPhone: mở toàn màn hình, tên dưới icon (manifest: app/manifest.ts)
  appleWebApp: { capable: true, title: "2510 Candle", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#282720" };

// Đánh dấu có JS (CSS ẩn sẵn phần tử có hiệu ứng) + cách người dùng đang thao tác: bấm Tab → data-kbd (hiện vòng focus, globals.css),
// chạm / bấm chuột → bỏ. Trước đây vòng focus hiện cả khi chạm (vd đóng ô tìm kiếm, focus trả về nút → viền trắng quanh nút / logo)
const KBD_SCRIPT = `document.documentElement.classList.add('js');
addEventListener('keydown',function(e){if(e.key==='Tab')document.documentElement.dataset.kbd='1'},true);
addEventListener('pointerdown',function(){delete document.documentElement.dataset.kbd},true);`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${cormorant.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Đánh dấu có JS trước khi vẽ trang — CSS ẩn sẵn phần tử có hiệu ứng, tránh nháy */}
        <script dangerouslySetInnerHTML={{ __html: KBD_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
