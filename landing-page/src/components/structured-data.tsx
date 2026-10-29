import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { products } from "@/lib/content";
import { absoluteUrl, localePath, SITE_NAME, SITE_URL } from "@/lib/site";

// JSON-LD cho Google: thương hiệu, website và danh sách sản phẩm (giá VNĐ)
export async function StructuredData({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "Metadata" });
  const tp = await getTranslations({ locale, namespace: "BestSellers.products" });
  const pageUrl = absoluteUrl(localePath(locale));
  const orgId = `${SITE_URL}/#organization`;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Store",
        "@id": orgId,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/images/icon-512.png"),
        image: absoluteUrl("/images/hero-candle.jpg"),
        description: t("description"),
        currenciesAccepted: "VND",
        paymentAccepted: "VNPay, MoMo, Credit Card",
        areaServed: "VN",
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: ["vi-VN", "en-US"],
        publisher: { "@id": orgId },
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: t("title"),
        description: t("description"),
        inLanguage: locale === "vi" ? "vi-VN" : "en-US",
        isPartOf: { "@id": `${SITE_URL}/#website` },
        primaryImageOfPage: absoluteUrl("/images/hero-candle.jpg"),
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#best-sellers`,
        itemListElement: products.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Product",
            name: tp(`${p.id}.name`),
            description: tp(`${p.id}.description`),
            image: absoluteUrl(p.image),
            sku: `2510-${p.id}`,
            brand: { "@type": "Brand", name: SITE_NAME },
            offers: {
              "@type": "Offer",
              url: `${pageUrl}#best-sellers`,
              priceCurrency: "VND",
              price: p.price,
              availability: "https://schema.org/InStock",
              seller: { "@id": orgId },
            },
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Thoát "<" để chuỗi dữ liệu không thể đóng thẻ script
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
