import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "2510 Candle",
    description: "Nến thơm sáp đậu nành thủ công — cháy sạch, lòng an yên.",
    start_url: "/",
    display: "standalone",
    lang: "vi",
    background_color: "#f9f5ea",
    theme_color: "#0c0d12",
    icons: [
      { src: "/images/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/images/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/images/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
