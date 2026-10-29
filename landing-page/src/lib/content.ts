// Dữ liệu tĩnh của landing page — chữ hiển thị nằm trong messages/*.json

export const navLinks = [
  { href: "#collection", key: "collection" },
  { href: "#best-sellers", key: "bestSellers" },
  { href: "#large-orders", key: "largeOrders" },
  { href: "#about", key: "about" },
] as const;

export const benefits = [
  { icon: "/images/icon-shipped.png", key: "delivery" },
  { icon: "/images/icon-secure.png", key: "secure" },
  { icon: "/images/icon-loyalty.png", key: "loyalty" },
] as const;

export const collections = {
  featured: { image: "/images/collection-large.png", key: "morning" },
  items: [
    { image: "/images/collection-small-1.png", key: "midnight" },
    { image: "/images/collection-small-2.png", key: "seasonal" },
  ],
} as const;

export const products = [
  { id: "wood", price: 450_000, image: "/images/product-1.png" },
  { id: "sage", price: 250_000, image: "/images/product-2.png" },
  { id: "amber", price: 350_000, image: "/images/product-3.png" },
  { id: "linen", price: 250_000, image: "/images/product-4.png" },
] as const;

export type Product = (typeof products)[number];

// Giá luôn là VNĐ; chỉ cách viết số đổi theo ngôn ngữ
export const formatPrice = (n: number, locale: string) =>
  new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);
