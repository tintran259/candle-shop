// Các khối trang chủ sửa ở BO › Giao diện web ngoài hero / Xưởng nến (docs/pages/site-theme.md#các-khối-trang-chủ):
// Câu chuyện, Nghệ thuật đốt nến, Gửi lời nhắn (ẩn / hiện được) và chân trang (ảnh + khẩu hiệu).
// Chữ nhiều dòng (tiêu đề, câu dẫn, đoạn văn) ghi bằng xuống dòng. Ghép như hero: trường trống lấy của Mặc định, Mặc định trống thì web dùng nội dung có sẵn
export type StoryTheme = { hidden?: boolean; image?: string; eyebrow?: string; kicker?: string; title?: string; heading?: string; body?: string; cta?: string };
export type CareStep = { title?: string; text?: string };
export type CareTheme = { hidden?: boolean; image?: string; title?: string; link?: string; steps?: CareStep[] };
export type ContactTheme = { hidden?: boolean; image?: string; title?: string; heading?: string; text?: string };
export type FooterTheme = { image?: string; tagline?: string };
// Hiệu ứng trên hero theo dịp lễ: tuyết rơi (Noel), hoa mai / đào rơi hoặc hoa anh đào + mai + lì xì (Tết), tim bay (Valentine). enabled false = tắt (đè được Mặc định)
export const EFFECTS = ['snow', 'blossom', 'sakura', 'hearts'] as const;
export type EffectTheme = { enabled?: boolean; kind?: (typeof EFFECTS)[number] };
export type BlocksTheme = { story?: StoryTheme; care?: CareTheme; contact?: ContactTheme; footer?: FooterTheme; effect?: EffectTheme };

export const CARE_STEPS = 3;
// Giới hạn dòng: [số dòng tối đa, ký tự mỗi dòng] — vừa bố cục trang chủ
export const LINES = {
  storyTitle: [2, 20],
  storyHeading: [2, 30],
  storyBody: [3, 300],
  careTitle: [2, 20],
  contactTitle: [2, 20],
} as const;

const filled = (v: unknown) => v !== undefined && v !== '';

// Ghép từng trường: giao diện concept có thì dùng, trống thì lấy Mặc định; bỏ trường trống ở kết quả
function mergeFlat<T extends object>(over: T | undefined, base: T | undefined): T {
  const out: Record<string, unknown> = {};
  for (const k of new Set([...Object.keys(base ?? {}), ...Object.keys(over ?? {})])) {
    const o = (over as Record<string, unknown> | undefined)?.[k];
    const b = (base as Record<string, unknown> | undefined)?.[k];
    const v = filled(o) ? o : b;
    if (filled(v)) out[k] = v;
  }
  return out as T;
}

export function mergeBlocks(over: BlocksTheme | undefined, base: BlocksTheme | undefined) {
  const { steps: overSteps, ...careOver } = over?.care ?? {};
  const { steps: baseSteps, ...careBase } = base?.care ?? {};
  const steps = Array.from({ length: CARE_STEPS }, (_, i) => mergeFlat(overSteps?.[i], baseSteps?.[i]));
  return {
    story: mergeFlat(over?.story, base?.story),
    care: { ...mergeFlat(careOver, careBase), ...(steps.some((s) => Object.keys(s).length) && { steps }) } as CareTheme,
    contact: mergeFlat(over?.contact, base?.contact),
    footer: mergeFlat(over?.footer, base?.footer),
    effect: mergeFlat(over?.effect, base?.effect),
  };
}

// Kiểm tra số dòng / ký tự mỗi dòng; trả câu lỗi tiếng Việt hoặc null
export function checkLines(b: BlocksTheme): string | null {
  const rules: [string | undefined, keyof typeof LINES, string][] = [
    [b.story?.title, 'storyTitle', 'Tên khối Câu chuyện'],
    [b.story?.heading, 'storyHeading', 'Câu dẫn Câu chuyện'],
    [b.story?.body, 'storyBody', 'Đoạn văn Câu chuyện'],
    [b.care?.title, 'careTitle', 'Tên khối Nghệ thuật đốt nến'],
    [b.contact?.title, 'contactTitle', 'Tên khối Gửi lời nhắn'],
  ];
  for (const [text, key, label] of rules) {
    if (!text) continue;
    const [maxLines, maxChars] = LINES[key];
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length > maxLines || lines.some((l) => l.trim().length > maxChars)) return `${label} tối đa ${maxLines} dòng, mỗi dòng ${maxChars} ký tự.`;
  }
  return null;
}
