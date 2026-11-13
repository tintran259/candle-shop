// Kích thước trang chủ web thu nhỏ trong khung xem trước (components/site-theme/preview-page.tsx): bề ngang trang, chiều cao hero,
// chiều cao thanh điều hướng trên hero / khi đã cuộn qua (như fe/src/components/site-header.tsx)
export const PAGE = {
  desktop: { w: 1280, hero: 800, bar: 100, solidBar: 64 },
  mobile: { w: 390, hero: 680, bar: 72, solidBar: 64 },
};
export type Device = keyof typeof PAGE;

// Thẻ Xưởng nến trong khung xem trước — chọn như BE (be/src/shop/shop.module.ts home()): mẫu chọn ở giao diện còn bán trên web (Đang bán,
// danh mục hiện, đúng mùa) theo thứ tự — đủ 3 thì lấy hết (hơn 3: băng chuyền), thiếu thì bù mẫu nổi bật rồi mẫu khác; không đủ 3 thì null (web dùng 3 thẻ có sẵn)
export type PreviewCard = { id: string; name: string; category: string; price: number; image?: string };
type CardProduct = { id: string; name: string; price: number; salePrice?: number; images: string[]; categoryId: string; status: string; isFeatured: boolean; conceptIds?: string[] };

export function previewCards(
  productIds: string[] | undefined,
  products: CardProduct[],
  categories: { id: string; hidden: boolean; name: { vi: string } }[],
  onWeb: (p: CardProduct) => boolean,
): PreviewCard[] | null {
  const listed = products.filter((p) => p.status === "active" && categories.some((c) => c.id === p.categoryId && !c.hidden) && onWeb(p));
  const picked = (productIds ?? []).flatMap((id) => listed.find((p) => p.id === id) ?? []);
  const rest = listed.filter((p) => !picked.includes(p));
  const cards = picked.length >= 3 ? picked : [...picked, ...rest.filter((p) => p.isFeatured), ...rest.filter((p) => !p.isFeatured)].slice(0, 3);
  if (cards.length < 3) return null;
  return cards.map((p) => ({ id: p.id, name: p.name, category: categories.find((c) => c.id === p.categoryId)?.name.vi ?? "", price: p.salePrice ?? p.price, image: p.images[0] }));
}

// Màu, font của trang chủ web (fe/src/app/globals.css) dùng trong khung xem trước
export const C = {
  cream: "#f5f2e9",
  night: "#282720",
  smoke: "#39372f",
  linen: "#f5f2e9",
  sand: "#e2d7bd",
  mist: "#eee9de",
  ink: "#312d28",
  muted: "#615e54",
  wine: "#650f21",
  copper: "#876042",
  rule: "#bbb4a4",
};
export const serif = "'Cormorant Garamond', 'Times New Roman', serif";
export const sans = "Inter, system-ui, sans-serif";
