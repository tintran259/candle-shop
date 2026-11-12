// Thời gian áp dụng giao diện web (docs/pages/site-theme.md): giao diện gắn concept chỉ lên web trong mùa của concept;
// gắn nhiều concept thì lên web trong mọi khoảng của các concept đó. Mặc định dùng khi không giao diện nào đang áp dụng
import { rangeText, seasonOf, type Concept } from "@/lib/products/concepts";
import { liveTheme, type SiteTheme } from "@/lib/site-theme/types";

const when = (c: Concept) => rangeText(c) ?? "mọi ngày";
const isNow = (c: Concept) => ["on", "always"].includes(seasonOf(c));

// Concept còn hiệu lực (hiện, chưa hết mùa), xếp theo ngày bắt đầu
export function activeConcepts(conceptIds: string[] | undefined, byId: Map<string, Concept>) {
  const list = (conceptIds ?? []).map((id) => byId.get(id)).filter((c): c is Concept => !!c);
  const active = list.filter((c) => !c.hidden && seasonOf(c) !== "ended").sort((a, b) => (a.startsOn ?? "").localeCompare(b.startsOn ?? ""));
  return { list, active, now: active.some(isNow) };
}

// Câu báo ở trang chi tiết. off: giao diện sẽ không lên web
export function scheduleText(conceptIds: string[] | undefined, byId: Map<string, Concept>): { text: string; now: boolean; off: boolean } {
  const { list, active, now } = activeConcepts(conceptIds, byId);
  if (!list.length) return { text: "Chưa gắn concept — giao diện sẽ không lên web.", now: false, off: true };
  if (!active.length) return { text: "Concept đã hết mùa hoặc đang ẩn — giao diện sẽ không lên web.", now: false, off: true };
  const text =
    active.length === 1
      ? `Giao diện sẽ tự lên web ${rangeText(active[0]) ? `vào ${rangeText(active[0])}` : "mọi ngày"}.`
      : `Giao diện sẽ tự lên web vào: ${active.map((c) => `${when(c)} (${c.name.vi})`).join("; ")}.`;
  return { text, now, off: false };
}

// Cột "Thời gian áp dụng" ở danh sách: mỗi dòng một khoảng
export function scheduleLines(t: SiteTheme, byId: Map<string, Concept>): string[] {
  if (t.isDefault) return ["Ngoài các dịp"];
  const { list, active } = activeConcepts((t.draft ?? t.published)?.conceptIds, byId);
  if (!list.length) return [];
  if (!active.length) return ["Hết mùa"];
  return active.map((c) => (active.length > 1 ? `${when(c)} (${c.name.vi})` : when(c)));
}

// Trạng thái: Đang sử dụng (web đang dùng) / Đang chờ (đã đăng, chưa tới thời gian áp dụng) / Hết mùa / Chưa gắn concept / Nháp chưa đăng
export function themeState(t: SiteTheme, themes: SiteTheme[], concepts: Concept[]): { label: string; color: string } {
  const liveId = liveTheme(themes, concepts)?.theme.id ?? themes.find((x) => x.isDefault)?.id;
  const draft = t.draft ? " · có nháp" : "";
  // Mặc định chưa đăng vẫn được web dùng (nội dung có sẵn)
  if (!t.published && !t.isDefault) return t.draft ? { label: "Nháp chưa đăng", color: "orange" } : { label: "Chưa có nội dung", color: "default" };
  if (t.id === liveId) return { label: `Đang sử dụng${draft}`, color: "green" };
  if (!t.isDefault) {
    const { list, active } = activeConcepts(t.published!.conceptIds, new Map(concepts.map((c) => [c.id, c])));
    if (!list.length) return { label: `Chưa gắn concept${draft}`, color: "default" };
    if (!active.length) return { label: `Hết mùa${draft}`, color: "default" };
  }
  return { label: `Đang chờ${draft}`, color: "blue" };
}
