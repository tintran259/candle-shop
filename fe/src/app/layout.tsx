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
};

export const viewport: Viewport = { themeColor: "#282720" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${cormorant.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Đánh dấu có JS trước khi vẽ trang — CSS ẩn sẵn phần tử có hiệu ứng, tránh nháy */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
