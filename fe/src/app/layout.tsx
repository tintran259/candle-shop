import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin", "vietnamese"], weight: ["400"], variable: "--font-cormorant", display: "swap" });
const inter = Inter({ subsets: ["latin", "vietnamese"], weight: ["400"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "2510 Candle — Nến thơm thủ công",
  description: "Nến thơm đổ tay theo đơn trong 2–3 ngày, dành cho những khoảnh khắc bạn muốn chậm lại.",
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
