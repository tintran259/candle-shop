// robots.txt: cho công cụ tìm kiếm đọc mọi trang, trừ API nội bộ của web; chỉ tới sitemap.xml
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
