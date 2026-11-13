// SEO trang chi tiết sản phẩm (app/products/[slug]/page.tsx): thẻ meta (tiêu đề, mô tả, canonical, Open Graph, thẻ X) + dữ liệu có cấu trúc schema.org
// (Product kèm giá + BreadcrumbList) để Google hiện giá, ảnh và đường dẫn. Ảnh chia sẻ: ảnh https đầu tiên (Cloudinary, thu về 1200px), chưa có thì ảnh mặc định
import type { Metadata } from "next";
import { cloudinaryFit, productUrl, type ShopProduct } from "@/lib/shop";
import { OG_BASE, OG_IMAGE, SITE_URL } from "@/lib/site";

const BRAND = "2510 Candle";
const abs = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);
const httpsImages = (p: ShopProduct) => p.images.filter((s) => s.startsWith("https://"));

// Mô tả ≤ 160 ký tự, cắt ở ranh giới từ (không cắt giữa chữ) và thêm "…"
export function metaDescription(p: ShopProduct, max = 160) {
  const text = (p.description || p.scent || "").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,.;:–-]+$/, "")}…`;
}

export function productMetadata(p: ShopProduct): Metadata {
  const description = metaDescription(p);
  const url = productUrl(p);
  const first = httpsImages(p)[0];
  const image = first ? { url: cloudinaryFit(first, 1200), alt: p.name } : OG_IMAGE;
  return {
    title: `${p.name} — ${BRAND}`,
    description,
    alternates: { canonical: url },
    openGraph: { ...OG_BASE, title: p.name, description, url, images: [image] },
    twitter: { card: "summary_large_image", title: p.name, description, images: [image.url] },
  };
}

export function productJsonLd(p: ShopProduct, category?: { id: string; name: string }) {
  const url = abs(productUrl(p));
  const images = httpsImages(p).map((s) => cloudinaryFit(s, 1200));
  const crumbs = [
    { name: "Trang chủ", url: SITE_URL },
    { name: "Sản phẩm", url: `${SITE_URL}/products` },
    ...(category ? [{ name: category.name, url: `${SITE_URL}/products?category=${encodeURIComponent(category.id)}` }] : []),
    { name: p.name, url },
  ];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${url}#product`,
        name: p.name,
        url,
        sku: p.id,
        description: p.description || p.scent || undefined,
        image: images.length ? images : [abs(OG_IMAGE.url)],
        brand: { "@type": "Brand", name: BRAND },
        category: category?.name,
        offers: {
          "@type": "Offer",
          url,
          price: p.salePrice ?? p.price,
          priceCurrency: "VND",
          availability: "https://schema.org/MadeToOrder",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: BRAND },
        },
      },
      { "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })) },
    ],
  };
}
