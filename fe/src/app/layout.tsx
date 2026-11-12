import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

const cormorant = Cormorant_Garamond({ subsets: ["latin", "vietnamese"], weight: ["400"], variable: "--font-cormorant", display: "swap" });
const inter = Inter({ subsets: ["latin", "vietnamese"], weight: ["400"], variable: "--font-inter", display: "swap" });

const description = "Nến thơm đổ tay theo đơn trong 2–3 ngày, dành cho những khoảnh khắc bạn muốn chậm lại.";
// metadataBase: link ảnh chia sẻ (Zalo, Facebook) thành tuyệt đối theo SITE_URL. Ảnh chia sẻ mặc định = ảnh hero; trang chi tiết dùng ảnh mẫu nến
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "2510 Candle — Nến thơm thủ công",
  description,
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "2510 Candle",
    title: "2510 Candle — Nến thơm thủ công",
    description,
    images: [{ url: "/images/hero-2510-v2.jpg", alt: "Hũ nến 2510 Candle đang cháy trên khối đá" }],
  },
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
