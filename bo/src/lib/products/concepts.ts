// Concept (dịp lễ / bộ sưu tập: Noel, Tết…): phân loại thứ hai bên cạnh danh mục, admin tự thêm ở trang Concept.
// Mỗi sản phẩm thuộc 0..n concept (không bắt buộc). Web hiện hàng lọc Concept phía trên hàng Danh mục; concept ẩn không hiện trên web
import type { Taxonomy, TaxonomyKind } from "@/lib/products/taxonomy";

export type Concept = Taxonomy;

// Dữ liệu mẫu khi lưu trên trình duyệt (chế độ local)
export const defaultConcepts: Concept[] = [
  { id: "noel", name: { vi: "Noel", en: "Christmas" }, color: "red", hidden: false },
  { id: "tet", name: { vi: "Tết", en: "Lunar New Year" }, color: "gold", hidden: false },
];

export const conceptKind: TaxonomyKind = {
  noun: "concept",
  placeholder: "VD: Noel",
  fallbackId: "concept",
  productsHref: (id) => `/products?concept=${encodeURIComponent(id)}`,
  removeWhenUsed: true,
  dates: true,
};

// Mùa (docs/pages/concepts.md#thời-gian) — cùng quy tắc với BE (be/src/concepts/season.ts):
// ngày giờ VN, tính cả hai đầu, trống = mọi ngày. Sản phẩm chỉ hiện trên web khi có concept hiện đang trong mùa (hoặc không có concept hiện nào)
export type Season = "always" | "on" | "upcoming" | "ended";

export const todayVN = (now = Date.now()) => new Date(now + 7 * 3_600_000).toISOString().slice(0, 10);

export function seasonOf(c: Pick<Concept, "startsOn" | "endsOn">, today = todayVN()): Season {
  if (!c.startsOn && !c.endsOn) return "always";
  if (c.startsOn && today < c.startsOn) return "upcoming";
  if (c.endsOn && today > c.endsOn) return "ended";
  return "on";
}

export const seasonLabels: Record<Season, { label: string; color: string }> = {
  always: { label: "Mọi ngày", color: "default" },
  on: { label: "Đang mở bán", color: "green" },
  upcoming: { label: "Sắp mở bán", color: "blue" },
  ended: { label: "Đã kết thúc", color: "default" },
};

// "01/12 – 26/12/2026", "Từ 01/12/2026", "Đến 26/12/2026"; trống thì null
const vn = (d: string) => d.split("-").reverse().join("/");
export function rangeText(c: Pick<Concept, "startsOn" | "endsOn">) {
  const { startsOn: s, endsOn: e } = c;
  if (s && e) return s.slice(0, 4) === e.slice(0, 4) ? `${vn(s).slice(0, 5)} – ${vn(e)}` : `${vn(s)} – ${vn(e)}`;
  if (s) return `Từ ${vn(s)}`;
  if (e) return `Đến ${vn(e)}`;
  return null;
}

// Sản phẩm có concept (hiện) nhưng không concept nào đang trong mùa → web đang ẩn
export function outOfSeason(conceptIds: string[] | undefined, byId: Map<string, Concept>, today = todayVN()) {
  const visible = (conceptIds ?? []).flatMap((id) => byId.get(id) ?? []).filter((c) => !c.hidden);
  return visible.length > 0 && !visible.some((c) => ["always", "on"].includes(seasonOf(c, today)));
}
