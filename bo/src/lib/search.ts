// Tìm kiếm toàn cục trên header: gom đơn hàng, khách hàng, sản phẩm, mã giảm giá, nguyên liệu và các trang.
// Chưa có API nên lọc ngay trên dữ liệu đã tải. Khi có BE thay bằng GET /api/search?q=.
import { optionGroupKeys, optionGroups, stockLevel } from "@/lib/craft/groups";
import type { BaseOption, CustomizerCatalog } from "@/lib/craft/types";
import type { Customer } from "@/lib/customers/types";
import { discountStatus, statusMeta as discountStatusMeta, valueText } from "@/lib/discounts/labels";
import type { Discount } from "@/lib/discounts/types";
import { formatMoney } from "@/lib/format";
import { statusMeta as orderStatusMeta } from "@/lib/orders/labels";
import type { Order } from "@/lib/orders/types";
import type { Product } from "@/lib/products/types";

export type SearchGroup = "pages" | "orders" | "customers" | "products" | "discounts" | "materials";

export const searchGroupLabels: Record<SearchGroup, string> = {
  pages: "Trang & thao tác",
  orders: "Đơn hàng",
  customers: "Khách hàng",
  products: "Sản phẩm",
  discounts: "Mã giảm giá",
  materials: "Nguyên liệu",
};

export type SearchResult = {
  key: string;
  group: SearchGroup;
  title: string;
  subtitle?: string;
  // Tag trạng thái bên phải (màu preset antd, luôn kèm chữ)
  tag?: { label: string; color: string };
  image?: string;
  swatch?: string;
  // Đường dẫn mở kết quả (kèm ?order= / ?edit= để mở đúng drawer)
  to: string;
};

// Bỏ dấu + chữ thường từng ký tự — giữ đúng độ dài để tô đậm đúng vị trí trên chữ gốc
const foldChar = (c: string) => {
  const f = c.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
  return f.length === 1 ? f : c;
};
export const fold = (s: string) => Array.from(s, foldChar).join("");
const digits = (s: string) => s.replace(/\D/g, "");

// Vị trí khớp đầu tiên trong chữ gốc (theo ký tự) — null nếu không khớp
export function matchRange(text: string, q: string): [number, number] | null {
  const needle = fold(q.trim());
  if (!needle) return null;
  const chars = Array.from(text);
  const i = chars.map(foldChar).join("").indexOf(needle);
  return i < 0 ? null : [i, i + Array.from(needle).length];
}

const matches = (q: string, ...fields: (string | undefined)[]) => fields.some((f) => f && fold(f).includes(q));

const PER_GROUP = 5;

export type SearchSources = {
  pages: { label: string; path: string; keywords?: string }[];
  orders: Order[];
  customers: Customer[];
  products: Product[];
  discounts: Discount[];
  catalog: CustomizerCatalog;
};

export function search(raw: string, src: SearchSources): SearchResult[] {
  const q = fold(raw.trim());
  if (!q) return [];
  const qDigits = digits(raw);

  const pages: SearchResult[] = src.pages
    .filter((p) => matches(q, p.label, p.keywords))
    .map((p) => ({ key: `page:${p.path}`, group: "pages", title: p.label, to: p.path }));

  const orders: SearchResult[] = src.orders
    .filter(
      (o) =>
        matches(q, o.code, o.customer.name, o.customer.email) ||
        (qDigits.length >= 3 && digits(o.customer.phone).includes(qDigits)),
    )
    .map((o) => ({
      key: `order:${o.id}`,
      group: "orders",
      title: o.code,
      subtitle: `${o.customer.name} · ${o.customer.phone} · ${formatMoney(o.total)}`,
      tag: { label: orderStatusMeta[o.status].label, color: orderStatusMeta[o.status].color },
      image: o.items[0]?.image,
      to: `/orders?order=${o.id}`,
    }));

  const customers: SearchResult[] = src.customers
    .filter((c) => matches(q, c.name, c.email) || (qDigits.length >= 3 && digits(c.phone).includes(qDigits)))
    .map((c) => ({
      key: `customer:${c.id}`,
      group: "customers",
      title: c.name,
      subtitle: `${c.phone} · ${c.email}`,
      tag: c.blocked ? { label: "Đã chặn", color: "red" } : undefined,
      to: `/customers?customer=${c.id}`,
    }));

  const products: SearchResult[] = src.products
    .filter((p) => matches(q, p.name, p.scent))
    .map((p) => ({
      key: `product:${p.id}`,
      group: "products",
      title: p.name,
      subtitle: [p.scent, formatMoney(p.salePrice ?? p.price)].filter(Boolean).join(" · "),
      tag: p.status === "hidden" ? { label: "Đang ẩn", color: "default" } : undefined,
      image: p.images[0],
      to: `/products?edit=${p.id}`,
    }));

  const discounts: SearchResult[] = src.discounts
    .filter((d) => matches(q, d.code, d.description))
    .map((d) => {
      const s = discountStatus(d);
      return {
        key: `discount:${d.id}`,
        group: "discounts",
        title: d.code,
        subtitle: [valueText(d), d.description].filter(Boolean).join(" · "),
        tag: { label: discountStatusMeta[s].label, color: discountStatusMeta[s].color },
        to: `/discounts?edit=${d.id}`,
      };
    });

  const materials: SearchResult[] = optionGroupKeys.flatMap((g) =>
    (src.catalog[g] as BaseOption[])
      .filter((m) => matches(q, m.name.vi, m.name.en))
      .map((m) => {
        const level = stockLevel(m);
        return {
          key: `material:${g}:${m.id}`,
          group: "materials" as const,
          title: m.name.vi,
          subtitle: `${optionGroups[g].label} · ${m.name.en}`,
          tag: level === "out" ? { label: "Hết hàng", color: "red" } : level === "low" ? { label: "Sắp hết", color: "orange" } : undefined,
          image: m.images?.[0],
          swatch: m.swatch,
          to: `/craft?tab=${g}&edit=${m.id}`,
        };
      }),
  );

  // Khách trước đơn: gõ tên người thì hồ sơ khách hữu ích hơn từng đơn lẻ
  return [pages, customers, orders, products, discounts, materials].flatMap((list) => list.slice(0, PER_GROUP));
}
