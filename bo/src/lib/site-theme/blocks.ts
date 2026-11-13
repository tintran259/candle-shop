// Các khối trang chủ ngoài hero / Xưởng nến (docs/pages/site-theme.md#các-khối-trang-chủ) — cùng dạng với BE (be/src/site-theme/blocks.ts):
// Câu chuyện, Nghệ thuật đốt nến, Gửi lời nhắn (ẩn / hiện được) và chân trang. Chữ nhiều dòng ghi bằng xuống dòng
export type StoryTheme = { hidden?: boolean; image?: string; eyebrow?: string; kicker?: string; title?: string; heading?: string; body?: string; cta?: string };
export type CareStep = { title?: string; text?: string };
export type CareTheme = { hidden?: boolean; image?: string; title?: string; link?: string; steps?: CareStep[] };
export type ContactTheme = { hidden?: boolean; image?: string; title?: string; heading?: string; text?: string };
export type FooterTheme = { image?: string; tagline?: string };
// Hiệu ứng trên hero theo dịp lễ (be/src/site-theme/blocks.ts EFFECTS); enabled false = tắt (đè được Mặc định)
export type EffectKind = "snow" | "blossom" | "hearts";
export type EffectTheme = { enabled?: boolean; kind?: EffectKind };
export const effectLabels: Record<EffectKind, string> = { snow: "Tuyết rơi — Noel", blossom: "Hoa mai, đào rơi — Tết", hearts: "Tim bay — Valentine" };
export type BlocksTheme = { story?: StoryTheme; care?: CareTheme; contact?: ContactTheme; footer?: FooterTheme; effect?: EffectTheme };
export type BlockKey = "story" | "care" | "contact" | "footer";

export const CARE_STEPS = 3;

// Giới hạn — khớp BE (blocks.dto.ts, LINES trong blocks.ts). lines: [số dòng, ký tự mỗi dòng]
export const BLOCK_LIMITS = {
  story: { eyebrow: 60, kicker: 40, cta: 40, title: [2, 20], heading: [2, 30], body: [3, 300] },
  care: { link: 50, stepTitle: 40, stepText: 160, title: [2, 20] },
  contact: { heading: 60, text: 200, title: [2, 20] },
  footer: { tagline: 60 },
} as const;

// Nội dung có sẵn của web (chép từ fe/src/content/home.ts — đổi ở web thì đổi ở đây): chữ gợi ý + khung xem trước
export const blockDefaults = {
  story: {
    eyebrow: "Bàn tay chúng tôi. Nghi thức nhỏ của bạn.",
    kicker: "Tạo nên bầu không khí",
    title: "Câu\nchuyện",
    heading: "Làm chậm rãi.\nĐể sống trọn vẹn.",
    body: "Chúng tôi tin những nghi thức nhỏ nhất cũng có thể làm một ngày trở nên khác đi. Một mùi hương quen. Một ánh nến lay động. Một khoảnh khắc chỉ của riêng bạn.\nVì vậy chúng tôi gửi chút tâm huyết vào từng hũ nến: sáp đậu nành tự nhiên, mùi hương được chọn kỹ và những chiếc hũ đáng để giữ lại.",
    cta: "Thêm một chút về chúng tôi",
    image: "/site-preview/story.jpg",
  },
  care: {
    title: "Nghệ thuật\nđốt nến",
    link: "Mẹo nhỏ. Ánh nến bền lâu.",
    steps: [
      { title: "Cắt tỉa bấc", text: "Giữ bấc dài khoảng 0,5 cm trước mỗi lần đốt để ngọn lửa êm và sạch hơn." },
      { title: "Để nến cháy đủ lâu", text: "Ở lần đốt đầu tiên, hãy để sáp tan đều tới sát thành hũ." },
      { title: "Giữ lại chiếc hũ", text: "Khi nến đã cháy hết, hãy cho chiếc hũ gốm một cuộc đời thứ hai." },
    ],
    image: "/site-preview/care.jpg",
  },
  contact: {
    title: "Gửi\nlời nhắn",
    heading: "Cần tư vấn chọn nến hay đặt quà?",
    text: "Để lại lời nhắn, chúng tôi sẽ nhắn Zalo hoặc gọi lại cho bạn trong ngày.",
    image: "/site-preview/newsletter.jpg",
  },
  footer: { tagline: "Nến chăm chút. Nghi thức ấm áp.", image: "/site-preview/footer.jpg" },
};

const filled = (v: unknown) => v !== undefined && v !== "";

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

// Ghép giao diện concept lên Mặc định (như BE): trường trống lấy của Mặc định, bước Nghệ thuật đốt nến ghép theo vị trí
export function mergeBlocks(over: BlocksTheme | undefined, base: BlocksTheme | undefined): Required<BlocksTheme> {
  const { steps: overSteps, ...careOver } = over?.care ?? {};
  const { steps: baseSteps, ...careBase } = base?.care ?? {};
  const steps = Array.from({ length: CARE_STEPS }, (_, i) => mergeFlat(overSteps?.[i], baseSteps?.[i]));
  return {
    story: mergeFlat(over?.story, base?.story),
    care: { ...mergeFlat(careOver, careBase), ...(steps.some((s) => Object.keys(s).length) && { steps }) },
    contact: mergeFlat(over?.contact, base?.contact),
    footer: mergeFlat(over?.footer, base?.footer),
    effect: mergeFlat(over?.effect, base?.effect),
  };
}

// Số dòng / ký tự mỗi dòng (như BE) — dùng cho kiểm tra ô nhập
export const lineRule = ([maxLines, maxChars]: readonly [number, number]) => ({
  validator: (_: unknown, v?: string) => {
    const lines = (v ?? "").split("\n").filter((l) => l.trim());
    return lines.length > maxLines || lines.some((l) => l.trim().length > maxChars) ? Promise.reject(new Error(`Tối đa ${maxLines} dòng, mỗi dòng ${maxChars} ký tự.`)) : Promise.resolve();
  },
});
