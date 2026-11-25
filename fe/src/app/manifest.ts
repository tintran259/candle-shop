import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION } from "@/lib/site";

// PWA: thêm web vào màn hình chính điện thoại (docs/pwa.md). Không có service worker — luôn tải bản mới nhất.
// Icon: public/pwa (tạo từ app/icon.png); iPhone dùng app/apple-icon.png
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "2510 Candle — Nến thơm thủ công",
    short_name: "2510 Candle",
    description: SITE_DESCRIPTION,
    lang: "vi",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#282720",
    theme_color: "#282720",
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
