// sitemap.xml cho công cụ tìm kiếm: trang chủ, trang Sản phẩm, từng mẫu đang bán (GET /shop/products). Làm mới mỗi giờ; BE lỗi thì chỉ 2 trang chính
import type { MetadataRoute } from "next";
import { getShopProducts, productUrl } from "@/lib/shop";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getShopProducts();
  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    ...(data?.products ?? []).map((p) => ({ url: `${SITE_URL}${productUrl(p)}`, changeFrequency: "weekly" as const, priority: 0.7 })),
  ];
}
