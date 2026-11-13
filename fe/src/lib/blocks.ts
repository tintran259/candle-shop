// Các khối trang chủ sửa ở BO › Giao diện web (be/src/site-theme/blocks.ts): Câu chuyện, Nghệ thuật đốt nến, Gửi lời nhắn (ẩn / hiện được), chân trang.
// BE đã ghép giao diện concept lên Mặc định; ô còn trống thì dùng nội dung có sẵn (content/home.ts). Chữ nhiều dòng tách theo xuống dòng
import { care, contact, footer, story, type Photo } from "@/content/home";
import { cloudinaryFit } from "@/lib/shop";

export type StoryTheme = { hidden?: boolean; image?: string; eyebrow?: string; kicker?: string; title?: string; heading?: string; body?: string; cta?: string };
export type CareTheme = { hidden?: boolean; image?: string; title?: string; link?: string; steps?: { title?: string; text?: string }[] };
export type ContactTheme = { hidden?: boolean; image?: string; title?: string; heading?: string; text?: string };
export type FooterTheme = { image?: string; tagline?: string };
export type BlocksTheme = { story?: StoryTheme; care?: CareTheme; contact?: ContactTheme; footer?: FooterTheme };

const lines = (text: string | undefined, fallback: string[]) => (text ? text.split("\n").filter((l) => l.trim()) : fallback);
// Ảnh tải lên ở BO (Cloudinary, thu nhỏ theo khung) thay ảnh có sẵn, giữ chữ mô tả của ảnh có sẵn
const photo = (image: string | undefined, fallback: Photo, size: number): Photo => (image ? { ...fallback, src: cloudinaryFit(image, size) } : fallback);

export function storyContent(t: StoryTheme | undefined) {
  return {
    hidden: !!t?.hidden,
    eyebrow: t?.eyebrow || story.eyebrow,
    kicker: t?.kicker || story.kicker,
    title: lines(t?.title, story.title),
    heading: lines(t?.heading, story.heading),
    body: lines(t?.body, story.body),
    cta: { label: t?.cta || story.cta.label, href: story.cta.href },
    photo: photo(t?.image, story.photo, 1600),
  };
}
export type StoryContent = ReturnType<typeof storyContent>;

export function careContent(t: CareTheme | undefined) {
  return {
    hidden: !!t?.hidden,
    title: lines(t?.title, care.title),
    link: { label: t?.link || care.link.label, href: care.link.href },
    steps: care.steps.map((s, i) => ({ title: t?.steps?.[i]?.title || s.title, text: t?.steps?.[i]?.text || s.text })),
    photo: photo(t?.image, care.photo, 1200),
  };
}
export type CareContent = ReturnType<typeof careContent>;

export function contactContent(t: ContactTheme | undefined) {
  return {
    hidden: !!t?.hidden,
    title: lines(t?.title, contact.title),
    heading: t?.heading || contact.heading,
    text: t?.text || contact.text,
    photo: photo(t?.image, contact.photo, 1200),
  };
}
export type ContactContent = ReturnType<typeof contactContent>;

export const footerContent = (t: FooterTheme | undefined) => ({ tagline: t?.tagline || footer.tagline, photo: photo(t?.image, footer.photo, 1200) });
export type FooterContent = ReturnType<typeof footerContent>;
