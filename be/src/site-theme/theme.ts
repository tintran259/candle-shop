// Giao diện web (docs/pages/site-theme.md): danh sách giao diện — "Mặc định" (luôn có, id `default`) + các giao diện gắn với concept (dịp lễ).
// Mỗi giao diện có bản nháp + bản đã đăng riêng. Web dùng: concept KHÔNG ẨN đầu tiên (theo thứ tự trang Concept) đang trong mùa mà có
// giao diện ĐÃ ĐĂNG gắn với nó → ghép từng trường lên bản đã đăng của Mặc định (trường trống lấy của Mặc định; trống cả hai thì web dùng nội dung có sẵn)
import { inSeason } from '../concepts/season.js';

export const DEFAULT_THEME = 'default';
export const FOCUS = ['left', 'center', 'right'] as const;
export type Focus = (typeof FOCUS)[number];

export type HeroTheme = {
  image?: string;
  // Điểm lấy nét của ảnh khi bị cắt (điện thoại): trái / giữa / phải
  focus?: Focus;
  eyebrow?: string;
  // Tối đa 2 dòng, cách nhau bằng xuống dòng
  title?: string;
  text?: string;
  cta?: string;
  // Câu lớn ở dải tối dưới ảnh
  mark?: string;
};
export type ThemePart = { announcement?: string; logo?: { light?: string; dark?: string }; hero?: HeroTheme };
// Nội dung một giao diện: announcementOn chỉ ở Mặc định, conceptIds chỉ ở giao diện khác (mỗi concept thuộc tối đa một giao diện)
export type ThemeContent = ThemePart & { announcementOn?: boolean; conceptIds?: string[] };
export type ThemeRow = { id: string; published: ThemeContent | null };

type ConceptSeason = { id: string; hidden: boolean; startsOn: Date | null; endsOn: Date | null };

const pick = <T>(over: T | undefined, base: T | undefined) => (over !== undefined && over !== '' ? over : base);

// concepts: theo thứ tự trang Concept
export function resolveTheme(themes: ThemeRow[], concepts: ConceptSeason[], today: string) {
  const base = themes.find((t) => t.id === DEFAULT_THEME)?.published ?? {};
  const live = themes.filter((t) => t.id !== DEFAULT_THEME && t.published);
  let active: ThemeRow | undefined;
  let conceptId: string | null = null;
  for (const c of concepts.filter((c) => !c.hidden && inSeason(c, today))) {
    active = live.find((t) => t.published!.conceptIds?.includes(c.id));
    if (active) {
      conceptId = c.id;
      break;
    }
  }
  const over = active?.published ?? {};
  const hero: HeroTheme = {};
  for (const k of ['image', 'focus', 'eyebrow', 'title', 'text', 'cta', 'mark'] as const) {
    const v = pick(over.hero?.[k], base.hero?.[k]);
    if (v !== undefined && v !== '') (hero as Record<string, string>)[k] = v;
  }
  return {
    // Giao diện + concept đang áp dụng (null = Mặc định)
    themeId: active?.id ?? null,
    conceptId,
    announcementOn: base.announcementOn ?? true,
    announcement: pick(over.announcement, base.announcement) || undefined,
    logo: { light: pick(over.logo?.light, base.logo?.light) || undefined, dark: pick(over.logo?.dark, base.logo?.dark) || undefined },
    hero,
  };
}

export type ResolvedTheme = ReturnType<typeof resolveTheme>;
